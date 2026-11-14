import React, { useRef } from 'react';
import { Printer, X, CheckCircle2, RotateCcw } from 'lucide-react';
import { SalesReturn } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface PrintCreditNoteModalProps {
  salesReturn: SalesReturn | null;
  onClose: () => void;
}

export const PrintCreditNoteModal: React.FC<PrintCreditNoteModalProps> = ({
  salesReturn,
  onClose,
}) => {
  const { shop } = useAuth();
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!salesReturn) return null;

  const currency = shop?.currency_symbol || '₹';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Controls Bar (Hidden when printing) */}
        <div className="no-print p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">
                Sales Return / Credit Note Preview
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {salesReturn.return_number} • Ref: {salesReturn.original_invoice_number}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>Print Credit Note</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div ref={printAreaRef} className="p-6 sm:p-8 bg-white text-slate-900 text-xs font-sans">
          {/* Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900">
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
              {salesReturn.shop?.name || shop?.name || 'SHOPBILL STORE'}
            </h1>
            {shop?.tagline && <p className="text-[11px] text-slate-600 italic">{shop.tagline}</p>}
            <p className="text-[11px] text-slate-600 mt-1">
              {[
                salesReturn.shop?.address_line1 || shop?.address_line1,
                salesReturn.shop?.city || shop?.city,
                salesReturn.shop?.state || shop?.state,
                salesReturn.shop?.pincode || shop?.pincode,
              ].filter(Boolean).join(', ')}
            </p>
            <p className="text-[11px] text-slate-600">
              Phone: {salesReturn.shop?.phone || shop?.phone || 'N/A'} {shop?.email ? `• Email: ${shop.email}` : ''}
            </p>
            {shop?.gstin && (
              <p className="text-[11px] font-mono font-bold text-slate-800 mt-0.5">
                GSTIN: {shop.gstin}
              </p>
            )}
            <div className="inline-block mt-2 px-3 py-1 bg-amber-500 text-white font-black text-xs uppercase tracking-wider rounded">
              CREDIT NOTE / SALES RETURN VOUCHER (सामान वापसी रसीद)
            </div>
          </div>

          {/* Return & Customer Details Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-300 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Credit Note Details</p>
              <p className="font-mono font-black text-slate-900 text-sm mt-0.5">
                CN No: {salesReturn.return_number}
              </p>
              <p className="text-slate-700 mt-0.5">
                Date: {new Date(salesReturn.return_date).toLocaleString('en-IN')}
              </p>
              <p className="font-mono text-slate-700 font-semibold mt-0.5">
                Original Bill No: <span className="underline">{salesReturn.original_invoice_number}</span>
              </p>
              <p className="text-slate-600 capitalize mt-0.5">
                Refund Method: <span className="font-bold text-slate-900 uppercase">{salesReturn.refund_method.replace('_', ' ')}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-500">Customer Details</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {salesReturn.customer_name || 'Walk-in Customer'}
              </p>
              {salesReturn.customer_phone && (
                <p className="font-mono text-slate-700 mt-0.5">
                  Phone: {salesReturn.customer_phone}
                </p>
              )}
              {salesReturn.reason && (
                <p className="text-slate-600 italic mt-1">
                  Reason: "{salesReturn.reason}"
                </p>
              )}
            </div>
          </div>

          {/* Returned Items Table */}
          <div className="py-4">
            <table className="w-full text-left text-xs border border-slate-900 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[10px] font-black uppercase text-slate-800 border-b border-slate-900">
                  <th className="py-2 px-3 border-r border-slate-900 w-10 text-center">#</th>
                  <th className="py-2 px-3 border-r border-slate-900">Returned Item Description</th>
                  <th className="py-2 px-3 border-r border-slate-900 text-center w-20">Qty Returned</th>
                  <th className="py-2 px-3 border-r border-slate-900 text-right w-24">Unit Price</th>
                  <th className="py-2 px-3 border-r border-slate-900 text-right w-20">GST</th>
                  <th className="py-2 px-3 text-right w-28">Refund Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {salesReturn.items && salesReturn.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-300">
                    <td className="py-2 px-3 border-r border-slate-900 text-center font-bold">{idx + 1}</td>
                    <td className="py-2 px-3 border-r border-slate-900 font-bold text-slate-900">
                      {item.item_name}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-900 text-center font-mono font-bold">
                      {Number(item.quantity_returned)} {item.unit}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-900 text-right font-mono">
                      {currency}{Number(item.unit_price).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-900 text-right font-mono">
                      {Number(item.gst_rate) > 0 ? `${item.gst_rate}%` : '0%'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {currency}{Number(item.refund_total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Refund Summary Bar */}
          <div className="flex justify-between items-start gap-4 pt-2 pb-6 border-b border-slate-300">
            <div className="text-[11px] text-slate-600 space-y-1">
              <p>• Items marked for return have been inspected by the store cashier.</p>
              {salesReturn.restock_inventory && (
                <p className="text-emerald-700 font-semibold">
                  ✓ Returned items restored back into shop inventory.
                </p>
              )}
              {salesReturn.refund_method === 'khata_adjustment' && (
                <p className="text-blue-700 font-semibold">
                  ✓ Amount credited directly against customer's outstanding Udhaar balance.
                </p>
              )}
            </div>
            <div className="w-64 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-mono">{currency}{Number(salesReturn.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax Adjusted:</span>
                <span className="font-mono">{currency}{Number(salesReturn.tax_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 pt-1.5 border-t border-slate-300">
                <span>TOTAL REFUND:</span>
                <span className="font-mono text-emerald-700">{currency}{Number(salesReturn.refund_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 flex justify-between text-xs text-slate-600">
            <div className="text-center">
              <div className="w-36 border-b border-slate-400 mb-1" />
              <span>Customer Signature</span>
            </div>
            <div className="text-center">
              <div className="w-36 border-b border-slate-400 mb-1" />
              <span>Authorized Store Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
