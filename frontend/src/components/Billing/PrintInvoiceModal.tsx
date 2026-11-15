import React, { useState } from 'react';
import {
  Printer,
  Share2,
  X,
  CheckCircle2,
  PlusCircle,
} from 'lucide-react';
import { Invoice, InvoiceSetting, Shop } from '../../types';

interface PrintInvoiceModalProps {
  invoice: Invoice | any;
  shop: Shop | null;
  settings?: InvoiceSetting | null;
  onClose: () => void;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  invoice,
  shop,
  settings,
  onClose,
}) => {
  const [template, setTemplate] = useState<'a4' | 'thermal_80mm' | 'thermal_58mm'>('a4');

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const phone = invoice.customer_phone ? invoice.customer_phone.replace(/\D/g, '') : '';
    const text = encodeURIComponent(
      `Hello ${invoice.customer_name || 'Customer'},\nThank you for shopping at *${shop?.name}*!\n\n` +
      `*Bill No:* ${invoice.invoice_number}\n` +
      `*Date:* ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}\n` +
      `*Total Amount:* Rs. ${Number(invoice.final_amount).toFixed(2)}\n` +
      `*Payment Method:* ${invoice.payment_method?.toUpperCase()}\n` +
      (Number(invoice.balance_due) > 0 ? `*Balance Due (Udhaar):* Rs. ${Number(invoice.balance_due).toFixed(2)}\n` : `*Status:* Paid\n`) +
      `\nWe appreciate your business!`
    );
    window.open(`https://wa.me/${phone ? '91' + phone : ''}?text=${text}`, '_blank');
  };

  const isGst = invoice.invoice_type === 'gst' || Number(invoice.total_tax) > 0;
  const totalQty = invoice.items?.reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0) || 0;
  const totalTax = Number(invoice.total_tax || 0);
  const finalAmount = Number(invoice.final_amount || 0);
  const amountPaid = Number(invoice.amount_paid || finalAmount);
  const balanceDue = Number(invoice.balance_due || 0);
  const totalDiscount = Number(invoice.total_discount || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-100">
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] ${
          template === 'a4' ? 'max-w-4xl' : 'max-w-xl'
        }`}
      >
        {/* Modal Header */}
        <div className="no-print p-3 sm:p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">
                Tax Invoice: {invoice.invoice_number}
              </h3>
              <p className="text-[11px] text-slate-400">Professional GST/Retail Invoice Format</p>
            </div>
          </div>

          {/* Template format switch */}
          <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setTemplate('a4')}
              className={`px-3 py-1 rounded-md text-xs transition-all ${
                template === 'a4'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Standard A4 Tax Invoice
            </button>
            <button
              onClick={() => setTemplate('thermal_80mm')}
              className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                template === 'thermal_80mm'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              80mm Thermal
            </button>
            <button
              onClick={() => setTemplate('thermal_58mm')}
              className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                template === 'thermal_58mm'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              58mm POS
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Preview Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex justify-center bg-slate-100 dark:bg-slate-950">
          <div
            id="printable-invoice"
            className="bg-white text-slate-900 transition-all font-sans"
          >
            {template === 'a4' ? (
              /* ============================================================ */
              /* A4 TAX INVOICE FORMAT (EXACT MATCH WITH UPLOADED SAMPLE)      */
              /* ============================================================ */
              <div className="p-6 sm:p-8 max-w-[210mm] w-full mx-auto shadow-sm border border-slate-300 bg-white text-xs">
                {/* Top Title */}
                <div className="text-xs font-black tracking-widest text-slate-800 uppercase mb-1">
                  TAX INVOICE
                </div>

                {/* Main Outer Box */}
                <div className="border border-slate-400">
                  {/* Shop Details Header */}
                  <div className="p-4 text-center border-b border-slate-400">
                    <h1 className="text-2xl font-black text-[#00c988] tracking-tight">
                      {shop?.name || 'Akash Enterprises'}
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {[shop?.address_line1, shop?.address_line2, shop?.city, shop?.state, shop?.pincode].filter(Boolean).join(', ') || 'Ajmer Road, Jaipur, Rajasthan 301202'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-700 mt-2">
                      <span>Phone: {shop?.phone || '+91 99810278197'}</span>
                      {shop?.gstin && <span>GSTIN: {shop.gstin}</span>}
                      <span>
                        PAN Number: {shop?.gstin ? shop.gstin.substring(2, 12) : 'AVHPC9999A'}
                      </span>
                    </div>
                  </div>

                  {/* Two-Column Bill To & Invoice Info */}
                  <div className="grid grid-cols-12 border-b border-slate-400 text-xs">
                    {/* Left: Bill To */}
                    <div className="col-span-7 p-3 border-r border-slate-400 space-y-1">
                      <p className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                        BILL TO
                      </p>
                      <p className="font-bold text-sm text-slate-900">
                        {invoice.customer_name || 'Walk-in / Cash Customer'}
                      </p>
                      {invoice.customer_address ? (
                        <p className="text-slate-600 text-xs leading-snug">
                          {invoice.customer_address}
                        </p>
                      ) : (
                        <p className="text-slate-400 text-xs italic">Counter Retail Sale</p>
                      )}
                      {invoice.customer_phone && (
                        <p className="text-slate-700 font-medium">
                          Phone: {invoice.customer_phone}
                        </p>
                      )}
                      {invoice.customer_gstin && (
                        <p className="text-slate-700">
                          PAN Number:{' '}
                          {invoice.customer_gstin.length >= 12
                            ? invoice.customer_gstin.substring(2, 12)
                            : invoice.customer_gstin}
                        </p>
                      )}
                      {invoice.customer_gstin && (
                        <p className="text-slate-700 font-semibold">
                          GSTIN: {invoice.customer_gstin}
                        </p>
                      )}
                      <p className="text-slate-700">
                        Place of Supply: {shop?.state || 'Rajasthan'}
                      </p>
                    </div>

                    {/* Right: Invoice No & Date */}
                    <div className="col-span-5 p-3 flex divide-x divide-slate-400">
                      <div className="flex-1 pr-3">
                        <p className="font-semibold text-slate-600 text-[11px]">Invoice No</p>
                        <p className="font-extrabold text-sm text-slate-900 mt-1 font-mono">
                          {invoice.invoice_number}
                        </p>
                      </div>
                      <div className="flex-1 pl-3">
                        <p className="font-semibold text-slate-600 text-[11px]">Invoice Date</p>
                        <p className="font-extrabold text-xs text-slate-900 mt-1">
                          {new Date(invoice.invoice_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Items Table with Vibrant Green Header and Continuous Vertical Borders */}
                  <div className="w-full">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#00e676] text-slate-900 font-bold border-b border-slate-400 text-xs">
                          <th className="py-2 px-2.5 border-r border-slate-400 w-12 text-center">Sr. No.</th>
                          <th className="py-2 px-3 border-r border-slate-400">Items</th>
                          <th className="py-2 px-3 border-r border-slate-400 w-24 text-center">Quantity</th>
                          <th className="py-2 px-3 border-r border-slate-400 w-28 text-right">Price / Unit</th>
                          <th className="py-2 px-3 border-r border-slate-400 w-28 text-right">Tax / Unit</th>
                          <th className="py-2 px-3 w-32 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items?.map((item: any, idx: number) => {
                          const qty = Number(item.quantity);
                          const price = Number(item.unit_price);
                          const gstRate = Number(item.gst_rate || 0);
                          const taxPerUnit = (price * gstRate) / 100;
                          const lineTotal = Number(item.subtotal || qty * price);

                          return (
                            <tr key={idx} className="align-top">
                              <td className="py-2 px-2.5 border-r border-slate-400 text-center font-mono">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-400">
                                <div className="font-semibold text-slate-900">{item.item_name}</div>
                                {item.category_name && (
                                  <div className="text-[10px] text-slate-400">{item.category_name}</div>
                                )}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-400 text-center font-mono">
                                {qty} {item.unit?.toUpperCase() || 'PCS'}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-400 text-right font-mono">
                                Rs. {price.toFixed(2)}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-400 text-right font-mono">
                                {gstRate > 0 ? `Rs. ${taxPerUnit.toFixed(2)} (${gstRate}%)` : `Rs. 0.00 (0%)`}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                Rs. {lineTotal.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Minimum height vertical grid lines filler (like sample invoice) */}
                        {Array.from({ length: Math.max(1, 7 - (invoice.items?.length || 0)) }).map((_, i) => (
                          <tr key={'pad-' + i} className="h-7">
                            <td className="border-r border-slate-400"></td>
                            <td className="border-r border-slate-400"></td>
                            <td className="border-r border-slate-400"></td>
                            <td className="border-r border-slate-400"></td>
                            <td className="border-r border-slate-400"></td>
                            <td></td>
                          </tr>
                        ))}

                        {/* Discount row if applicable */}
                        {totalDiscount > 0 && (
                          <tr className="border-t border-slate-400 text-xs font-semibold">
                            <td colSpan={5} className="py-1.5 px-3 text-right border-r border-slate-400 text-slate-700">
                              Discount
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                              Rs. {totalDiscount.toFixed(2)}
                            </td>
                          </tr>
                        )}

                        {/* Green Highlighted Total Bar */}
                        <tr className="bg-[#00e676] text-slate-900 font-bold border-t border-b border-slate-400 text-xs">
                          <td colSpan={2} className="py-2 px-3 text-right border-r border-slate-400">
                            Total
                          </td>
                          <td className="py-2 px-3 text-center border-r border-slate-400 font-mono">
                            {totalQty}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-400"></td>
                          <td className="py-2 px-3 text-right border-r border-slate-400 font-mono">
                            Rs. {totalTax.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-sm">
                            Rs. {finalAmount.toFixed(2)}
                          </td>
                        </tr>

                        {/* Payments Breakdown: Initial purchase payment & subsequent due clearances */}
                        {invoice.payments && invoice.payments.length > 0 ? (
                          <>
                            {invoice.payments.map((p: any, idx: number) => {
                              const isInitial = idx === 0 || p.payment_type === 'invoice_payment';
                              const pDate = p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                              return (
                                <tr key={p.id || idx} className="border-b border-slate-200 text-xs font-semibold">
                                  <td colSpan={5} className="py-1.5 px-3 text-right border-r border-slate-400 text-slate-700">
                                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                      <span className={isInitial ? 'text-slate-800' : 'text-emerald-700 font-bold'}>
                                        {isInitial ? 'Paid at Purchase (खरीदते समय)' : 'Due Cleared (उधार जमा)'}:
                                      </span>
                                      <span className="text-[11px] font-normal text-slate-500">
                                        ({p.payment_method?.toUpperCase()} • {pDate}{p.reference_number ? ` • Ref: ${p.reference_number}` : ''})
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                                    Rs. {Number(p.amount).toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}

                            {/* Total Paid */}
                            <tr className="border-b border-slate-300 text-xs font-bold bg-slate-50">
                              <td colSpan={5} className="py-1.5 px-3 text-right border-r border-slate-400 text-slate-800">
                                Total Paid (कुल भुगतान)
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono font-black text-slate-900">
                                Rs. {amountPaid.toFixed(2)}
                              </td>
                            </tr>
                          </>
                        ) : (
                          /* Received Amount single row */
                          <tr className="border-b border-slate-300 text-xs font-semibold">
                            <td colSpan={5} className="py-1.5 px-3 text-right border-r border-slate-400 text-slate-700">
                              Received Amount ({invoice.payment_method?.toUpperCase()})
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                              Rs. {amountPaid.toFixed(2)}
                            </td>
                          </tr>
                        )}

                        {/* Due Balance */}
                        <tr className="text-xs font-semibold">
                          <td colSpan={5} className="py-1.5 px-3 text-right border-r border-slate-400 text-slate-700">
                            Due Balance (शेष उधार)
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold">
                            {balanceDue > 0 ? (
                              <span className="text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded">
                                Rs. {balanceDue.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded">
                                Rs. 0.00 (चुकता / Cleared)
                              </span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom 3-Section Box: Notes, Terms & Conditions, and Signatory */}
                <div className="grid grid-cols-12 border border-slate-400 mt-3 text-xs bg-white">
                  {/* Notes Box */}
                  <div className="col-span-3 p-3 border-r border-slate-400 space-y-1">
                    <p className="font-bold text-slate-800">Notes</p>
                    <p className="text-slate-600 text-[11px] whitespace-pre-line leading-relaxed">
                      {invoice.notes || '1. No return deal'}
                    </p>
                  </div>

                  {/* Terms & Conditions Box */}
                  <div className="col-span-5 p-3 border-r border-slate-400 space-y-1">
                    <p className="font-bold text-slate-800">Terms & Conditions</p>
                    <p className="text-slate-600 text-[11px] whitespace-pre-line leading-relaxed">
                      {settings?.terms_and_conditions ||
                        '1. Customer will pay the GST\n2. Customer will pay the Delivery charges\n3. Pay due amount within 15 days'}
                    </p>
                  </div>

                  {/* Signatory Box */}
                  <div className="col-span-4 p-3 flex flex-col justify-between text-right">
                    <div></div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-700">Authorised Signatory For</p>
                      <p className="font-black text-xs text-slate-900 mt-1">
                        {shop?.name || 'Akash Enterprises'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ============================================================ */
              /* THERMAL RECEIPT FORMAT (80mm & 58mm)                          */
              /* ============================================================ */
              <div
                className={`p-4 shadow-xs border border-slate-200 transition-all font-sans text-xs ${
                  template === 'thermal_58mm'
                    ? 'w-[58mm] text-[10px] leading-tight p-2'
                    : 'w-[80mm] text-xs leading-snug p-3.5'
                }`}
              >
                {/* Header */}
                <div className="text-center border-b border-dashed border-slate-300 pb-2 mb-2">
                  <h2 className="font-extrabold text-sm tracking-tight text-[#00c988] uppercase">
                    {shop?.name}
                  </h2>
                  <p className="text-[10px] text-slate-600">
                    {[shop?.address_line1, shop?.city, shop?.pincode].filter(Boolean).join(', ')}
                  </p>
                  <p className="text-[10px] text-slate-600">Phone: {shop?.phone}</p>
                  {shop?.gstin && (
                    <p className="text-[10px] font-bold text-slate-800">GSTIN: {shop.gstin}</p>
                  )}
                </div>

                {/* Bill Meta */}
                <div className="flex justify-between text-[11px] mb-2 border-b border-dashed border-slate-300 pb-1.5">
                  <div>
                    <p className="font-bold">Bill: {invoice.invoice_number}</p>
                    <p>{new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{invoice.customer_name || 'Customer'}</p>
                    {invoice.customer_phone && <p>{invoice.customer_phone}</p>}
                  </div>
                </div>

                {/* Items with Qty & Prices */}
                <table className="w-full text-left mb-2 border-b border-dashed border-slate-300">
                  <thead>
                    <tr className="bg-[#00e676] text-slate-900 font-bold text-[10px]">
                      <th className="py-1 px-1">Item</th>
                      <th className="py-1 px-1 text-center">Qty</th>
                      <th className="py-1 px-1 text-right">Price</th>
                      <th className="py-1 px-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items?.map((item: any, i: number) => (
                      <tr key={i} className="text-[11px]">
                        <td className="py-1 px-1 font-semibold">{item.item_name}</td>
                        <td className="py-1 px-1 text-center font-mono">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-1 px-1 text-right font-mono">Rs.{item.unit_price}</td>
                        <td className="py-1 px-1 text-right font-bold font-mono">Rs.{item.subtotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary */}
                <div className="space-y-1 text-[11px] mb-2 border-b border-dashed border-slate-300 pb-1.5">
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount:</span>
                      <span className="font-mono">-Rs.{totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between bg-[#00e676] text-slate-900 font-black py-1 px-1">
                    <span>Total ({totalQty} items):</span>
                    <span className="font-mono">Rs.{finalAmount.toFixed(2)}</span>
                  </div>
                  {invoice.payments && invoice.payments.length > 0 ? (
                    <>
                      {invoice.payments.map((p: any, idx: number) => {
                        const isInitial = idx === 0 || p.payment_type === 'invoice_payment';
                        const pDate = p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';
                        return (
                          <div key={p.id || idx} className="flex justify-between text-[10px]">
                            <span>{isInitial ? 'Initial Paid' : 'Due Cleared'} ({p.payment_method?.toUpperCase()} {pDate}):</span>
                            <span className="font-mono font-semibold">Rs.{Number(p.amount).toFixed(2)}</span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between pt-0.5 border-t border-slate-200 font-bold">
                        <span>Total Paid:</span>
                        <span className="font-mono">Rs.{amountPaid.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between pt-1">
                      <span>Received:</span>
                      <span className="font-mono font-bold">Rs.{amountPaid.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-0.5 font-bold">
                    <span>Due Balance:</span>
                    <span className={`font-mono ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      Rs.{balanceDue.toFixed(2)} {balanceDue <= 0 ? '(Cleared)' : ''}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-[10px] text-slate-500 pt-1">
                  <p>{settings?.footer_message || 'Thank you for your visit!'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="no-print p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 gap-2">
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Next Bill</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
