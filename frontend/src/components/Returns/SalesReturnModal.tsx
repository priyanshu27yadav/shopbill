import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  X,
  AlertTriangle,
  Receipt,
  User,
  Phone,
  Package,
  Calendar,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import { salesReturnApi } from '../../api';
import { Invoice, SalesReturn } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PrintCreditNoteModal } from './PrintCreditNoteModal';

interface SalesReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInvoiceNumber?: string;
  initialPhone?: string;
  onReturnCompleted?: (salesReturn: SalesReturn) => void;
}

export const SalesReturnModal: React.FC<SalesReturnModalProps> = ({
  isOpen,
  onClose,
  initialInvoiceNumber = '',
  initialPhone = '',
  onReturnCompleted,
}) => {
  const { shop } = useAuth();

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [invoicesList, setInvoicesList] = useState<Invoice[]>([]);

  // Selected Invoice
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Return Items State: map of invoice_item_id -> { selected: boolean, returnQty: number }
  const [returnItemsState, setReturnItemsState] = useState<
    Record<number, { selected: boolean; returnQty: number }>
  >({});

  // Refund Settings
  const [refundMethod, setRefundMethod] = useState<'cash' | 'upi' | 'khata_adjustment' | 'store_credit'>('cash');
  const [reason, setReason] = useState('Customer Item Return');
  const [restockInventory, setRestockInventory] = useState(true);

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Result Credit Note for printing
  const [completedReturn, setCompletedReturn] = useState<SalesReturn | null>(null);

  useEffect(() => {
    if (isOpen) {
      const q = initialInvoiceNumber || initialPhone || '';
      setSearchQuery(q);
      setSelectedInvoice(null);
      setReturnItemsState({});
      setSubmitError('');
      setCompletedReturn(null);
      if (q) {
        handleSearch(q);
      }
    }
  }, [isOpen, initialInvoiceNumber, initialPhone]);

  if (!isOpen) return null;

  const currency = shop?.currency_symbol || '₹';

  const handleSearch = async (overrideQ?: string) => {
    const q = (overrideQ !== undefined ? overrideQ : searchQuery).trim();
    if (!q) return;

    setSearching(true);
    setSubmitError('');
    try {
      const res = await salesReturnApi.searchInvoice(q);
      setInvoicesList(res.data || []);
      if (res.data?.length === 1) {
        handleSelectInvoice(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to search invoices:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    // Initialize return items map
    const initialMap: Record<number, { selected: boolean; returnQty: number }> = {};
    inv.items?.forEach((item) => {
      if (item.id) {
        initialMap[item.id] = {
          selected: true,
          returnQty: Number(item.quantity) || 1,
        };
      }
    });
    setReturnItemsState(initialMap);

    // If customer has udhaar balance or bill was credit, default to khata_adjustment
    if (inv.payment_status === 'credit' || inv.customer?.current_balance && Number(inv.customer.current_balance) > 0) {
      setRefundMethod('khata_adjustment');
    } else {
      setRefundMethod('cash');
    }
  };

  // Calculations for current selection
  const calculatedRefund = () => {
    if (!selectedInvoice?.items) return { subtotal: 0, tax: 0, total: 0, count: 0 };

    let subtotal = 0;
    let tax = 0;
    let total = 0;
    let count = 0;

    selectedInvoice.items.forEach((item) => {
      if (!item.id) return;
      const state = returnItemsState[item.id];
      if (state?.selected && state.returnQty > 0) {
        count++;
        const unitPrice = Number(item.unit_price);
        const gstRate = Number(item.gst_rate) || 0;
        const itemSubtotal = state.returnQty * unitPrice;
        const itemTax = itemSubtotal * (gstRate / 100);

        subtotal += itemSubtotal;
        tax += itemTax;
        total += itemSubtotal + itemTax;
      }
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      count,
    };
  };

  const totals = calculatedRefund();

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (totals.count === 0) {
      setSubmitError('Please select at least 1 item to return');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const itemsPayload = Object.entries(returnItemsState)
      .filter(([_, state]) => state.selected && state.returnQty > 0)
      .map(([itemId, state]) => ({
        invoice_item_id: Number(itemId),
        quantity_returned: state.returnQty,
      }));

    try {
      const res = await salesReturnApi.create({
        invoice_id: selectedInvoice.id,
        refund_method: refundMethod,
        reason: reason.trim(),
        restock_inventory: restockInventory,
        items: itemsPayload,
      });

      const ret = res.data.sales_return;
      setCompletedReturn(ret);
      if (onReturnCompleted) {
        onReturnCompleted(ret);
      }
    } catch (err: any) {
      console.error('Return creation failed:', err);
      setSubmitError(err.response?.data?.message || 'Failed to process sales return.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-transparent to-rose-500/10 gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 truncate">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  Sales Return / Credit Note (वापसी)
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                  Select bill, return items, and process refund
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {/* Step 1: Search Original Invoice */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Find Original Invoice (Enter Bill Number or Customer Mobile)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. INV-202611-0001 or 9876543210"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearch()}
                  disabled={searching || !searchQuery.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all shrink-0"
                >
                  {searching ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Search Bill</span>
                </button>
              </div>
            </div>

            {/* Invoices Search Results if multiple found */}
            {invoicesList.length > 0 && !selectedInvoice && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  Select Invoice to Return ({invoicesList.length} matching bills found):
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {invoicesList.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => handleSelectInvoice(inv)}
                      className="p-3 hover:bg-amber-50 dark:hover:bg-amber-950/20 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                          {inv.invoice_number}
                        </span>
                        <span className="text-slate-500 ml-2">
                          {new Date(inv.invoice_date).toLocaleDateString('en-IN')}
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                          Buyer: <span className="font-semibold text-slate-800 dark:text-slate-200">{inv.customer_name || 'Walk-in Customer'}</span> {inv.customer_phone ? `(${inv.customer_phone})` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-black text-slate-900 dark:text-white text-sm">
                          {currency}{Number(inv.final_amount).toLocaleString('en-IN')}
                        </p>
                        <span className="text-[10px] font-bold text-amber-600 uppercase">
                          Select for Return &rarr;
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Invoice Details & Items to Return */}
            {selectedInvoice && (
              <form onSubmit={handleSubmitReturn} className="space-y-4">
                {/* Invoice Header Card */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-amber-600">
                      Original Bill Selected
                    </span>
                    <p className="font-mono font-black text-base text-slate-900 dark:text-white">
                      {selectedInvoice.invoice_number}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Date: {new Date(selectedInvoice.invoice_date).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      Customer: {selectedInvoice.customer_name || 'Walk-in'}
                    </p>
                    <p className="text-slate-500 font-mono text-[11px]">
                      Phone: {selectedInvoice.customer_phone || 'N/A'}
                    </p>
                    {selectedInvoice.customer?.current_balance && Number(selectedInvoice.customer.current_balance) > 0 && (
                      <p className="text-rose-600 font-bold text-[11px]">
                        Pending Udhaar: {currency}{Number(selectedInvoice.customer.current_balance).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 text-[11px]">Total Billed</p>
                    <p className="font-mono font-black text-sm text-slate-900 dark:text-white">
                      {currency}{Number(selectedInvoice.final_amount).toLocaleString('en-IN')}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(null)}
                      className="text-[11px] text-blue-600 hover:underline mt-1 block"
                    >
                      Change Bill
                    </button>
                  </div>
                </div>

                {submitError && (
                  <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800">
                    {submitError}
                  </div>
                )}

                {/* Items to Return Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Select Items to Return:
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {totals.count} item(s) selected for return
                    </span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                          <th className="py-2.5 px-3 w-10 text-center">Select</th>
                          <th className="py-2.5 px-3">Item Name</th>
                          <th className="py-2.5 px-3 text-right">Unit Price</th>
                          <th className="py-2.5 px-3 text-center">Billed Qty</th>
                          <th className="py-2.5 px-3 text-center w-28">Return Qty</th>
                          <th className="py-2.5 px-3 text-right">Refund Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedInvoice.items && selectedInvoice.items.map((item) => {
                          if (!item.id) return null;
                          const state = returnItemsState[item.id] || { selected: false, returnQty: 0 };
                          const unitPrice = Number(item.unit_price);
                          const gstRate = Number(item.gst_rate) || 0;
                          const itemTotal = state.returnQty * unitPrice * (1 + gstRate / 100);

                          return (
                            <tr
                              key={item.id}
                              className={state.selected ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}
                            >
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={state.selected}
                                  onChange={(e) => {
                                    setReturnItemsState({
                                      ...returnItemsState,
                                      [item.id!]: {
                                        ...state,
                                        selected: e.target.checked,
                                      },
                                    });
                                  }}
                                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                                />
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                {item.item_name}
                                {Number(item.gst_rate) > 0 && (
                                  <span className="text-[10px] text-slate-400 ml-1.5">
                                    ({item.gst_rate}% GST)
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                                {currency}{unitPrice.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                                {Number(item.quantity)} {item.unit}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="number"
                                  min="0.001"
                                  max={Number(item.quantity)}
                                  step="any"
                                  disabled={!state.selected}
                                  value={state.returnQty}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setReturnItemsState({
                                      ...returnItemsState,
                                      [item.id!]: {
                                        ...state,
                                        returnQty: Math.min(Number(item.quantity), Math.max(0, val)),
                                      },
                                    });
                                  }}
                                  className="w-20 px-2 py-1 text-xs font-mono font-bold text-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white disabled:opacity-40"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                {currency}{state.selected ? itemTotal.toFixed(2) : '0.00'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Refund Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Refund Method */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Refund Mode / वापसी का तरीका
                    </label>
                    <select
                      value={refundMethod}
                      onChange={(e: any) => setRefundMethod(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="cash">Cash Refund (नकद वापसी)</option>
                      <option value="upi">UPI / Online Refund</option>
                      <option value="khata_adjustment">
                        Khata Adjustment (उधार में से काटें / Deduct from Udhaar)
                      </option>
                      <option value="store_credit">Store Credit (दुकान जमा)</option>
                    </select>
                  </div>

                  {/* Return Reason */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Reason for Return / वापसी का कारण
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Defective item, customer choice, wrong item"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Restock Toggle */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    id="restock_toggle"
                    checked={restockInventory}
                    onChange={(e) => setRestockInventory(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="restock_toggle" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Restock items back into shop inventory (दुकान के स्टॉक में वापस जोड़ें)
                  </label>
                </div>

                {/* Bottom Total & Submit Bar */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Total Refund Amount</p>
                    <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                      {currency}{totals.total.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || totals.count === 0}
                      className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
                    >
                      {submitting ? (
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      <span>Process Return & Issue Credit Note</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Credit Note Print Modal if return successfully created */}
      {completedReturn && (
        <PrintCreditNoteModal
          salesReturn={completedReturn}
          onClose={() => {
            setCompletedReturn(null);
            onClose();
          }}
        />
      )}
    </>
  );
};
