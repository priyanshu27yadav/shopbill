import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Tag,
  CreditCard,
  Users,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { reportApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export const ReportsScreen: React.FC = () => {
  const { shop } = useAuth();
  const [activeTab, setActiveTab] = useState<
    | 'daily'
    | 'monthly'
    | 'item_wise'
    | 'category_wise'
    | 'discounts'
    | 'payments'
    | 'credit'
    | 'gst'
  >('daily');

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [activeTab, date, year, month]);

  const loadReport = async () => {
    setLoading(true);
    try {
      let res;
      switch (activeTab) {
        case 'daily':
          res = await reportApi.dailySales(date);
          break;
        case 'monthly':
          res = await reportApi.monthlySales(year, month);
          break;
        case 'item_wise':
          res = await reportApi.itemWiseSales();
          break;
        case 'category_wise':
          res = await reportApi.categoryWiseSales();
          break;
        case 'discounts':
          res = await reportApi.discounts();
          break;
        case 'payments':
          res = await reportApi.paymentMethods();
          break;
        case 'credit':
          res = await reportApi.customerCredit();
          break;
        case 'gst':
          res = await reportApi.gstSummary();
          break;
      }
      setReportData(res?.data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    if (!reportData) return;
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'daily' && reportData.invoices) {
      csvContent += 'Invoice #,Date,Customer,Amount,Discount,Payment Mode,Status\n';
      reportData.invoices.forEach((inv: any) => {
        csvContent += `"${inv.invoice_number}","${inv.invoice_date}","${inv.customer_name || 'Cash'}","${inv.final_amount}","${inv.total_discount}","${inv.payment_method}","${inv.status}"\n`;
      });
    } else if (activeTab === 'item_wise' && reportData.items) {
      csvContent += 'Item Name,Category,Unit,Times Billed,Quantity Sold,Gross Sales,Discounts,Net Revenue\n';
      reportData.items.forEach((it: any) => {
        csvContent += `"${it.item_name}","${it.category_name}","${it.unit}","${it.times_billed}","${it.total_quantity}","${it.gross_amount}","${it.discount_amount}","${it.net_amount}"\n`;
      });
    } else if (activeTab === 'gst' && reportData.rate_breakdown) {
      csvContent += 'GST Rate,Taxable Value,CGST Amount,SGST Amount,IGST Amount,Total Tax\n';
      reportData.rate_breakdown.forEach((r: any) => {
        csvContent += `"${r.gst_rate}%","${r.taxable_value}","${r.cgst_amount}","${r.sgst_amount}","${r.igst_amount}","${r.total_tax}"\n`;
      });
    } else {
      csvContent += JSON.stringify(reportData);
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ShopBill_${activeTab}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currency = shop?.currency_symbol || '₹';

  const reportTabs = [
    { id: 'daily', name: '1. Daily Sales' },
    { id: 'monthly', name: '2. Monthly Sales' },
    { id: 'item_wise', name: '3. Item-wise Sales' },
    { id: 'category_wise', name: '4. Category-wise Sales' },
    { id: 'discounts', name: '5. Discounts Report' },
    { id: 'payments', name: '6. Payment Methods' },
    { id: 'credit', name: '7. Customer Credit (Udhaar)' },
    { id: 'gst', name: '8. GST Summary (GSTR-1)' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>Reports & Business Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Download daily, monthly, tax and sales reports in CSV / Excel or print.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={exportToCsv}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {reportTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-2 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'bg-white dark:bg-slate-900 text-emerald-600 border-t-2 border-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Date Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        {activeTab === 'daily' ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">Select Date:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono"
            />
          </div>
        ) : activeTab === 'monthly' ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">Select Month & Year:</span>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December',
              ].map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            Showing comprehensive all-time and current period data.
          </p>
        )}
      </div>

      {/* Report Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        {loading ? (
          <p className="text-center py-12 text-slate-400 text-xs">Generating report...</p>
        ) : !reportData ? (
          <p className="text-center py-12 text-slate-400 text-xs">No data available.</p>
        ) : activeTab === 'daily' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-[10px] uppercase font-bold text-slate-400">Bills Generated</p>
                <p className="text-xl font-black mt-1">{reportData.summary.total_bills}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Sales</p>
                <p className="text-xl font-black font-mono text-emerald-600 mt-1">
                  {currency}{Number(reportData.summary.total_sales).toFixed(2)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Discounts</p>
                <p className="text-xl font-black font-mono text-purple-600 mt-1">
                  {currency}{Number(reportData.summary.total_discounts).toFixed(2)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-[10px] uppercase font-bold text-slate-400">Credit / Udhaar Sales</p>
                <p className="text-xl font-black font-mono text-rose-600 mt-1">
                  {currency}{Number(reportData.summary.credit_sales).toFixed(2)}
                </p>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2">Bill No</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-right">Discount</th>
                  <th className="py-2 text-center">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {reportData.invoices?.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="py-2 font-bold">{inv.invoice_number}</td>
                    <td className="py-2 font-sans">{inv.customer_name || 'Cash Customer'}</td>
                    <td className="py-2 text-right font-bold">₹{inv.final_amount}</td>
                    <td className="py-2 text-right text-purple-600">-₹{inv.total_discount}</td>
                    <td className="py-2 text-center uppercase text-[10px]">{inv.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'monthly' ? (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-emerald-800 dark:text-emerald-300">
                  Monthly Total Sales ({reportData.summary.month})
                </p>
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                  {currency}{Number(reportData.summary.total_sales).toFixed(2)}
                </p>
              </div>
              <div className="text-right text-xs">
                <p>Bills: <b>{reportData.summary.total_bills}</b></p>
                <p>Discounts: <b>₹{reportData.summary.total_discounts}</b></p>
                <p>Tax Collected: <b>₹{reportData.summary.total_tax}</b></p>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2">Date</th>
                  <th className="py-2 text-center">Bills</th>
                  <th className="py-2 text-right">Gross Sales</th>
                  <th className="py-2 text-right">Discounts</th>
                  <th className="py-2 text-right">Net Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {reportData.daily_breakdown?.map((day: any) => (
                  <tr key={day.date}>
                    <td className="py-2 font-bold">{day.date}</td>
                    <td className="py-2 text-center">{day.bills_count}</td>
                    <td className="py-2 text-right">₹{day.gross_sales}</td>
                    <td className="py-2 text-right text-purple-600">-₹{day.total_discounts}</td>
                    <td className="py-2 text-right font-bold text-emerald-600">₹{day.total_sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'item_wise' ? (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                <th className="py-2">Item Name</th>
                <th className="py-2">Category</th>
                <th className="py-2 text-center">Unit</th>
                <th className="py-2 text-center">Qty Sold</th>
                <th className="py-2 text-right">Net Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reportData.items?.map((it: any, i: number) => (
                <tr key={i}>
                  <td className="py-2 font-bold text-slate-800 dark:text-slate-100">{it.item_name}</td>
                  <td className="py-2 text-slate-400">{it.category_name}</td>
                  <td className="py-2 text-center font-mono">{it.unit}</td>
                  <td className="py-2 text-center font-mono font-bold">{it.total_quantity}</td>
                  <td className="py-2 text-right font-mono font-extrabold text-emerald-600">₹{it.net_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : activeTab === 'gst' ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex justify-between text-xs">
              <span>Shop GSTIN: <b>{reportData.shop_gstin || 'N/A'}</b></span>
              <span>Total Tax Collected: <b className="font-mono text-emerald-600">₹{Number(reportData.total_tax).toFixed(2)}</b></span>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2">GST Rate</th>
                  <th className="py-2 text-right">Taxable Value</th>
                  <th className="py-2 text-right">CGST</th>
                  <th className="py-2 text-right">SGST</th>
                  <th className="py-2 text-right">IGST</th>
                  <th className="py-2 text-right">Total Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {reportData.rate_breakdown?.map((r: any, i: number) => (
                  <tr key={i}>
                    <td className="py-2 font-bold">{r.gst_rate}%</td>
                    <td className="py-2 text-right">₹{r.taxable_value}</td>
                    <td className="py-2 text-right">₹{r.cgst_amount}</td>
                    <td className="py-2 text-right">₹{r.sgst_amount}</td>
                    <td className="py-2 text-right">₹{r.igst_amount}</td>
                    <td className="py-2 text-right font-bold text-emerald-600">₹{r.total_tax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <pre className="text-xs font-mono overflow-auto p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            {JSON.stringify(reportData, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
