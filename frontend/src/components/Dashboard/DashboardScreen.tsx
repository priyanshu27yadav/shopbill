import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Edit3,
  PlusCircle,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  ArrowRight,
  Printer,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  Phone,
  Search,
  Wallet,
} from 'lucide-react';
import { dashboardApi } from '../../api';
import { DashboardData } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CustomerLookupModal } from '../Customers/CustomerLookupModal';
import { SalesReturnModal } from '../Returns/SalesReturnModal';

export const DashboardScreen: React.FC = () => {
  const { shop } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Customer Mobile Lookup Modal
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [targetBillingMode, setTargetBillingMode] = useState<'catalogue' | 'custom'>('catalogue');

  // Sales Return Modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnInvoiceNumber, setReturnInvoiceNumber] = useState<string>('');
  const [returnPhone, setReturnPhone] = useState<string>('');

  // Dashboard quick phone input
  const [quickPhone, setQuickPhone] = useState('');

  useEffect(() => {
    loadDashboard();
  }, [shop]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.get();
      setData(res.data);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBilling = (mode: 'catalogue' | 'custom') => {
    setTargetBillingMode(mode);
    setShowLookupModal(true);
  };

  const handleQuickPhoneSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPhone.trim()) return;
    setTargetBillingMode('catalogue');
    setShowLookupModal(true);
  };

  const currency = shop?.currency_symbol || '₹';

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Shop Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {shop?.name || 'ShopBill Counter'}
          </h1>
          <p className="text-xs text-slate-500">
            Smart Retail Billing POS • Complete Customer History & Sales Return System
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Billing Counter Online
          </span>
        </div>
      </div>

      {/* QUICK CUSTOMER NUMBER LOOKUP BAR */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-emerald-700/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
              <Phone className="w-3 h-3" />
              Customer Khata & History Check
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              Enter Customer Mobile to Check Shopping & Udhaar
            </h2>
            <p className="text-xs text-emerald-100 max-w-xl">
              Type customer number to instantly see total purchases, previous bills count, pending udhaar, or create a new buyer account!
            </p>
          </div>

          <form onSubmit={handleQuickPhoneSearch} className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <div className="relative flex-1 md:w-64">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                +91
              </span>
              <input
                type="tel"
                placeholder="Mobile Number..."
                value={quickPhone}
                onChange={(e) => setQuickPhone(e.target.value)}
                className="w-full pl-11 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-white text-slate-900 border-0 focus:outline-none focus:ring-2 focus:ring-white shadow"
              />
            </div>
            <button
              type="submit"
              onClick={() => {
                setTargetBillingMode('catalogue');
                setShowLookupModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all shrink-0"
            >
              <Search className="w-4 h-4 text-emerald-400" />
              <span>Lookup</span>
            </button>
          </form>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PRIMARY ACTION CARDS                                         */}
      {/* 1. Create Bill (Catalogue) - prompts mobile number first     */}
      {/* 2. Custom Bill (Enter Any Price) - prompts mobile number     */}
      {/* 3. Sales Return / सामान वापसी (क्रेडिट नोट)                   */}
      {/* 4. Add Product / Catalogue                                   */}
      {/* 5. Today's Summary Card                                      */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* CARD 1: CREATE BILL (Catalogue / Acc to Bill) */}
        <div
          onClick={() => handleStartBilling('catalogue')}
          className="group relative bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-emerald-500 hover:border-emerald-600 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Receipt className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Mode 1 • Standard
              </span>
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Create Bill (Catalogue)
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Asks customer number first. Fetches shopping history & udhaar, or adds new customer. Uses saved prices & GST.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
            <span>Enter Customer & Bill</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARD 2: CUSTOM BILL (Personal Pricing / Enter Any Price) */}
        <div
          onClick={() => handleStartBilling('custom')}
          className="group relative bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-blue-500 hover:border-blue-600 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Edit3 className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Mode 2 • Fast Manual
              </span>
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Custom Bill (Enter Any Price)
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Asks customer number first. Enter item name & custom selling price on the spot without saving to catalogue first.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
            <span>Start Custom Bill</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARD 3: SALES RETURN / ITEM RETURN (सामान वापसी / क्रेडिट नोट) */}
        <div
          onClick={() => {
            setReturnInvoiceNumber('');
            setReturnPhone('');
            setShowReturnModal(true);
          }}
          className="group relative bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-amber-500 hover:border-amber-600 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <RotateCcw className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Return / Refund
              </span>
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Sales Return (सामान वापसी)
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Customer bought items and wants to return? Look up previous bill, select items, refund via Cash/UPI or deduct from Udhaar, and restore stock.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-600 group-hover:text-amber-700">
            <span>Process Return & Issue Credit Note</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* SECONDARY ROW: ADD PRODUCT & TODAY'S SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ADD PRODUCT */}
        <div
          onClick={() => navigate('/products')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Add & Manage Products
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Add items, default prices, units, and GST or upload PDF price list.
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-indigo-500 shrink-0 ml-2" />
        </div>

        {/* TODAY'S SALES SUMMARY CARD */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                Today's Summary
              </span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black font-mono text-white">
              {currency}{data ? data.today.sales.toLocaleString('en-IN') : '0'}
            </p>
            <p className="text-xs text-emerald-400 mt-0.5 font-semibold">
              {data ? data.today.bills_count : 0} bills generated today • Month: {currency}{data ? data.month.sales.toLocaleString('en-IN') : '0'}
            </p>
          </div>
          <button
            onClick={() => navigate('/reports')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline shrink-0"
          >
            View Reports &rarr;
          </button>
        </div>
      </div>

      {/* Clean & Fast Recent Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
              Recent Bills (हाल के बिल)
            </h3>
          </div>
          <button
            onClick={() => navigate('/invoices')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            View All Bills &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-4">Bill No</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Payment</th>
                <th className="py-2.5 px-4 text-right">Amount ({currency})</th>
                <th className="py-2.5 px-4 text-center">Action / Return</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data && data.recent_bills && data.recent_bills.length > 0 ? (
                data.recent_bills.slice(0, 6).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(inv.invoice_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      <span className="font-bold">{inv.customer_name || 'Walk-in Customer'}</span>
                      {inv.customer_phone && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {inv.customer_phone}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {inv.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                      {currency}{Number(inv.final_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => navigate('/invoices')}
                          className="px-2 py-1 rounded text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setReturnInvoiceNumber(inv.invoice_number);
                            setReturnPhone(inv.customer_phone || '');
                            setShowReturnModal(true);
                          }}
                          className="px-2 py-1 rounded text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 transition-colors flex items-center gap-1"
                          title="Return Items from this Bill"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Return</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No bills generated yet today. Click "Create Bill" above to generate your first bill!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Mobile Lookup & Khata Modal */}
      {showLookupModal && (
        <CustomerLookupModal
          isOpen={showLookupModal}
          onClose={() => setShowLookupModal(false)}
          targetMode={targetBillingMode}
          onOpenReturns={(invNum, phone) => {
            setReturnInvoiceNumber(invNum || '');
            setReturnPhone(phone || '');
            setShowReturnModal(true);
          }}
        />
      )}

      {/* Sales Return Modal */}
      {showReturnModal && (
        <SalesReturnModal
          isOpen={showReturnModal}
          onClose={() => {
            setShowReturnModal(false);
            loadDashboard();
          }}
          initialInvoiceNumber={returnInvoiceNumber}
          initialPhone={returnPhone}
        />
      )}
    </div>
  );
};
