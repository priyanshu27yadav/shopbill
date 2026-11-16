import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  Tag,
  CreditCard,
  Users,
  ShieldCheck,
  ChevronRight,
  Percent,
  Receipt,
  Layers,
  Wallet,
  Coins,
  AlertCircle,
  ArrowUpRight,
  ShoppingBag,
} from 'lucide-react';
import { reportApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export const ReportsScreen: React.FC = () => {
  const { shop } = useAuth();
  const navigate = useNavigate();
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

  // Cache fetched reports by tab/date key for instant tab switching
  const [reportsCache, setReportsCache] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const cacheKey = useMemo(() => {
    if (activeTab === 'daily') return `daily_${date}`;
    if (activeTab === 'monthly') return `monthly_${year}_${month}`;
    return activeTab;
  }, [activeTab, date, year, month]);

  const currentReportData = reportsCache[cacheKey] || null;

  useEffect(() => {
    loadReport();
  }, [cacheKey]);

  const loadReport = async () => {
    // If already in cache, do not show full screen loader
    if (!reportsCache[cacheKey]) {
      setLoading(true);
    }
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
      if (res?.data) {
        setReportsCache((prev) => ({
          ...prev,
          [cacheKey]: res.data,
        }));
      }
    } catch (e) {
      console.error('Failed to load report:', e);
    } finally {
      setLoading(false);
    }
  };

  const currency = shop?.currency_symbol || '₹';

  const exportToCsv = () => {
    if (!currentReportData) return;
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'daily' && currentReportData.invoices) {
      csvContent += 'Invoice #,Date,Customer,Subtotal,Discount,Final Amount,Payment Mode,Status\n';
      currentReportData.invoices.forEach((inv: any) => {
        csvContent += `"${inv.invoice_number}","${inv.invoice_date}","${inv.customer_name || 'Cash Customer'}","${inv.subtotal}","${inv.total_discount}","${inv.final_amount}","${inv.payment_method}","${inv.status}"\n`;
      });
    } else if (activeTab === 'monthly' && currentReportData.daily_breakdown) {
      csvContent += 'Date,Bills Count,Gross Sales,Discounts,Tax Collected,Net Sales,Collected,Credit\n';
      currentReportData.daily_breakdown.forEach((day: any) => {
        csvContent += `"${day.date}","${day.bills_count}","${day.gross_sales}","${day.total_discounts}","${day.total_tax}","${day.total_sales}","${day.collected}","${day.credit}"\n`;
      });
    } else if (activeTab === 'item_wise' && currentReportData.items) {
      csvContent += 'Item Name,Category,Unit,Times Billed,Quantity Sold,Gross Sales,Discounts,Net Revenue\n';
      currentReportData.items.forEach((it: any) => {
        csvContent += `"${it.item_name}","${it.category_name || 'General'}","${it.unit}","${it.times_billed}","${it.total_quantity}","${it.gross_amount}","${it.discount_amount}","${it.net_amount}"\n`;
      });
    } else if (activeTab === 'category_wise' && currentReportData.categories) {
      csvContent += 'Category Name,Invoices Count,Total Items Sold,Total Revenue\n';
      currentReportData.categories.forEach((cat: any) => {
        csvContent += `"${cat.category_name}","${cat.invoice_count}","${cat.total_items_sold}","${cat.total_revenue}"\n`;
      });
    } else if (activeTab === 'discounts' && currentReportData.invoices) {
      csvContent += 'Invoice #,Date,Customer,Subtotal,Item Discount,Bill Discount,Total Discount,Final Amount,Payment Mode\n';
      currentReportData.invoices.forEach((inv: any) => {
        csvContent += `"${inv.invoice_number}","${inv.invoice_date}","${inv.customer_name || 'Cash Customer'}","${inv.subtotal}","${inv.item_discount_total || 0}","${inv.overall_discount_amount || 0}","${inv.total_discount}","${inv.final_amount}","${inv.payment_method}"\n`;
      });
    } else if (activeTab === 'payments' && currentReportData.methods) {
      csvContent += 'Payment Method,Transactions,Total Collected\n';
      currentReportData.methods.forEach((m: any) => {
        csvContent += `"${m.payment_method.toUpperCase()}","${m.total_transactions}","${m.total_collected}"\n`;
      });
    } else if (activeTab === 'credit' && currentReportData.customers) {
      csvContent += 'Customer Name,Phone,Address,Total Purchases,Pending Udhaar Balance,Credit Limit\n';
      currentReportData.customers.forEach((c: any) => {
        csvContent += `"${c.name}","${c.phone || ''}","${c.address || ''}","${c.total_purchases}","${c.current_balance}","${c.credit_limit || 0}"\n`;
      });
    } else if (activeTab === 'gst' && currentReportData.rate_breakdown) {
      csvContent += 'GST Rate,Taxable Value,CGST Amount,SGST Amount,IGST Amount,Total Tax\n';
      currentReportData.rate_breakdown.forEach((r: any) => {
        csvContent += `"${r.gst_rate}%","${r.taxable_value}","${r.cgst_amount}","${r.sgst_amount}","${r.igst_amount}","${r.total_tax}"\n`;
      });
    } else {
      csvContent += JSON.stringify(currentReportData);
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ShopBill_${activeTab}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportTabs = [
    { id: 'daily', name: '1. Daily Sales', icon: Calendar },
    { id: 'monthly', name: '2. Monthly Sales', icon: TrendingUp },
    { id: 'item_wise', name: '3. Item-wise Sales', icon: ShoppingBag },
    { id: 'category_wise', name: '4. Category-wise Sales', icon: Layers },
    { id: 'discounts', name: '5. Discounts Report', icon: Percent },
    { id: 'payments', name: '6. Payment Methods', icon: Wallet },
    { id: 'credit', name: '7. Customer Credit (Udhaar)', icon: Users },
    { id: 'gst', name: '8. GST Summary (GSTR-1)', icon: ShieldCheck },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>Reports & Business Analytics (रिपोर्ट्स एवं व्यापार विश्लेषण)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Download daily, monthly, category, tax, and customer credit ledger reports in Excel / CSV or print.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={exportToCsv}
            disabled={!currentReportData}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
        {reportTabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 border-t-2 border-emerald-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* Date Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
        {activeTab === 'daily' ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Select Date:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono"
            />
          </div>
        ) : activeTab === 'monthly' ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Select Month & Year:</span>
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
            Showing comprehensive all-time store performance data.
          </p>
        )}

        <div className="text-[11px] font-semibold text-slate-400">
          Auto-updates with every invoice generated
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 p-6 min-h-[300px]">
        {loading && !currentReportData ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold">Generating analytics report...</p>
          </div>
        ) : !currentReportData ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">No report data available for this selection.</p>
          </div>
        ) : activeTab === 'daily' ? (
          /* TAB 1: DAILY SALES */
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Bills Generated</p>
                <p className="text-xl font-black mt-1 text-slate-800 dark:text-slate-100">{currentReportData.summary?.total_bills || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-[10px] uppercase font-bold text-emerald-600">Total Sales</p>
                <p className="text-xl font-black font-mono text-emerald-600 mt-1">
                  {currency}{Number(currentReportData.summary?.total_sales || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                <p className="text-[10px] uppercase font-bold text-purple-600">Total Discounts</p>
                <p className="text-xl font-black font-mono text-purple-600 mt-1">
                  {currency}{Number(currentReportData.summary?.total_discounts || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                <p className="text-[10px] uppercase font-bold text-rose-600">Credit / Udhaar</p>
                <p className="text-xl font-black font-mono text-rose-600 mt-1">
                  {currency}{Number(currentReportData.summary?.credit_sales || 0).toFixed(2)}
                </p>
              </div>
            </div>

            {(!currentReportData.invoices || currentReportData.invoices.length === 0) ? (
              <p className="text-center py-8 text-xs text-slate-400">No invoices generated on this day.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                      <th className="py-2.5">Bill No</th>
                      <th className="py-2.5">Customer</th>
                      <th className="py-2.5 text-right">Amount</th>
                      <th className="py-2.5 text-right">Discount</th>
                      <th className="py-2.5 text-center">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {currentReportData.invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{inv.invoice_number}</td>
                        <td className="py-2.5 font-sans">{inv.customer_name || 'Cash Customer'}</td>
                        <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">{currency}{Number(inv.final_amount).toFixed(2)}</td>
                        <td className="py-2.5 text-right text-purple-600">-{currency}{Number(inv.total_discount).toFixed(2)}</td>
                        <td className="py-2.5 text-center uppercase text-[10px] font-bold">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {inv.payment_method}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'monthly' ? (
          /* TAB 2: MONTHLY SALES */
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase font-bold text-emerald-800 dark:text-emerald-300">
                  Monthly Total Sales ({currentReportData.summary?.month})
                </p>
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                  {currency}{Number(currentReportData.summary?.total_sales || 0).toFixed(2)}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 text-center">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Total Bills</p>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{currentReportData.summary?.total_bills || 0}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 text-center">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Discounts</p>
                  <p className="text-sm font-extrabold text-purple-600">{currency}{Number(currentReportData.summary?.total_discounts || 0).toFixed(2)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 text-center">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Tax Collected</p>
                  <p className="text-sm font-extrabold text-blue-600">{currency}{Number(currentReportData.summary?.total_tax || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5 text-center">Bills</th>
                    <th className="py-2.5 text-right">Gross Sales</th>
                    <th className="py-2.5 text-right">Discounts</th>
                    <th className="py-2.5 text-right">Net Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {currentReportData.daily_breakdown?.map((day: any) => (
                    <tr key={day.date} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{day.date}</td>
                      <td className="py-2.5 text-center">{day.bills_count}</td>
                      <td className="py-2.5 text-right">{currency}{Number(day.gross_sales).toFixed(2)}</td>
                      <td className="py-2.5 text-right text-purple-600">-{currency}{Number(day.total_discounts).toFixed(2)}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-600">{currency}{Number(day.total_sales).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'item_wise' ? (
          /* TAB 3: ITEM-WISE SALES */
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Distinct Items Sold</p>
                <p className="text-xl font-black mt-1 text-slate-800 dark:text-slate-100">
                  {currentReportData.items?.length || 0} items
                </p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-[10px] uppercase font-bold text-emerald-600">Total Net Revenue</p>
                <p className="text-xl font-black font-mono text-emerald-600 mt-1">
                  {currency}
                  {Number(
                    currentReportData.items?.reduce((acc: number, it: any) => acc + Number(it.net_amount || 0), 0) || 0
                  ).toFixed(2)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                <p className="text-[10px] uppercase font-bold text-purple-600">Top Performing Item</p>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-1 truncate">
                  {currentReportData.items?.[0]?.item_name || 'N/A'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                    <th className="py-2.5">Item Name</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5 text-center">Unit</th>
                    <th className="py-2.5 text-center">Qty Sold</th>
                    <th className="py-2.5 text-right">Net Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentReportData.items?.map((it: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">{it.item_name}</td>
                      <td className="py-2.5 text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px]">
                          {it.category_name || 'General'}
                        </span>
                      </td>
                      <td className="py-2.5 text-center font-mono text-slate-500">{it.unit}</td>
                      <td className="py-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">{Number(it.total_quantity)}</td>
                      <td className="py-2.5 text-right font-mono font-extrabold text-emerald-600">
                        {currency}{Number(it.net_amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'category_wise' ? (
          /* TAB 4: CATEGORY-WISE SALES */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  Categories Active
                </p>
                <p className="text-xl font-black mt-1 text-slate-800 dark:text-slate-100">
                  {currentReportData.categories?.length || 0}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-[10px] uppercase font-bold text-emerald-600 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-600" />
                  Total Category Revenue
                </p>
                <p className="text-xl font-black font-mono text-emerald-600 mt-1">
                  {currency}
                  {Number(
                    currentReportData.total_revenue ||
                    currentReportData.categories?.reduce((acc: number, c: any) => acc + Number(c.total_revenue || 0), 0) ||
                    0
                  ).toFixed(2)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                <p className="text-[10px] uppercase font-bold text-blue-600 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                  Total Items Sold
                </p>
                <p className="text-xl font-black font-mono text-blue-600 mt-1">
                  {Number(
                    currentReportData.total_items_sold ||
                    currentReportData.categories?.reduce((acc: number, c: any) => acc + Number(c.total_items_sold || 0), 0) ||
                    0
                  )}
                </p>
              </div>
            </div>

            {(!currentReportData.categories || currentReportData.categories.length === 0) ? (
              <p className="text-center py-8 text-xs text-slate-400">No category sales recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                      <th className="py-2.5">Category Name</th>
                      <th className="py-2.5 text-center">Bills Count</th>
                      <th className="py-2.5 text-center">Total Items Sold</th>
                      <th className="py-2.5 text-right">Revenue (₹)</th>
                      <th className="py-2.5 text-right pr-4">Revenue Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(() => {
                      const totalRev = currentReportData.categories.reduce(
                        (acc: number, c: any) => acc + Number(c.total_revenue || 0),
                        0
                      ) || 1;
                      return currentReportData.categories.map((cat: any, idx: number) => {
                        const rev = Number(cat.total_revenue || 0);
                        const pct = Math.round((rev / totalRev) * 100);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="py-3 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              <span>{cat.category_name}</span>
                            </td>
                            <td className="py-3 text-center font-mono font-semibold text-slate-600 dark:text-slate-300">
                              {cat.invoice_count}
                            </td>
                            <td className="py-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                              {Number(cat.total_items_sold)}
                            </td>
                            <td className="py-3 text-right font-mono font-black text-emerald-600 text-sm">
                              {currency}{rev.toFixed(2)}
                            </td>
                            <td className="py-3 text-right pr-4">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-mono font-bold text-slate-500 w-8 text-right">
                                  {pct}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'discounts' ? (
          /* TAB 5: DISCOUNTS REPORT */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                <p className="text-[10px] uppercase font-bold text-purple-600 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-purple-600" />
                  Total Discounts Given
                </p>
                <p className="text-xl font-black font-mono text-purple-600 mt-1">
                  {currency}{Number(currentReportData.total_discount_given || 0).toFixed(2)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-slate-400" />
                  Bills with Discounts
                </p>
                <p className="text-xl font-black mt-1 text-slate-800 dark:text-slate-100">
                  {currentReportData.bills_with_discounts || currentReportData.invoices?.length || 0} bills
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-[10px] uppercase font-bold text-emerald-600 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-600" />
                  Avg Discount / Bill
                </p>
                <p className="text-xl font-black font-mono text-emerald-600 mt-1">
                  {currency}
                  {currentReportData.bills_with_discounts > 0
                    ? (Number(currentReportData.total_discount_given) / Number(currentReportData.bills_with_discounts)).toFixed(2)
                    : '0.00'}
                </p>
              </div>
            </div>

            {(!currentReportData.invoices || currentReportData.invoices.length === 0) ? (
              <p className="text-center py-8 text-xs text-slate-400">No discounts have been issued in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                      <th className="py-2.5">Bill No</th>
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Customer</th>
                      <th className="py-2.5 text-right">Subtotal</th>
                      <th className="py-2.5 text-right">Item Disc</th>
                      <th className="py-2.5 text-right">Bill Disc</th>
                      <th className="py-2.5 text-right">Total Discount</th>
                      <th className="py-2.5 text-right">Final Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {currentReportData.invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 font-bold text-slate-800 dark:text-slate-100">{inv.invoice_number}</td>
                        <td className="py-3 text-slate-500 font-sans text-[11px]">
                          {inv.invoice_date?.split('T')[0] || inv.invoice_date}
                        </td>
                        <td className="py-3 font-sans font-medium text-slate-700 dark:text-slate-300">
                          {inv.customer_name || 'Cash Customer'}
                        </td>
                        <td className="py-3 text-right text-slate-600 dark:text-slate-400">
                          {currency}{Number(inv.subtotal).toFixed(2)}
                        </td>
                        <td className="py-3 text-right text-slate-500">
                          {inv.item_discount_total > 0 ? `-${currency}${Number(inv.item_discount_total).toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3 text-right text-slate-500">
                          {inv.overall_discount_amount > 0 ? `-${currency}${Number(inv.overall_discount_amount).toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3 text-right font-bold text-purple-600 text-sm">
                          -{currency}{Number(inv.total_discount).toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-black text-emerald-600 text-sm">
                          {currency}{Number(inv.final_amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'payments' ? (
          /* TAB 6: PAYMENT METHODS */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-[10px] uppercase font-bold text-emerald-600 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  Total Amount Collected
                </p>
                <p className="text-2xl font-black font-mono text-emerald-600 mt-1">
                  {currency}{Number(currentReportData.total_collected || 0).toFixed(2)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  Total Payment Transactions
                </p>
                <p className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-100">
                  {currentReportData.total_transactions ||
                    currentReportData.methods?.reduce((acc: number, m: any) => acc + Number(m.total_transactions || 0), 0) ||
                    0}
                </p>
              </div>
            </div>

            {(!currentReportData.methods || currentReportData.methods.length === 0) ? (
              <p className="text-center py-8 text-xs text-slate-400">No payment transaction records found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(() => {
                  const totalCol = Number(currentReportData.total_collected) || 1;
                  return currentReportData.methods.map((m: any, idx: number) => {
                    const col = Number(m.total_collected || 0);
                    const pct = Math.round((col / totalCol) * 100);
                    const method = String(m.payment_method).toLowerCase();
                    const isCash = method === 'cash';
                    const isUpi = method === 'upi';
                    const isCard = method === 'card';

                    return (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 shadow-xs flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                              isCash
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : isUpi
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : isCard
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {m.payment_method}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {m.total_transactions} txns
                          </span>
                        </div>

                        <div className="my-4">
                          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                            {currency}{col.toFixed(2)}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {pct}% of total store collections
                          </p>
                        </div>

                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              isCash
                                ? 'bg-emerald-500'
                                : isUpi
                                ? 'bg-blue-500'
                                : isCard
                                ? 'bg-purple-500'
                                : 'bg-slate-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        ) : activeTab === 'credit' ? (
          /* TAB 7: CUSTOMER CREDIT (UDHAAR) */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
                <p className="text-[10px] uppercase font-bold text-rose-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Total Outstanding Udhaar
                </p>
                <p className="text-2xl font-black font-mono text-rose-600 mt-1">
                  {currency}{Number(currentReportData.total_outstanding || 0).toFixed(2)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Debtor Accounts
                </p>
                <p className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-100">
                  {currentReportData.total_credit_customers || currentReportData.customers?.length || 0} customers
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-[10px] uppercase font-bold text-emerald-600 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  Actionable Khata
                </p>
                <button
                  onClick={() => navigate('/customers')}
                  className="mt-1 flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                >
                  <span>Open Udhaar Khata / Collect</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {(!currentReportData.customers || currentReportData.customers.length === 0) ? (
              <div className="text-center py-10 text-emerald-600">
                <p className="font-bold text-sm">🎉 No pending udhaar!</p>
                <p className="text-xs text-slate-400 mt-1">All customer accounts are completely settled.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                      <th className="py-2.5">Customer Name</th>
                      <th className="py-2.5">Mobile Phone</th>
                      <th className="py-2.5">Address</th>
                      <th className="py-2.5 text-right">Total Purchases</th>
                      <th className="py-2.5 text-right">Pending Udhaar (Due)</th>
                      <th className="py-2.5 text-right">Credit Limit</th>
                      <th className="py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentReportData.customers.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center shrink-0">
                            {c.name?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <span>{c.name}</span>
                        </td>
                        <td className="py-3 font-mono text-slate-600 dark:text-slate-300">
                          {c.phone || '—'}
                        </td>
                        <td className="py-3 text-slate-400 text-[11px]">
                          {c.address || '—'}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                          {currency}{Number(c.total_purchases || 0).toFixed(2)}
                        </td>
                        <td className="py-3 text-right">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-mono font-black text-xs border border-rose-200 dark:border-rose-900/60">
                            {currency}{Number(c.current_balance).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono text-slate-400">
                          {c.credit_limit ? `${currency}${Number(c.credit_limit).toFixed(2)}` : 'No limit'}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => navigate('/customers')}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                          >
                            Ledger &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'gst' ? (
          /* TAB 8: GST SUMMARY */
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500">Shop GSTIN:</span>{' '}
                <b className="font-mono text-slate-900 dark:text-white uppercase">
                  {currentReportData.shop_gstin || shop?.gstin || 'Non-GST Retailer'}
                </b>
              </div>
              <div>
                <span className="text-slate-500">Total Tax Collected:</span>{' '}
                <b className="font-mono text-emerald-600 text-sm">
                  {currency}{Number(currentReportData.total_tax || 0).toFixed(2)}
                </b>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                    <th className="py-2.5">GST Rate</th>
                    <th className="py-2.5 text-right">Taxable Value</th>
                    <th className="py-2.5 text-right">CGST</th>
                    <th className="py-2.5 text-right">SGST</th>
                    <th className="py-2.5 text-right">IGST</th>
                    <th className="py-2.5 text-right">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {currentReportData.rate_breakdown?.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{r.gst_rate}%</td>
                      <td className="py-2.5 text-right">{currency}{Number(r.taxable_value).toFixed(2)}</td>
                      <td className="py-2.5 text-right text-slate-500">{currency}{Number(r.cgst_amount).toFixed(2)}</td>
                      <td className="py-2.5 text-right text-slate-500">{currency}{Number(r.sgst_amount).toFixed(2)}</td>
                      <td className="py-2.5 text-right text-slate-500">{currency}{Number(r.igst_amount).toFixed(2)}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-600">
                        {currency}{Number(r.total_tax).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
