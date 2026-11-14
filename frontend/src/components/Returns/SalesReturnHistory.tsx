import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Search,
  Plus,
  Printer,
  Calendar,
  FileText,
  User,
  ArrowRight,
  TrendingDown,
  Filter,
} from 'lucide-react';
import { salesReturnApi } from '../../api';
import { SalesReturn } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { SalesReturnModal } from './SalesReturnModal';
import { PrintCreditNoteModal } from './PrintCreditNoteModal';

export const SalesReturnHistory: React.FC = () => {
  const { shop } = useAuth();
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReturnForPrint, setSelectedReturnForPrint] = useState<SalesReturn | null>(null);

  useEffect(() => {
    loadReturns();
  }, [shop, startDate, endDate]);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const res = await salesReturnApi.list({
        search: searchTerm,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setReturns(res.data.data || []);
    } catch (err) {
      console.error('Failed to load sales returns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReturns();
  };

  const currency = shop?.currency_symbol || '₹';

  const totalRefundsValue = returns.reduce((sum, r) => sum + Number(r.refund_amount || 0), 0);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-amber-500" />
            <span>Sales Returns & Credit Notes (सामान वापसी)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Process customer item returns, restore stock, and manage refunds or khata credit
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Sales Return / वापसी</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Total Return Vouchers</p>
            <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {returns.length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Total Refunded Value</p>
            <p className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">
              {currency}{totalRefundsValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Quick Action</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Need to accept returned items from bill?
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 underline"
          >
            Create Return &rarr;
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Credit Note #, Bill #, Customer Name, Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Returns List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Credit Note #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Original Bill</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Refund Mode</th>
                <th className="py-3 px-4 text-right">Refund Amount ({currency})</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                    Loading returns...
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                    No sales returns recorded yet. Click "New Sales Return" to process an item return.
                  </td>
                </tr>
              ) : (
                returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">
                      {ret.return_number}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(ret.return_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {ret.original_invoice_number}
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                      <span className="font-semibold">{ret.customer_name || 'Walk-in'}</span>
                      {ret.customer_phone && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {ret.customer_phone}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {ret.refund_method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                      {currency}{Number(ret.refund_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedReturnForPrint(ret)}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        title="Print Credit Note"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Return Modal */}
      {showCreateModal && (
        <SalesReturnModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            loadReturns();
          }}
          onReturnCompleted={() => {
            loadReturns();
          }}
        />
      )}

      {/* Print Modal */}
      {selectedReturnForPrint && (
        <PrintCreditNoteModal
          salesReturn={selectedReturnForPrint}
          onClose={() => setSelectedReturnForPrint(null)}
        />
      )}
    </div>
  );
};
