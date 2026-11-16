import React, { useState, useEffect, useMemo } from 'react';
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
  Package,
  Loader2,
  Receipt,
  User,
} from 'lucide-react';
import { invoiceApi, settingsApi } from '../../api';
import { Invoice, InvoiceSetting } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PrintInvoiceModal } from '../Billing/PrintInvoiceModal';

export const InvoiceHistory: React.FC = () => {
  const { shop, permissions } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const cached = localStorage.getItem('shopbill_cached_invoices');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem('shopbill_cached_invoices'));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all');

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<number | null>(null);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSetting | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  useEffect(() => {
    loadInvoices();
    settingsApi.get().then((res) => setInvoiceSettings(res.data.invoice_settings)).catch(console.error);
  }, [shop]);

  const loadInvoices = async () => {
    if (invoices.length === 0) setLoading(true);
    try {
      const res = await invoiceApi.list({ per_page: 50 });
      const data = res.data.data || [];
      setInvoices(data);
      try {
        localStorage.setItem('shopbill_cached_invoices', JSON.stringify(data));
      } catch (e) {
        // storage quota
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // View full invoice with all items and payments list identical to checkout bill
  const handleViewInvoice = async (inv: Invoice) => {
    setLoadingInvoiceId(inv.id);
    try {
      const res = await invoiceApi.get(inv.id);
      setSelectedInvoice(res.data.invoice);
      if (res.data.settings) {
        setInvoiceSettings(res.data.settings);
      }
    } catch (e) {
      console.error('Error fetching full invoice items:', e);
      setSelectedInvoice(inv);
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const handleWhatsAppQuickShare = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = inv.customer_phone ? inv.customer_phone.replace(/\D/g, '') : '';
    const text = encodeURIComponent(
      `Hello ${inv.customer_name || 'Customer'},\nThank you for shopping at *${shop?.name}*!\n\n` +
      `*Bill No:* ${inv.invoice_number}\n` +
      `*Date:* ${new Date(inv.invoice_date).toLocaleDateString('en-IN')}\n` +
      `*Total Amount:* Rs. ${Number(inv.final_amount).toFixed(2)}\n` +
      `*Payment:* ${inv.payment_method?.toUpperCase()} (${inv.payment_status?.toUpperCase()})\n` +
      (Number(inv.balance_due) > 0 ? `*Balance Due (Udhaar):* Rs. ${Number(inv.balance_due).toFixed(2)}\n` : `*Status:* Paid\n`) +
      `\nWe appreciate your business!`
    );
    window.open(`https://wa.me/${phone ? '91' + phone : ''}?text=${text}`, '_blank');
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

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return invoices.filter((inv) => {
      const matchSearch =
        q === '' ||
        inv.invoice_number.toLowerCase().includes(q) ||
        (inv.customer_name && inv.customer_name.toLowerCase().includes(q)) ||
        (inv.customer_phone && inv.customer_phone.includes(q));
      const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
      const matchMode = filterMode === 'all' || inv.billing_mode === filterMode;
      return matchSearch && matchStatus && matchMode;
    });
  }, [invoices, searchTerm, filterStatus, filterMode]);

  const currency = shop?.currency_symbol || '₹';

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>Invoice & Billing History (बिल हिस्ट्री)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any invoice to view the complete bill with all item details, prices, taxes & print receipt.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by invoice number, customer name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed (Valid)</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">All Modes</option>
          <option value="catalogue">1. Catalogue Bill</option>
          <option value="custom">2. Custom / Personal Bill</option>
        </select>
      </div>

      {/* Invoices List: Mobile Cards + Desktop Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Mobile View: Clean, Responsive Receipt Cards (< sm) */}
        <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {loading && invoices.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
              <p className="text-xs">Loading bills...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No invoices found.
            </div>
          ) : (
            filtered.map((inv) => {
              const isRowLoading = loadingInvoiceId === inv.id;
              const itemsCount = inv.items_count ?? inv.items?.length ?? 0;
              const finalAmt = Number(inv.final_amount || 0);
              const paidAmt = Number(inv.amount_paid || 0);
              const dueAmt = Number(inv.balance_due || 0);
              const hasDueCleared = dueAmt === 0 && (inv.payments && inv.payments.length > 1);

              return (
                <div
                  key={inv.id}
                  onClick={() => handleViewInvoice(inv)}
                  className={`p-3.5 space-y-2 active:bg-slate-50 dark:active:bg-slate-800/60 transition-colors cursor-pointer ${
                    inv.status === 'cancelled' ? 'opacity-60 bg-slate-50/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold font-mono text-emerald-600 text-xs">
                      {isRowLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{inv.invoice_number}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(inv.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                        {inv.customer_name || 'Walk-in Customer'}
                      </p>
                      {inv.customer_phone && (
                        <p className="text-[10px] text-slate-400 font-mono">📞 {inv.customer_phone}</p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <Package className="w-3 h-3" />
                      <span>{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-sm font-black font-mono text-slate-900 dark:text-white">
                        {currency}{finalAmt.toFixed(2)}
                      </p>
                      {dueAmt > 0 ? (
                        <p className="text-[10px] font-bold text-rose-600">
                          Due: {currency}{dueAmt.toFixed(2)}
                        </p>
                      ) : hasDueCleared ? (
                        <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" />
                          <span>Due Cleared</span>
                        </p>
                      ) : (
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">
                          {inv.payment_method} • Paid
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleViewInvoice(inv)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleWhatsAppQuickShare(inv, e)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table (hidden on mobile sm:block) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Buyer / Customer</th>
                <th className="py-3 px-4">Items in Bill</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4 text-right">Final Amount</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
                    <span>Loading invoices...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => {
                  const isRowLoading = loadingInvoiceId === inv.id;
                  const itemsCount = inv.items_count ?? inv.items?.length ?? 0;
                  const finalAmt = Number(inv.final_amount || 0);
                  const paidAmt = Number(inv.amount_paid || 0);
                  const dueAmt = Number(inv.balance_due || 0);
                  const hasDueCleared = dueAmt === 0 && (inv.payments && inv.payments.length > 1);

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => handleViewInvoice(inv)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        inv.status === 'cancelled' ? 'opacity-60 bg-slate-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold font-mono text-emerald-600 dark:text-emerald-400 hover:underline">
                        <div className="flex items-center gap-1.5">
                          {isRowLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>{inv.invoice_number}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {new Date(inv.invoice_date).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {inv.customer_name || 'Walk-in Customer'}
                        </p>
                        {inv.customer_phone && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">📞 {inv.customer_phone}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          <Package className="w-3.5 h-3.5" />
                          <span>{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                          {inv.billing_mode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="font-extrabold font-mono text-slate-900 dark:text-white text-sm">
                          {currency}{finalAmt.toFixed(2)}
                        </p>
                        {dueAmt > 0 ? (
                          <p className="text-[10px] font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                            Paid: {currency}{paidAmt.toFixed(2)} • Due: {currency}{dueAmt.toFixed(2)}
                          </p>
                        ) : hasDueCleared ? (
                          <p className="text-[10px] font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center justify-end gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Due Cleared (Paid {currency}{finalAmt.toFixed(2)})</span>
                          </p>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {inv.payment_status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle className="w-3 h-3" />
                            <span>{hasDueCleared ? 'Paid (Due Cleared)' : 'Paid'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            <Clock className="w-3 h-3" />
                            <span>Due {currency}{dueAmt.toFixed(2)}</span>
                          </span>
                        )}
                        <p className="text-[9px] text-slate-400 uppercase font-semibold mt-0.5">
                          {inv.payment_method}
                        </p>
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
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewInvoice(inv)}
                            title="View Full Bill & Print Receipt"
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">View Bill</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleWhatsAppQuickShare(inv, e)}
                            title="Share on WhatsApp"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {inv.status === 'completed' && permissions.can_cancel_bills && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCancel(inv);
                              }}
                              title="Cancel Bill with Credit Note"
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
