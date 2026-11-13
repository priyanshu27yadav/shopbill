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
} from 'lucide-react';
import { dashboardApi } from '../../api';
import { DashboardData } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const DashboardScreen: React.FC = () => {
  const { shop } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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
            Fast Retail Billing POS • Select an action below to start
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Billing Ready
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MAIN 3-4 PRIMARY ACTION CARDS AS REQUESTED BY USER           */}
      {/* 1. Create Bill (Acc to Catalogue)                            */}
      {/* 2. Custom Bill (Enter Any Price)                             */}
      {/* 3. Add Product                                               */}
      {/* 4. Today's Sales Summary                                     */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: CREATE BILL (Catalogue / Acc to Bill) */}
        <div
          onClick={() => navigate('/billing?mode=catalogue&promptBuyer=true')}
          className="group relative bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-emerald-500/80 hover:border-emerald-600 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform mb-4">
              <Receipt className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
              Mode 1 • Standard
            </span>
            <h2 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
              Create Bill (Catalogue)
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Select items from saved price list & categories. Calculates GST & discounts instantly.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
            <span>Start Catalogue Bill</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARD 2: CUSTOM BILL (Personal Pricing / Enter Any Price) */}
        <div
          onClick={() => navigate('/billing?mode=custom&promptBuyer=true')}
          className="group relative bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-blue-500/80 hover:border-blue-600 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform mb-4">
              <Edit3 className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
              Mode 2 • Fast Manual
            </span>
            <h2 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
              Custom Bill
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Quickly enter material name & price on the spot without saving to catalogue first.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
            <span>Start Custom Bill</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARD 3: ADD PRODUCT */}
        <div
          onClick={() => navigate('/products')}
          className="group relative bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-amber-500/80 hover:border-amber-600 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform mb-4">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
              Inventory & Items
            </span>
            <h2 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
              Add Product
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Add new items, units, default selling prices, and GST rates or upload PDF price list.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-600 group-hover:text-amber-700">
            <span>Manage Products</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARD 4: TODAY'S SALES SUMMARY */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                Today's Summary
              </span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-400">Total Sales Today</p>
            <p className="text-2xl font-black font-mono mt-0.5 text-white">
              {currency}{data ? data.today.sales.toLocaleString('en-IN') : '0'}
            </p>
            <p className="text-xs text-emerald-400 mt-1 font-semibold">
              {data ? data.today.bills_count : 0} bills generated today
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Month: {currency}{data ? data.month.sales.toLocaleString('en-IN') : '0'}</span>
            <button
              onClick={() => navigate('/billing')}
              className="font-bold text-emerald-400 hover:text-emerald-300"
            >
              Open POS &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Clean & Fast Recent Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
              Recent Bills
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
                <th className="py-2.5 px-4 text-center">Action</th>
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
                      {inv.customer_name || 'Walk-in Customer'}
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
                      <button
                        onClick={() => navigate('/invoices')}
                        className="px-2 py-1 rounded text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors"
                      >
                        Print / View
                      </button>
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
    </div>
  );
};
