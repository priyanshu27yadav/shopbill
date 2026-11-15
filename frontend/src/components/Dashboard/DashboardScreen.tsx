import React, { useState, useEffect, useMemo } from 'react';
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
  Zap,
  Package,
  CheckCircle2,
  X,
  Plus,
} from 'lucide-react';
import { dashboardApi, productApi } from '../../api';
import { DashboardData, Product, InvoiceItem } from '../../types';
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

  // Dashboard Quick Lookup Tabs: 'product' (0ms Instant Item Search) vs 'phone' (Customer Khata)
  const [heroTab, setHeroTab] = useState<'product' | 'phone'>('product');
  const [quickPhone, setQuickPhone] = useState('');
  const [productQuery, setProductQuery] = useState('');

  // Instant in-memory product catalog cache for 0.0ms dashboard search
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('shopbill_cached_products');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    loadDashboard();
    // Preload & refresh products in background for 0ms dashboard search
    productApi
      .list({ all: true })
      .then((res) => {
        const prods = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setProducts(prods);
        localStorage.setItem('shopbill_cached_products', JSON.stringify(prods));
        if (shop) {
          localStorage.setItem(`shopbill_products_${shop.id}`, JSON.stringify(prods));
        }
      })
      .catch((e) => console.warn('Could not refresh dashboard products:', e));
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

  // Instant in-memory product search (0.0ms delay)
  const dashboardSearchResults = useMemo(() => {
    if (!productQuery.trim()) return [];
    const q = productQuery.trim().toLowerCase();
    return products
      .filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.hsn_code && p.hsn_code.toLowerCase().includes(q)) ||
          (p.category?.name && p.category.name.toLowerCase().includes(q))
        );
      })
      .slice(0, 6); // Top 6 instant matches
  }, [products, productQuery]);

  // 1-Click Add Product from Dashboard directly into active Bill & redirect
  const handleAddProductFromDashboard = (prod: Product) => {
    try {
      const defaultPrice = Number(prod.default_price);
      const gstRate = Number(prod.gst_rate) || 0;
      const key = shop ? `shopbill_active_draft_${shop.id}` : 'shopbill_active_draft';
      const existingDraftStr = localStorage.getItem(key) || localStorage.getItem('shopbill_active_draft');
      let currentItems: InvoiceItem[] = [];
      let draftData: any = {};

      if (existingDraftStr) {
        try {
          draftData = JSON.parse(existingDraftStr);
          if (Array.isArray(draftData.cartItems)) {
            currentItems = draftData.cartItems;
          }
        } catch {}
      }

      // Check if already in draft
      const idx = currentItems.findIndex((it) => it.product_id === prod.id);
      if (idx > -1) {
        currentItems[idx].quantity += 1;
        const subtotal = currentItems[idx].quantity * currentItems[idx].unit_price;
        currentItems[idx].subtotal = subtotal;
        currentItems[idx].total_amount = subtotal;
      } else {
        const subtotal = 1 * defaultPrice;
        currentItems.push({
          product_id: prod.id,
          item_name: prod.name,
          category_name: prod.category?.name || 'General',
          is_custom_item: false,
          unit: prod.unit || 'pcs',
          quantity: 1,
          unit_price: defaultPrice,
          discount_type: 'fixed',
          discount_value: 0,
          discount_amount: 0,
          subtotal,
          gst_rate: gstRate,
          hsn_code: prod.hsn_code,
          total_amount: subtotal,
        });
      }

      const updatedDraft = {
        ...draftData,
        cartItems: currentItems,
        billingMode: 'catalogue',
        updatedAt: Date.now(),
      };

      localStorage.setItem(key, JSON.stringify(updatedDraft));
      localStorage.setItem('shopbill_active_draft', JSON.stringify(updatedDraft));

      // Navigate to billing screen with item already preserved in cart!
      navigate('/billing?mode=catalogue');
    } catch (err) {
      console.error('Error adding product from dashboard:', err);
      navigate('/billing?mode=catalogue');
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
            Smart Retail Billing POS • Instant Item Search • Complete Customer History & Sales Return System
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Billing Counter Online
          </span>
        </div>
      </div>

      {/* QUICK DUAL COUNTER: INSTANT PRODUCT SEARCH & CUSTOMER KHATA LOOKUP */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-4 sm:p-5 text-white shadow-xl shadow-emerald-700/20 space-y-3">
        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-white/20 pb-2.5">
          <button
            type="button"
            onClick={() => setHeroTab('product')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              heroTab === 'product'
                ? 'bg-white text-emerald-900 shadow-md scale-102'
                : 'bg-white/15 text-emerald-100 hover:bg-white/25'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>⚡ Instant Item Search (सर्च सामान)</span>
          </button>
          <button
            type="button"
            onClick={() => setHeroTab('phone')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              heroTab === 'phone'
                ? 'bg-white text-emerald-900 shadow-md scale-102'
                : 'bg-white/15 text-emerald-100 hover:bg-white/25'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>📱 Customer Mobile / Khata Lookup</span>
          </button>
        </div>

        {heroTab === 'product' ? (
          /* TAB 1: 0ms INSTANT ITEM SEARCH ON DASHBOARD */
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="space-y-0.5 text-center md:text-left">
                <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2 justify-center md:justify-start">
                  <span>Fast Item & Price Search</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    0ms Instant
                  </span>
                </h2>
                <p className="text-xs text-emerald-100">
                  Search any item by brand or name (e.g. Havells, Anchor, Wire, Switch) to see price or 1-click add to bill!
                </p>
              </div>

              <div className="relative w-full md:w-80 shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Type item name or brand..."
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-xl bg-white text-slate-900 border-0 focus:outline-none focus:ring-2 focus:ring-amber-300 shadow"
                />
                {productQuery && (
                  <button
                    type="button"
                    onClick={() => setProductQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Instant Search Results Dropdown/Grid */}
            {productQuery.trim() && (
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3 border border-white/30 text-slate-900 dark:text-white shadow-2xl space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-1 border-b border-slate-200 dark:border-slate-800">
                  <span>Found {dashboardSearchResults.length} match(es)</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Click "+ Add to Bill" to start/continue billing immediately
                  </span>
                </div>

                {dashboardSearchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No products matching "{productQuery}". Try searching another name or brand.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dashboardSearchResults.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 hover:border-emerald-500 transition-all"
                      >
                        <div className="overflow-hidden">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                            {prod.name}
                          </p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {prod.category?.name || 'General'}
                            </span>
                            <span>• /{prod.unit}</span>
                            {Number(prod.gst_rate) > 0 && <span>• {prod.gst_rate}% GST</span>}
                          </p>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-2">
                          <div>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                              {currency}{Number(prod.default_price).toLocaleString('en-IN')}
                            </span>
                            {prod.mrp && Number(prod.mrp) > Number(prod.default_price) && (
                              <p className="text-[10px] text-slate-400 line-through">
                                {currency}{Number(prod.mrp).toLocaleString('en-IN')}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddProductFromDashboard(prod)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1 shrink-0 active:scale-95 transition-transform"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: CUSTOMER KHATA & HISTORY LOOKUP */
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
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
        )}
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
