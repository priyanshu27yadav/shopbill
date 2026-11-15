import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  DollarSign,
  Phone,
  MapPin,
  Clock,
  ArrowUpRight,
  X,
  CreditCard,
  FileText,
  AlertCircle,
  Eye,
  CheckCircle,
  Package,
  Receipt,
  ArrowDownLeft,
  Loader2,
} from 'lucide-react';
import { customerApi, invoiceApi, settingsApi } from '../../api';
import { Customer, Invoice } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PrintInvoiceModal } from '../Billing/PrintInvoiceModal';

export const CustomerList: React.FC = () => {
  const { shop } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUdhaarOnly, setFilterUdhaarOnly] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [collectPaymentCustomer, setCollectPaymentCustomer] = useState<Customer | null>(null);
  const [viewHistoryCustomer, setViewHistoryCustomer] = useState<Customer | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [customerPayments, setCustomerPayments] = useState<any[]>([]);
  const [ledgerTab, setLedgerTab] = useState<'bills' | 'payments'>('bills');
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Invoice | null>(null);
  const [invoiceSettings, setInvoiceSettings] = useState<any>(null);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<number | null>(null);

  // Collect Payment Form
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payRef, setPayRef] = useState('');

  // Add Customer Form
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    credit_limit: '5000',
    opening_balance: '0',
  });

  useEffect(() => {
    loadCustomers();
  }, [shop]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerApi.list({ per_page: 100 });
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name.trim()) return;

    try {
      const res = await customerApi.create({
        ...newCustomer,
        credit_limit: parseFloat(newCustomer.credit_limit) || 0,
        opening_balance: parseFloat(newCustomer.opening_balance) || 0,
      });
      setCustomers([res.data.customer, ...customers]);
      setShowAddModal(false);
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        address: '',
        gstin: '',
        credit_limit: '5000',
        opening_balance: '0',
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating customer.');
    }
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectPaymentCustomer || !payAmount || parseFloat(payAmount) <= 0) return;

    try {
      const res = await customerApi.collectPayment(collectPaymentCustomer.id, {
        amount: parseFloat(payAmount),
        payment_method: payMethod,
        reference_number: payRef || null,
      });
      alert(res.data.message);
      const updatedCust = { ...collectPaymentCustomer, current_balance: res.data.updated_balance };
      setCollectPaymentCustomer(null);
      setPayAmount('');
      setPayRef('');
      loadCustomers();
      if (viewHistoryCustomer && viewHistoryCustomer.id === collectPaymentCustomer.id) {
        handleOpenHistory(updatedCust);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record payment.');
    }
  };

  const handleOpenHistory = async (c: Customer) => {
    setViewHistoryCustomer(c);
    setLedgerTab('bills');
    try {
      const res = await customerApi.get(c.id);
      setViewHistoryCustomer(res.data.customer || c);
      setCustomerInvoices(res.data.invoices || []);
      setCustomerPayments(res.data.payments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewInvoiceFromLedger = async (invId: number) => {
    setLoadingInvoiceId(invId);
    try {
      const [invRes, setRes] = await Promise.all([
        invoiceApi.get(invId),
        settingsApi.get().catch(() => null),
      ]);
      setSelectedInvoiceForModal(invRes.data.invoice);
      if (setRes?.data?.invoice_settings) {
        setInvoiceSettings(setRes.data.invoice_settings);
      } else if (invRes.data.settings) {
        setInvoiceSettings(invRes.data.settings);
      }
    } catch (err) {
      console.error('Error loading bill from ledger:', err);
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const filtered = customers.filter((c) => {
    const matchSearch =
      searchTerm === '' ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm));
    const matchUdhaar = !filterUdhaarOnly || Number(c.current_balance) > 0;
    return matchSearch && matchUdhaar;
  });

  const totalUdhaar = customers.reduce((sum, c) => sum + Math.max(0, Number(c.current_balance)), 0);
  const currency = shop?.currency_symbol || '₹';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Customer & Udhaar Ledger (Khata)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track customer profiles, purchase history, and collect pending credit balances.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase">Total Customers</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {customers.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-sm bg-rose-50/20 dark:bg-rose-950/20">
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold uppercase">
            Total Udhaar (Outstanding)
          </p>
          <p className="text-2xl font-black text-rose-600 font-mono mt-1">
            {currency}{totalUdhaar.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase">Debtor Accounts</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {customers.filter((c) => Number(c.current_balance) > 0).length}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by customer name or mobile number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
          <input
            type="checkbox"
            checked={filterUdhaarOnly}
            onChange={(e) => setFilterUdhaarOnly(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
          />
          <span>Show Pending Udhaar Only</span>
        </label>
      </div>

      {/* Customers List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Total Purchases</th>
                <th className="py-3 px-4 text-right">Credit Balance (Udhaar)</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((c) => {
                const bal = Number(c.current_balance);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{c.name}</p>
                      {c.address && <p className="text-[10px] text-slate-400 truncate max-w-xs">{c.address}</p>}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {c.phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {currency}{Number(c.total_purchases).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {bal > 0 ? (
                        <span className="font-extrabold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                          {currency}{bal.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {currency}{Number(c.credit_limit).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {bal > 0 && (
                        <button
                          onClick={() => {
                            setCollectPaymentCustomer(c);
                            setPayAmount(bal.toString());
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                        >
                          Collect Payment
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenHistory(c)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Ledger
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {collectPaymentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Collect Udhaar Payment
                </h3>
                <p className="text-xs text-slate-400">{collectPaymentCustomer.name}</p>
              </div>
              <button onClick={() => setCollectPaymentCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCollectPayment} className="space-y-3">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs">
                <span className="text-rose-700 dark:text-rose-300 font-bold">
                  Outstanding Balance:{' '}
                </span>
                <span className="font-extrabold font-mono text-rose-700 dark:text-rose-300">
                  {currency}{collectPaymentCustomer.current_balance}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount Received ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method *
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white uppercase font-bold"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / QR</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer / NEFT</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reference No. / UTR / Cheque (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref 439281928"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCollectPaymentCustomer(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Customer Khata & Udhaar Ledger Modal */}
      {viewHistoryCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                    Khata & Udhaar Ledger: {viewHistoryCustomer.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  📞 {viewHistoryCustomer.phone || 'No phone recorded'} • 📍 {viewHistoryCustomer.address || 'Counter Customer'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {Number(viewHistoryCustomer.current_balance) > 0 && (
                  <button
                    onClick={() => {
                      setCollectPaymentCustomer(viewHistoryCustomer);
                      setPayAmount(viewHistoryCustomer.current_balance.toString());
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Collect Udhaar</span>
                  </button>
                )}
                <button
                  onClick={() => setViewHistoryCustomer(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Ledger Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Purchases (कुल खरीदारी)</span>
                <p className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  {currency}{Number(viewHistoryCustomer.total_purchases || 0).toFixed(2)}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Total Payments Recorded</span>
                <p className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {currency}{customerPayments.reduce((s, p) => s + Number(p.amount || 0), 0).toFixed(2)}
                </p>
              </div>

              <div className={`p-3 rounded-xl border ${
                Number(viewHistoryCustomer.current_balance) > 0
                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                  : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40'
              }`}>
                <span className={`text-[10px] font-bold uppercase ${
                  Number(viewHistoryCustomer.current_balance) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                }`}>
                  Current Udhaar (बकाया उधार)
                </span>
                <p className={`text-lg font-black font-mono mt-0.5 ${
                  Number(viewHistoryCustomer.current_balance) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-300'
                }`}>
                  {Number(viewHistoryCustomer.current_balance) > 0
                    ? `${currency}${Number(viewHistoryCustomer.current_balance).toFixed(2)}`
                    : `${currency}0.00 (All Cleared / चुकता)`}
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-3 gap-2">
              <button
                onClick={() => setLedgerTab('bills')}
                className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-bold border-b-2 transition-all ${
                  ledgerTab === 'bills'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Bills & Purchases (खरीदारी बिल - {customerInvoices.length})</span>
              </button>

              <button
                onClick={() => setLedgerTab('payments')}
                className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-bold border-b-2 transition-all ${
                  ledgerTab === 'payments'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Payment Receipts (जमा रसीदें - {customerPayments.length})</span>
              </button>
            </div>

            {/* Tab 1: Bills & Purchases */}
            {ledgerTab === 'bills' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {customerInvoices.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-12">No purchases or bills recorded yet.</p>
                ) : (
                  customerInvoices.map((inv) => {
                    const finalAmt = Number(inv.final_amount || 0);
                    const paidAmt = Number(inv.amount_paid || 0);
                    const dueAmt = Number(inv.balance_due || 0);
                    const payments = inv.payments || [];
                    const isFullyCleared = dueAmt === 0;

                    return (
                      <div
                        key={inv.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5 transition-all hover:border-emerald-300 dark:hover:border-emerald-700"
                      >
                        {/* Bill Header */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold font-mono text-emerald-600 text-sm">
                              {inv.invoice_number}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {new Date(inv.invoice_date).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                isFullyCleared
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {isFullyCleared ? 'Paid in Full' : `Due: ${currency}${dueAmt.toFixed(2)}`}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleViewInvoiceFromLedger(inv.id)}
                              disabled={loadingInvoiceId === inv.id}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors shadow-xs"
                            >
                              {loadingInvoiceId === inv.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                              <span>View Bill</span>
                            </button>
                          </div>
                        </div>

                        {/* Items Snippet */}
                        {inv.items && inv.items.length > 0 && (
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Items Purchased:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {inv.items.map((it: any, i: number) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 text-[11px] bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                                >
                                  <Package className="w-3 h-3 text-slate-400" />
                                  <span>{it.item_name} ({Number(it.quantity)} {it.unit})</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Financial Ledger Breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Total Bill Amount</span>
                            <span className="font-extrabold font-mono text-slate-900 dark:text-white">
                              {currency}{finalAmt.toFixed(2)}
                            </span>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Paid at Purchase</span>
                            <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                              {currency}{Number(payments[0]?.amount || paidAmt).toFixed(2)}
                            </span>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] text-emerald-600 block">Due Paid Later</span>
                            <span className="font-bold font-mono text-emerald-600">
                              {payments.length > 1
                                ? `${currency}${payments.slice(1).reduce((s: number, p: any) => s + Number(p.amount || 0), 0).toFixed(2)}`
                                : `${currency}0.00`}
                            </span>
                          </div>

                          <div className={`p-2 rounded-lg border ${
                            dueAmt > 0
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-700'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700'
                          }`}>
                            <span className="text-[10px] block">Balance Remaining</span>
                            <span className="font-extrabold font-mono">
                              {dueAmt > 0 ? `${currency}${dueAmt.toFixed(2)}` : '₹0.00 (चुकता)'}
                            </span>
                          </div>
                        </div>

                        {/* List individual payments linked to this bill */}
                        {payments.length > 0 && (
                          <div className="pt-1 border-t border-slate-200 dark:border-slate-800 space-y-1">
                            <p className="text-[10px] font-bold uppercase text-slate-400">Payment History for this Bill:</p>
                            {payments.map((p: any, pIdx: number) => (
                              <div
                                key={p.id || pIdx}
                                className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 px-2 py-1 rounded"
                              >
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                                  <span className="font-semibold">
                                    {pIdx === 0 ? 'Purchase Payment' : 'Due Settlement'}:
                                  </span>
                                  <span className="text-slate-400">
                                    {new Date(p.payment_date).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })}{' '}
                                    via {p.payment_method?.toUpperCase()}
                                  </span>
                                </span>
                                <span className="font-mono font-bold text-emerald-600">
                                  + {currency}{Number(p.amount).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 2: Payment Receipts */}
            {ledgerTab === 'payments' && (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {customerPayments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-12">No payments received yet.</p>
                ) : (
                  customerPayments.map((p: any) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-slate-800 dark:text-slate-100">
                            {p.payment_number}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {p.payment_type === 'due_clearance' ? 'Due Clearance' : 'Payment'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(p.payment_date).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}{' '}
                          • Mode: <span className="uppercase font-semibold">{p.payment_method}</span>
                          {p.reference_number && ` • Ref: ${p.reference_number}`}
                        </p>
                        {p.notes && <p className="text-[11px] text-slate-500 italic">{p.notes}</p>}
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                          + {currency}{Number(p.amount).toFixed(2)}
                        </span>
                        {p.invoice?.invoice_number && (
                          <p className="text-[10px] font-mono text-slate-400">
                            Bill: {p.invoice.invoice_number}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bill View / Print Modal from Customer Ledger */}
      {selectedInvoiceForModal && (
        <PrintInvoiceModal
          invoice={selectedInvoiceForModal}
          shop={shop || null}
          settings={invoiceSettings}
          onClose={() => setSelectedInvoiceForModal(null)}
        />
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">New Customer Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="text"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="98XXXXXXXX"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCustomer.gstin}
                    onChange={(e) => setNewCustomer({ ...newCustomer, gstin: e.target.value })}
                    placeholder="29XXXXX..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Street, Area, City"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Credit Limit ({currency})
                  </label>
                  <input
                    type="number"
                    value={newCustomer.credit_limit}
                    onChange={(e) => setNewCustomer({ ...newCustomer, credit_limit: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Opening Udhaar ({currency})
                  </label>
                  <input
                    type="number"
                    value={newCustomer.opening_balance}
                    onChange={(e) => setNewCustomer({ ...newCustomer, opening_balance: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
