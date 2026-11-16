import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Search,
  User,
  MapPin,
  ShoppingBag,
  Receipt,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  X,
  RotateCcw,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { customerApi } from '../../api';
import { Customer } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface CustomerLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMode?: 'catalogue' | 'custom';
  onSelectCustomer?: (customer: Customer) => void;
  onOpenReturns?: (invoiceNumber?: string, phone?: string) => void;
}

export const CustomerLookupModal: React.FC<CustomerLookupModalProps> = ({
  isOpen,
  onClose,
  targetMode = 'catalogue',
  onSelectCustomer,
  onOpenReturns,
}) => {
  const { shop } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    found: boolean;
    phone?: string;
    customer?: Customer;
    summary?: {
      total_shopping: number;
      total_bills: number;
      current_balance: number;
      total_paid: number;
      credit_limit: number;
    };
    recent_bills?: any[];
  } | null>(null);

  // New customer quick-registration state
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newGstin, setNewGstin] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [createError, setCreateError] = useState('');

  // Search debounce and in-flight request tracker
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inFlightRef = useRef<string | null>(null);

  // Helper to read local cache
  const getCachedCustomers = (): Customer[] => {
    try {
      const cached = localStorage.getItem('shopbill_cached_customers');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  };

  // 0ms instant local customer finder
  const findCustomerInLocalCache = (phoneNumber: string): Customer | null => {
    const clean = phoneNumber.replace(/\D/g, '');
    const last10 = clean.length >= 10 ? clean.slice(-10) : clean;
    if (!last10 || last10.length < 6) return null;

    const list = getCachedCustomers();
    return (
      list.find((c) => {
        if (!c.phone) return false;
        const cClean = c.phone.replace(/\D/g, '');
        const cLast10 = cClean.length >= 10 ? cClean.slice(-10) : cClean;
        return cClean === clean || cLast10 === last10 || c.phone.includes(last10);
      }) || null
    );
  };

  // Reset when modal opens & pre-warm cache
  useEffect(() => {
    if (isOpen) {
      setPhone('');
      setLookupResult(null);
      setNewName('');
      setNewAddress('');
      setNewGstin('');
      setCreateError('');
      inFlightRef.current = null;
    }
    // Warm up the local customer cache
    try {
      customerApi.list({ per_page: 200 }).then((res: any) => {
        if (res.data?.customers) {
          localStorage.setItem('shopbill_cached_customers', JSON.stringify(res.data.customers));
        }
      }).catch(() => {});
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  const currency = shop?.currency_symbol || '₹';

  // Background server fetch to sync latest detailed history without blocking the user
  const fetchCustomerDetailsAsync = async (phoneNumber: string, expectNew = false) => {
    const clean = phoneNumber.replace(/\D/g, '');
    if (inFlightRef.current === clean) return;
    inFlightRef.current = clean;

    try {
      const res = await customerApi.lookupByPhone(phoneNumber);
      if (res.data) {
        if (res.data.found) {
          setLookupResult(res.data);
        } else if (!expectNew) {
          setLookupResult({ found: false, phone: phoneNumber });
          setNewName('');
        }
      }
    } catch (err) {
      // Ignore background fetch error
    } finally {
      if (inFlightRef.current === clean) {
        inFlightRef.current = null;
      }
    }
  };

  const handleSearch = async (phoneNumberToSearch?: string) => {
    const p = (phoneNumberToSearch || phone).trim();
    if (!p || p.length < 3) return;

    const clean = p.replace(/\D/g, '');

    // 1. Check local cache first (0ms instant!)
    const localCust = findCustomerInLocalCache(p);
    if (localCust) {
      setLookupResult({
        found: true,
        customer: localCust,
        summary: {
          total_shopping: Number(localCust.total_purchases || 0),
          total_bills: 0,
          current_balance: Number(localCust.current_balance || 0),
          total_paid: Math.max(
            0,
            Number(localCust.total_purchases || 0) - Number(localCust.current_balance || 0)
          ),
          credit_limit: Number(localCust.credit_limit || 0),
        },
        recent_bills: [],
      });
      // Fetch full server stats in background
      fetchCustomerDetailsAsync(p);
      return;
    }

    // 2. If 10 digits entered and not in cache, show New Customer registration in 0ms!
    if (clean.length === 10) {
      setLookupResult({
        found: false,
        phone: p,
      });
      setNewName('');
      fetchCustomerDetailsAsync(p, true);
      return;
    }

    // 3. Fallback to API for partial phone numbers
    if (inFlightRef.current === clean) return;
    inFlightRef.current = clean;
    setLoading(true);
    setCreateError('');

    try {
      const res = await customerApi.lookupByPhone(p);
      setLookupResult(res.data);
      if (!res.data.found) {
        setNewName('');
      }
    } catch (err) {
      console.error('Customer lookup failed:', err);
    } finally {
      setLoading(false);
      inFlightRef.current = null;
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const clean = val.replace(/\D/g, '');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Auto-search immediately in 0ms when 10 digits entered
    if (clean.length === 10) {
      // 1. Instant local match
      const localCust = findCustomerInLocalCache(val);
      if (localCust) {
        setLookupResult({
          found: true,
          customer: localCust,
          summary: {
            total_shopping: Number(localCust.total_purchases || 0),
            total_bills: 0,
            current_balance: Number(localCust.current_balance || 0),
            total_paid: Math.max(
              0,
              Number(localCust.total_purchases || 0) - Number(localCust.current_balance || 0)
            ),
            credit_limit: Number(localCust.credit_limit || 0),
          },
          recent_bills: [],
        });
        fetchCustomerDetailsAsync(val);
        return;
      }

      // 2. Instant new customer registration in 0ms (no blocking spinner!)
      setLookupResult({
        found: false,
        phone: val,
      });
      setNewName('');
      fetchCustomerDetailsAsync(val, true);
    } else if (clean.length < 10 && lookupResult) {
      setLookupResult(null);
    }
  };

  const handleProceedToBilling = (cust?: Customer) => {
    const customerToUse = cust || lookupResult?.customer;
    if (onSelectCustomer) {
      if (customerToUse) {
        onSelectCustomer(customerToUse);
      } else if (phone.trim()) {
        onSelectCustomer({
          id: 0,
          shop_id: shop?.id || 0,
          name: newName.trim() || 'Walk-in Customer',
          phone: phone.trim(),
          address: newAddress.trim() || undefined,
          gstin: newGstin.trim() || undefined,
          credit_limit: 0,
          current_balance: 0,
          total_purchases: 0,
        });
      }
      onClose();
    } else if (customerToUse) {
      navigate(
        `/billing?mode=${targetMode}&customerId=${customerToUse.id}&customerName=${encodeURIComponent(
          customerToUse.name
        )}&customerPhone=${encodeURIComponent(customerToUse.phone || '')}`
      );
      onClose();
    } else {
      navigate(
        `/billing?mode=${targetMode}${
          phone.trim() ? `&customerPhone=${encodeURIComponent(phone.trim())}` : ''
        }`
      );
      onClose();
    }
  };

  const handleCreateNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError('Please enter customer name');
      return;
    }

    const trimmedName = newName.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = newAddress.trim() || undefined;
    const cleanGstin = newGstin.trim() || undefined;

    // 0ms instant optimistic customer creation
    const tempCustomer: Customer = {
      id: Date.now(),
      shop_id: shop?.id || 0,
      name: trimmedName,
      phone: cleanPhone || undefined,
      address: cleanAddress,
      gstin: cleanGstin,
      credit_limit: 0,
      current_balance: 0,
      total_purchases: 0,
    };

    // Update local cache immediately
    const currentCached = getCachedCustomers();
    localStorage.setItem(
      'shopbill_cached_customers',
      JSON.stringify([tempCustomer, ...currentCached])
    );

    // Proceed to billing immediately in 0ms!
    handleProceedToBilling(tempCustomer);

    // Background sync without blocking user
    customerApi
      .create({
        name: trimmedName,
        phone: cleanPhone || null,
        address: cleanAddress,
        gstin: cleanGstin,
      })
      .then((res) => {
        if (res.data?.customer) {
          const realCustomer = res.data.customer;
          const updated = getCachedCustomers().map((c) =>
            c.id === tempCustomer.id ? realCustomer : c
          );
          localStorage.setItem('shopbill_cached_customers', JSON.stringify(updated));
        }
      })
      .catch((err) => {
        console.warn('Background customer save error:', err);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-transparent to-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Customer Mobile Lookup & Khata
              </h2>
              <p className="text-xs text-slate-500">
                Enter phone number to fetch shopping history, udhaar balance, or create new account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Customer Mobile Number <span className="text-emerald-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  autoFocus
                  placeholder="e.g. 9876543210 (10 Digits)"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  className="w-full pl-12 pr-4 py-2.5 text-sm font-mono font-bold tracking-wider rounded-xl border-2 border-emerald-500/50 focus:border-emerald-500 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={loading || !phone.trim()}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
              >
                {loading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Check History</span>
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* CASE 1: EXISTING CUSTOMER FOUND WITH FULL SHOPPING & UDHAAR  */}
          {/* ============================================================ */}
          {lookupResult?.found && lookupResult.customer && (
            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow">
                    {lookupResult.customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {lookupResult.customer.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Existing Customer
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Phone: {lookupResult.customer.phone || 'N/A'} • {lookupResult.customer.address || 'Address: Not Saved'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Metrics: Total Shopping, Total Bills, Udhaar, Total Paid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Total Shopping */}
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3 text-blue-500" />
                    कुल खरीदारी (Shopping)
                  </p>
                  <p className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white mt-1">
                    {currency}{Number(lookupResult.summary?.total_shopping || 0).toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Total Bills */}
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                    <Receipt className="w-3 h-3 text-emerald-500" />
                    कुल बिल (Bills)
                  </p>
                  <p className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white mt-1">
                    {lookupResult.summary?.total_bills || 0} Bills
                  </p>
                </div>

                {/* Udhaar / Balance Due */}
                <div
                  className={`p-3 rounded-xl border ${
                    Number(lookupResult.summary?.current_balance || 0) > 0
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  <p
                    className={`text-[10px] font-bold uppercase flex items-center gap-1 ${
                      Number(lookupResult.summary?.current_balance || 0) > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    <Wallet className="w-3 h-3" />
                    बाकी उधार (Udhaar)
                  </p>
                  <p
                    className={`text-base sm:text-lg font-black font-mono mt-1 ${
                      Number(lookupResult.summary?.current_balance || 0) > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {currency}{Number(lookupResult.summary?.current_balance || 0).toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Total Paid */}
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    जमा राशि (Paid)
                  </p>
                  <p className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white mt-1">
                    {currency}{Number(lookupResult.summary?.total_paid || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleProceedToBilling()}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <span>Continue to Billing (नया बिल बनाएं)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {onOpenReturns && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenReturns(undefined, phone);
                      onClose();
                    }}
                    className="py-3 px-4 rounded-xl border-2 border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span>Return / Return Item (सामान वापस करें)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* CASE 2: NEW CUSTOMER REGISTRATION FORM (SHOWN INSTANTLY 0ms) */}
          {/* ============================================================ */}
          {lookupResult && !lookupResult.found && (
            <form
              onSubmit={handleCreateNewCustomer}
              className="bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-500/30 rounded-2xl p-4 sm:p-5 space-y-3 animate-fade-in"
            >
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <UserPlus className="w-5 h-5" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    New Customer • कोई पुराना रिकॉर्ड नहीं मिला
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Enter customer name to save account and create bill instantly
                  </p>
                </div>
              </div>

              {createError && (
                <div className="p-2 text-xs text-rose-600 bg-rose-50 rounded-lg">
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="e.g. Ramesh Sharma"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone (Pre-filled)
                  </label>
                  <input
                    type="tel"
                    readOnly
                    value={phone}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Address (Optional)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Shop 4, Gandhi Chowk"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {shop?.is_gst_registered && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 08AAACH1234F1Z5"
                    value={newGstin}
                    onChange={(e) => setNewGstin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  disabled={creatingCustomer || !newName.trim()}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  {creatingCustomer ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Save Account & Create Bill</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleProceedToBilling()}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Skip Saving (Walk-in Cash Bill)
                </button>
              </div>
            </form>
          )}

          {/* Quick Skip for Direct Walk-in */}
          {!lookupResult && (
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
              <span>Customer does not want to give mobile number?</span>
              <button
                type="button"
                onClick={() => handleProceedToBilling()}
                className="font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
              >
                Proceed as Walk-in Customer &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
