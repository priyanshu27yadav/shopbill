import React, { useState, useEffect } from 'react';
import {
  Phone,
  Search,
  User,
  MapPin,
  ShoppingBag,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  X,
  CreditCard,
  Clock,
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

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhone('');
      setLookupResult(null);
      setNewName('');
      setNewAddress('');
      setNewGstin('');
      setCreateError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currency = shop?.currency_symbol || '₹';

  const handleSearch = async (phoneNumberToSearch?: string) => {
    const p = (phoneNumberToSearch || phone).trim();
    if (!p || p.length < 3) return;

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
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    // Auto-search if 10 digits entered
    const clean = val.replace(/\D/g, '');
    if (clean.length === 10) {
      handleSearch(val);
    } else if (clean.length < 10 && lookupResult) {
      setLookupResult(null);
    }
  };

  const handleProceedToBilling = (cust?: Customer) => {
    const customerToUse = cust || lookupResult?.customer;
    if (onSelectCustomer && customerToUse) {
      onSelectCustomer(customerToUse);
      onClose();
    } else if (customerToUse) {
      navigate(`/billing?mode=${targetMode}&customerId=${customerToUse.id}&customerName=${encodeURIComponent(customerToUse.name)}&customerPhone=${encodeURIComponent(customerToUse.phone || '')}`);
      onClose();
    } else {
      // Walk-in without customer
      navigate(`/billing?mode=${targetMode}`);
      onClose();
    }
  };

  const handleCreateNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError('Please enter customer name');
      return;
    }

    setCreatingCustomer(true);
    setCreateError('');
    try {
      const res = await customerApi.create({
        name: newName.trim(),
        phone: phone.trim() || null,
        address: newAddress.trim() || null,
        gstin: newGstin.trim() || null,
      });

      const created = res.data.customer;
      handleProceedToBilling(created);
    } catch (err: any) {
      console.error('Failed to create customer:', err);
      setCreateError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setCreatingCustomer(false);
    }
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
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all shrink-0"
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
                <div className={`p-3 rounded-xl border ${
                  Number(lookupResult.summary?.current_balance || 0) > 0
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                }`}>
                  <p className={`text-[10px] font-bold uppercase flex items-center gap-1 ${
                    Number(lookupResult.summary?.current_balance || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    <Wallet className="w-3 h-3" />
                    बाकी उधार (Udhaar)
                  </p>
                  <p className={`text-base sm:text-lg font-black font-mono mt-1 ${
                    Number(lookupResult.summary?.current_balance || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
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

              {/* Recent Bills of this Customer */}
              {lookupResult.recent_bills && lookupResult.recent_bills.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Previous Purchase History ({lookupResult.recent_bills.length} Recent Bills)
                    </h4>
                    {onOpenReturns && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenReturns(undefined, lookupResult.customer?.phone);
                          onClose();
                        }}
                        className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Return Items from Bill &rarr;
                      </button>
                    )}
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {lookupResult.recent_bills.map((bill: any) => (
                      <div
                        key={bill.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {bill.invoice_number}
                          </span>
                          <span className="text-slate-400 text-[11px] ml-2">
                            {new Date(bill.invoice_date).toLocaleDateString('en-IN')}
                          </span>
                          <span className="text-slate-500 text-[11px] ml-2">
                            ({bill.items?.length || 0} items)
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {currency}{Number(bill.final_amount).toLocaleString('en-IN')}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            bill.payment_status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {bill.payment_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2 border-t border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => handleProceedToBilling()}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Start New Bill for {lookupResult.customer.name} &rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* CASE 2: NEW CUSTOMER (NOT FOUND) -> INSTANT REGISTRATION     */}
          {/* ============================================================ */}
          {lookupResult && !lookupResult.found && (
            <form onSubmit={handleCreateNewCustomer} className="bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-500/30 rounded-2xl p-4 sm:p-5 space-y-3 animate-fade-in">
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
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all"
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
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
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
                className="font-bold text-emerald-600 hover:text-emerald-700 underline"
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
