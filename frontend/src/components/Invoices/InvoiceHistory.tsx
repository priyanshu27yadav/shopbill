import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Printer,
  Ban,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Share2,
} from 'lucide-react';
import { invoiceApi, settingsApi } from '../../api';
import { Invoice, InvoiceSetting } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PrintInvoiceModal } from '../Billing/PrintInvoiceModal';

export const InvoiceHistory: React.FC = () => {
  const { shop, permissions } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all');

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSetting | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  useEffect(() => {
    loadInvoices();
    settingsApi.get().then((res) => setInvoiceSettings(res.data.invoice_settings)).catch(console.error);
  }, [shop]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await invoiceApi.list({ per_page: 100 });
      setInvoices(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCancel = (inv: Invoice) => {
    setCancellingInvoice(inv);
    setCancelReason('');
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingInvoice || !cancelReason.trim()) return;

    setSubmittingCancel(true);
    try {
      const res = await invoiceApi.cancel(cancellingInvoice.id, cancelReason.trim());
      alert('Invoice cancelled successfully.');
      setCancellingInvoice(null);
      loadInvoices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel invoice.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      searchTerm === '' ||
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customer_name && inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.customer_phone && inv.customer_phone.includes(searchTerm));
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    const matchMode = filterMode === 'all' || inv.billing_mode === filterMode;
    return matchSearch && matchStatus && matchMode;
  });

  const currency = shop?.currency_symbol || '₹';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>Invoice & Billing History</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View, reprint receipts, share on WhatsApp, or record official invoice cancellations.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by invoice number, customer name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">All Modes</option>
          <option value="catalogue">1. Catalogue</option>
          <option value="custom">2. Custom / Personal</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                      inv.status === 'cancelled' ? 'opacity-60 bg-slate-50/50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold font-mono text-slate-900 dark:text-white">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {new Date(inv.invoice_date).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {inv.customer_name || 'Cash Customer'}
                      </p>
                      {inv.customer_phone && <p className="text-[10px] text-slate-400 font-mono">{inv.customer_phone}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                        {inv.billing_mode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold font-mono text-slate-900 dark:text-white">
                      {currency}{Number(inv.final_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          inv.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {inv.payment_method} • {inv.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {inv.status === 'completed' ? (
                        <span className="text-emerald-600 font-semibold flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Valid</span>
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold flex items-center justify-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancelled</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          title="View & Reprint Receipt"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {inv.status === 'completed' && permissions.can_cancel_bills && (
                          <button
                            onClick={() => handleOpenCancel(inv)}
                            title="Cancel Bill with Credit Note"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancellation Modal */}
      {cancellingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
              Cancel Invoice {cancellingInvoice.invoice_number}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Issued bills are not silently deleted. Cancellation logs an official reason and adjusts customer balances.
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cancellation Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer returned items / entered wrong customer number..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingInvoice(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm disabled:opacity-50"
                >
                  {submittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print & View Modal */}
      {selectedInvoice && (
        <PrintInvoiceModal
          invoice={selectedInvoice}
          shop={shop}
          settings={invoiceSettings}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
