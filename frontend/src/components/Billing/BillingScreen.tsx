import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  Search,
  Plus,
  Trash2,
  Printer,
  QrCode,
  Edit3,
  Receipt,
  ShoppingCart,
  RotateCcw,
  Package,
  X,
  CreditCard,
  Banknote,
  Building2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Zap,
  Volume2,
  Loader2,
  Sparkles,
  Store,
  User,
  UserPlus,
  MapPin,
  Phone,
} from 'lucide-react';
import { productApi, categoryApi, customerApi, invoiceApi, settingsApi } from '../../api';
import { Category, Product, Customer, InvoiceItem, InvoiceSetting } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { PrintInvoiceModal } from './PrintInvoiceModal';
import { CustomerLookupModal } from '../Customers/CustomerLookupModal';
import { SalesReturnModal } from '../Returns/SalesReturnModal';

// Pleasant Web Audio API UPI Soundbox Chime (works 100% offline, zero latency)
const playUpiPaymentChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First tone (pleasant notification tone)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880, now + 0.08); // A5
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second higher chime tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.14); // D6
    gain2.gain.setValueAtTime(0.22, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.6);
  } catch (e) {
    // Audio context may be restricted before user interaction; ignore silently
  }
};

export const BillingScreen: React.FC = () => {
  const { shop } = useAuth();
  const { isOnline, saveOfflineInvoice, cachedCatalogue } = useOffline();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: Catalogue-Based (1) vs Custom/Personal Pricing (2)
  const [billingMode, setBillingMode] = useState<'catalogue' | 'custom'>('catalogue');

  // Small screens view tab ('items' | 'cart')
  const [mobileTab, setMobileTab] = useState<'items' | 'cart'>('items');

  // Catalogue data with INSTANT LOCALSTORAGE CACHE INITIALIZATION (0.0ms delay)
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const cached = localStorage.getItem('shopbill_cached_categories');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('shopbill_cached_products');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Cart / Bill items with AUTOMATIC PERSISTENCE across page switches & reloads
  const [cartItems, setCartItems] = useState<InvoiceItem[]>(() => {
    try {
      const saved = localStorage.getItem('shopbill_active_draft');
      if (saved) {
        const d = JSON.parse(saved);
        if (Array.isArray(d.cartItems) && d.cartItems.length > 0) return d.cartItems;
      }
    } catch {}
    return [];
  });

  // Customer / Buyer Details with AUTOMATIC DRAFT PERSISTENCE
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const cached = localStorage.getItem('shopbill_cached_customers');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(() => {
    try {
      const saved = localStorage.getItem('shopbill_active_draft');
      if (saved) {
        const d = JSON.parse(saved);
        return d.selectedCustomer || null;
      }
    } catch {}
    return null;
  });

  const [customerName, setCustomerName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('shopbill_active_draft');
      if (saved) {
        const d = JSON.parse(saved);
        return d.customerName || '';
      }
    } catch {}
    return '';
  });

  const [customerPhone, setCustomerPhone] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('shopbill_active_draft');
      if (saved) {
        const d = JSON.parse(saved);
        return d.customerPhone || '';
      }
    } catch {}
    return '';
  });

  const [customerAddress, setCustomerAddress] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('shopbill_active_draft');
      if (saved) {
        const d = JSON.parse(saved);
        return d.customerAddress || '';
      }
    } catch {}
    return '';
  });

  const [customerGstin, setCustomerGstin] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('shopbill_active_draft');
      if (saved) {
        const d = JSON.parse(saved);
        return d.customerGstin || '';
      }
    } catch {}
    return '';
  });

  // Buyer Prompt Modal State (asks Name, Phone, Address before/during adding items)
  const [showBuyerModal, setShowBuyerModal] = useState<boolean>(false);
  const [showPhoneLookupModal, setShowPhoneLookupModal] = useState<boolean>(false);
  const [showSalesReturnModal, setShowSalesReturnModal] = useState<boolean>(false);
  const [buyerInputName, setBuyerInputName] = useState<string>('');
  const [buyerInputPhone, setBuyerInputPhone] = useState<string>('');
  const [buyerInputAddress, setBuyerInputAddress] = useState<string>('');
  const [buyerInputGstin, setBuyerInputGstin] = useState<string>('');
  const [saveBuyerToDirectory, setSaveBuyerToDirectory] = useState<boolean>(true);
  const [isSavingBuyer, setIsSavingBuyer] = useState<boolean>(false);

  // Discount options
  const [overallDiscountType, setOverallDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [overallDiscountValue, setOverallDiscountValue] = useState<number>(0);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer' | 'credit'>('cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [billNotes, setBillNotes] = useState('');

  // QR Code State: Standee QR vs Dynamic Amount QR
  const [qrSource, setQrSource] = useState<'standee' | 'dynamic'>('standee');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'waiting' | 'paid' | 'generating'>('idle');
  const [autoDetectSeconds, setAutoDetectSeconds] = useState<number | null>(null);

  // Invoice Setting & Completed Invoice for printing
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSetting | null>(null);
  const [completedInvoice, setCompletedInvoice] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Item Quick Inputs for Mode 2
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [customQty, setCustomQty] = useState<number>(1);
  const [customUnit, setCustomUnit] = useState<string>('pcs');
  const [customCategory, setCustomCategory] = useState<string>('General');
  const [customSaveToCatalogue, setCustomSaveToCatalogue] = useState<boolean>(false);
  const [customGst, setCustomGst] = useState<number>(0);

  // Focus refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customNameRef = useRef<HTMLInputElement>(null);

  // Auto-save bill draft to localStorage whenever cartItems or buyer details change
  useEffect(() => {
    const draftKey = shop ? `shopbill_active_draft_${shop.id}` : 'shopbill_active_draft';
    if (cartItems.length > 0 || (customerName && customerName !== 'Walk-in Customer') || customerPhone) {
      const draft = {
        cartItems,
        customerName,
        customerPhone,
        customerAddress,
        customerGstin,
        selectedCustomer,
        billingMode,
        paymentMethod,
        overallDiscountValue,
        overallDiscountType,
        billNotes,
        updatedAt: Date.now(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
      localStorage.setItem('shopbill_active_draft', JSON.stringify(draft));
    } else {
      localStorage.removeItem(draftKey);
      localStorage.removeItem('shopbill_active_draft');
    }
  }, [
    shop,
    cartItems,
    customerName,
    customerPhone,
    customerAddress,
    customerGstin,
    selectedCustomer,
    billingMode,
    paymentMethod,
    overallDiscountValue,
    overallDiscountType,
    billNotes,
  ]);

  // Restore draft when shop changes or mounts
  useEffect(() => {
    if (!shop) return;
    try {
      const key = `shopbill_active_draft_${shop.id}`;
      const saved = localStorage.getItem(key) || localStorage.getItem('shopbill_active_draft');
      if (saved) {
        const d = JSON.parse(saved);
        if (Array.isArray(d.cartItems) && d.cartItems.length > 0 && cartItems.length === 0) {
          setCartItems(d.cartItems);
          if (d.customerName && !customerName) setCustomerName(d.customerName);
          if (d.customerPhone && !customerPhone) setCustomerPhone(d.customerPhone);
          if (d.customerAddress && !customerAddress) setCustomerAddress(d.customerAddress);
          if (d.customerGstin && !customerGstin) setCustomerGstin(d.customerGstin);
          if (d.selectedCustomer && !selectedCustomer) setSelectedCustomer(d.selectedCustomer);
          if (d.billingMode) setBillingMode(d.billingMode);
          if (d.paymentMethod) setPaymentMethod(d.paymentMethod);
          if (d.overallDiscountValue) setOverallDiscountValue(d.overallDiscountValue);
          if (d.overallDiscountType) setOverallDiscountType(d.overallDiscountType);
          if (d.billNotes) setBillNotes(d.billNotes);
        }
      }
    } catch {}
  }, [shop]);

  // Load initial data and update local cache silently
  useEffect(() => {
    loadData();
  }, [shop]);

  const loadData = async () => {
    try {
      if (isOnline) {
        const [catRes, prodRes, custRes, setRes] = await Promise.all([
          categoryApi.list(),
          productApi.list({ all: true }),
          customerApi.list({ per_page: 100 }),
          settingsApi.get(),
        ]);
        const newCats = catRes.data || [];
        const newProds = prodRes.data || [];
        const newCusts = custRes.data?.data || custRes.data || [];

        setCategories(newCats);
        setProducts(newProds);
        setCustomers(newCusts);

        localStorage.setItem('shopbill_cached_categories', JSON.stringify(newCats));
        localStorage.setItem('shopbill_cached_products', JSON.stringify(newProds));
        localStorage.setItem('shopbill_cached_customers', JSON.stringify(newCusts));
        if (shop) {
          localStorage.setItem(`shopbill_categories_${shop.id}`, JSON.stringify(newCats));
          localStorage.setItem(`shopbill_products_${shop.id}`, JSON.stringify(newProds));
        }

        const invSettings = setRes.data?.invoice_settings || null;
        setInvoiceSettings(invSettings);
        if (invSettings?.custom_qr_url) {
          setQrSource('standee');
        } else {
          setQrSource('dynamic');
        }
      } else {
        setCategories(cachedCatalogue.categories || []);
        setProducts(cachedCatalogue.products || []);
        setCustomers(cachedCatalogue.customers || []);
        setInvoiceSettings(cachedCatalogue.invoice_setting || null);
        if (cachedCatalogue.invoice_setting?.custom_qr_url) {
          setQrSource('standee');
        } else {
          setQrSource('dynamic');
        }
      }
    } catch (err) {
      console.warn('Using cached data due to network error:', err);
      setCategories(cachedCatalogue.categories || []);
      setProducts(cachedCatalogue.products || []);
      setCustomers(cachedCatalogue.customers || []);
      setInvoiceSettings(cachedCatalogue.invoice_setting || null);
    }
  };

  // Filtered products for Catalogue-Based mode
  const filteredProducts = useMemo(() => {
    if (!products.length) return [];
    const term = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
      const matchSearch =
        term === '' ||
        p.name.toLowerCase().includes(term) ||
        (p.barcode && p.barcode.toLowerCase().includes(term));
      return matchCat && matchSearch && p.is_active;
    });
  }, [products, selectedCategory, searchTerm]);

  // Add product from catalogue
  const addCatalogueItem = useCallback((product: Product) => {
    const defaultPrice = Number(product.default_price);
    const gstRate = Number(product.gst_rate) || 0;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((it) => it.product_id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = updated[existingIndex].quantity + 1;
        const subtotal = newQty * updated[existingIndex].unit_price;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal,
          total_amount: subtotal,
        };
        return updated;
      } else {
        const subtotal = 1 * defaultPrice;
        const newItem: InvoiceItem = {
          product_id: product.id,
          item_name: product.name,
          category_name: product.category?.name || 'General',
          is_custom_item: false,
          unit: product.unit || 'pcs',
          quantity: 1,
          unit_price: defaultPrice,
          discount_type: 'fixed',
          discount_value: 0,
          discount_amount: 0,
          subtotal: subtotal,
          gst_rate: gstRate,
          hsn_code: product.hsn_code,
          total_amount: subtotal,
        };
        return [...prevItems, newItem];
      }
    });
  }, []);

  // Add custom manual item (Mode 2)
  const addCustomItem = () => {
    const price = parseFloat(customPrice);
    if (!customName.trim() || isNaN(price) || price <= 0 || customQty <= 0) {
      alert('Please enter a valid item name, quantity, and price.');
      return;
    }

    const subtotal = customQty * price;
    const newItem: InvoiceItem = {
      product_id: null,
      item_name: customName.trim(),
      category_name: customCategory,
      is_custom_item: true,
      save_to_catalogue: customSaveToCatalogue,
      unit: customUnit,
      quantity: customQty,
      unit_price: price,
      discount_type: 'fixed',
      discount_value: 0,
      discount_amount: 0,
      subtotal: subtotal,
      gst_rate: customGst,
      total_amount: subtotal,
    };

    setCartItems((prev) => [...prev, newItem]);

    // Reset inputs
    setCustomName('');
    setCustomPrice('');
    setCustomQty(1);
    setCustomSaveToCatalogue(false);
    customNameRef.current?.focus();
  };

  // Update quantity of an item
  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    setCartItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      item.quantity = newQty;
      const gross = newQty * item.unit_price;

      let disc = 0;
      if (item.discount_value && item.discount_value > 0) {
        disc = item.discount_type === 'percentage' ? (gross * item.discount_value) / 100 : item.discount_value;
      }
      disc = Math.min(disc, gross);
      item.discount_amount = disc;
      item.subtotal = gross - disc;
      item.total_amount = gross - disc;
      updated[index] = item;
      return updated;
    });
  };

  // Update unit price
  const updateUnitPrice = (index: number, newPrice: number) => {
    if (newPrice < 0) return;
    setCartItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      item.unit_price = newPrice;
      const gross = item.quantity * newPrice;

      let disc = 0;
      if (item.discount_value && item.discount_value > 0) {
        disc = item.discount_type === 'percentage' ? (gross * item.discount_value) / 100 : item.discount_value;
      }
      disc = Math.min(disc, gross);
      item.discount_amount = disc;
      item.subtotal = gross - disc;
      item.total_amount = gross - disc;
      updated[index] = item;
      return updated;
    });
  };

  // Update item discount
  const updateItemDiscount = (index: number, val: number, type: 'fixed' | 'percentage') => {
    setCartItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      item.discount_type = type;
      item.discount_value = Math.max(0, val);
      const gross = item.quantity * item.unit_price;

      let disc = type === 'percentage' ? (gross * val) / 100 : val;
      disc = Math.min(disc, gross);
      item.discount_amount = disc;
      item.subtotal = gross - disc;
      item.total_amount = gross - disc;
      updated[index] = item;
      return updated;
    });
  };

  // Remove item from cart
  const removeItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle URL mode and promptBuyer params (e.g. from Dashboard 1-click actions)
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'custom' || modeParam === 'catalogue') {
      setBillingMode(modeParam);
    }

    const cId = searchParams.get('customerId');
    const cName = searchParams.get('customerName');
    const cPhone = searchParams.get('customerPhone');

    if (cId && cName) {
      const custObj: Customer = {
        id: Number(cId),
        shop_id: shop?.id || 0,
        name: cName,
        phone: cPhone || '',
        credit_limit: 0,
        current_balance: 0,
        total_purchases: 0,
      };
      setSelectedCustomer(custObj);
      setCustomerName(cName);
      setCustomerPhone(cPhone || '');
      setShowBuyerModal(false);
    } else if (searchParams.get('promptBuyer') === 'true') {
      setShowBuyerModal(true);
      searchParams.delete('promptBuyer');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, shop]);

  // Save Buyer and proceed to add items
  const handleSaveBuyerAndAddItems = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!buyerInputName.trim()) {
      alert('Please enter Buyer Name');
      return;
    }

    const trimmedName = buyerInputName.trim();
    const trimmedPhone = buyerInputPhone.trim();
    const trimmedAddress = buyerInputAddress.trim();
    const trimmedGstin = buyerInputGstin.trim();

    try {
      setIsSavingBuyer(true);
      let createdCustomer: Customer | null = null;

      if (saveBuyerToDirectory && isOnline) {
        try {
          const res = await customerApi.create({
            name: trimmedName,
            phone: trimmedPhone || null,
            address: trimmedAddress || null,
            gstin: trimmedGstin || null,
            credit_limit: 5000,
          });
          createdCustomer = res.data.customer;
          setCustomers((prev) => [createdCustomer!, ...prev]);
        } catch (err) {
          console.error('Customer save to khata failed, continuing locally:', err);
        }
      }

      if (createdCustomer) {
        setSelectedCustomer(createdCustomer);
      } else {
        setSelectedCustomer({
          id: 0,
          shop_id: shop?.id || 0,
          name: trimmedName,
          phone: trimmedPhone,
          address: trimmedAddress,
          gstin: trimmedGstin,
          current_balance: 0,
          credit_limit: 5000,
          total_purchases: 0,
        });
      }

      setCustomerName(trimmedName);
      setCustomerPhone(trimmedPhone);
      setCustomerAddress(trimmedAddress);
      setCustomerGstin(trimmedGstin);
      setShowBuyerModal(false);

      // Focus on product search or custom item input so shopkeeper can immediately add items!
      setTimeout(() => {
        if (billingMode === 'catalogue') {
          searchInputRef.current?.focus();
        } else {
          customNameRef.current?.focus();
        }
      }, 100);
    } finally {
      setIsSavingBuyer(false);
    }
  };

  const handleSkipBuyerForWalkIn = () => {
    setSelectedCustomer(null);
    setCustomerName('Walk-in Customer');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerGstin('');
    setShowBuyerModal(false);

    // Focus on adding items immediately
    setTimeout(() => {
      if (billingMode === 'catalogue') {
        searchInputRef.current?.focus();
      } else {
        customNameRef.current?.focus();
      }
    }, 100);
  };

  // Clear bill
  const handleResetBill = () => {
    if (cartItems.length > 0 && !confirm('Clear current bill items?')) {
      return;
    }
    setCartItems([]);
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerGstin('');
    setOverallDiscountValue(0);
    setAmountReceived('');
    setBillNotes('');
    setShowQrModal(false);
    setPaymentStatus('idle');
    setAutoDetectSeconds(null);
    if (shop) {
      localStorage.removeItem(`shopbill_active_draft_${shop.id}`);
    }
    localStorage.removeItem('shopbill_active_draft');
  };

  // Calculations
  const calculations = useMemo(() => {
    let subtotal = 0;
    let itemDiscountTotal = 0;
    let totalTax = 0;
    let totalTaxable = 0;

    const isGst = shop?.is_gst_registered ?? false;

    cartItems.forEach((it) => {
      const gross = it.quantity * it.unit_price;
      const disc = it.discount_amount || 0;
      const net = gross - disc;

      subtotal += gross;
      itemDiscountTotal += disc;

      if (isGst && it.gst_rate > 0) {
        const taxable = net / (1 + it.gst_rate / 100);
        const tax = net - taxable;
        totalTaxable += taxable;
        totalTax += tax;
      } else {
        totalTaxable += net;
      }
    });

    // Overall discount
    const netBeforeOverall = subtotal - itemDiscountTotal;
    let overallDiscAmt = 0;
    if (overallDiscountValue > 0) {
      if (overallDiscountType === 'percentage') {
        overallDiscAmt = (netBeforeOverall * overallDiscountValue) / 100;
      } else {
        overallDiscAmt = overallDiscountValue;
      }
    }
    overallDiscAmt = Math.min(overallDiscAmt, netBeforeOverall);

    const totalDiscount = itemDiscountTotal + overallDiscAmt;
    const netPayableBeforeRound = Math.max(0, subtotal - totalDiscount);
    const finalAmount = Math.round(netPayableBeforeRound);
    const roundOff = Number((finalAmount - netPayableBeforeRound).toFixed(2));

    const rec = parseFloat(amountReceived);
    const validAmountReceived = isNaN(rec) ? finalAmount : rec;
    const balanceDue = Math.max(0, finalAmount - validAmountReceived);
    const changeDue = Math.max(0, validAmountReceived - finalAmount);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      itemDiscountTotal: Number(itemDiscountTotal.toFixed(2)),
      overallDiscountAmount: Number(overallDiscAmt.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      taxableAmount: Number(totalTaxable.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      roundOff,
      finalAmount,
      balanceDue: Number(balanceDue.toFixed(2)),
      changeDue: Number(changeDue.toFixed(2)),
    };
  }, [cartItems, overallDiscountType, overallDiscountValue, amountReceived, shop]);

  // Set default amount received to finalAmount when it changes
  useEffect(() => {
    if (paymentMethod !== 'credit' && calculations.finalAmount > 0) {
      setAmountReceived(calculations.finalAmount.toString());
    } else if (paymentMethod === 'credit') {
      setAmountReceived('0');
    }
  }, [calculations.finalAmount, paymentMethod]);

  // Generate in-memory Dynamic QR Code whenever amount, UPI ID, or shop changes
  const upiId = invoiceSettings?.upi_id || 'shopkeeper@upi';
  const shopName = shop?.name || 'Retail Store';
  const hasCustomStandeeQr = Boolean(invoiceSettings?.custom_qr_url);

  useEffect(() => {
    if (calculations.finalAmount <= 0) {
      setQrDataUrl('');
      setPaymentStatus('idle');
      return;
    }

    if (paymentMethod === 'upi') {
      setPaymentStatus('waiting');
    }

    const upiPayUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName)}&am=${calculations.finalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Bill Payment')}`;

    QRCode.toDataURL(upiPayUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate local QR code:', err);
      });
  }, [calculations.finalAmount, upiId, shopName, paymentMethod]);

  // Generate Bill Function
  const handleGenerateBill = async () => {
    if (cartItems.length === 0) {
      alert('Cannot generate an empty bill. Please add items first.');
      return;
    }

    setIsSubmitting(true);
    setPaymentStatus('generating');

    const payload = {
      billing_mode: billingMode,
      invoice_type: shop?.is_gst_registered ? 'gst' : 'retail',
      customer_id: selectedCustomer?.id && selectedCustomer.id > 0 ? selectedCustomer.id : null,
      customer_name: customerName || 'Walk-in Customer',
      customer_phone: customerPhone || null,
      customer_address: customerAddress || null,
      customer_gstin: customerGstin || selectedCustomer?.gstin || null,
      overall_discount_type: overallDiscountType,
      overall_discount_value: overallDiscountValue,
      payment_method: paymentMethod,
      amount_paid: paymentMethod === 'credit' ? 0 : parseFloat(amountReceived) || calculations.finalAmount,
      notes: billNotes || null,
      items: cartItems.map((it) => ({
        product_id: it.product_id,
        item_name: it.item_name,
        category_name: it.category_name,
        is_custom_item: it.is_custom_item,
        save_to_catalogue: it.save_to_catalogue,
        unit: it.unit,
        quantity: it.quantity,
        unit_price: it.unit_price,
        discount_type: it.discount_type,
        discount_value: it.discount_value,
        gst_rate: it.gst_rate,
        hsn_code: it.hsn_code,
      })),
    };

    try {
      let createdBill;
      if (isOnline) {
        const res = await invoiceApi.create(payload);
        createdBill = res.data.invoice;
      } else {
        createdBill = await saveOfflineInvoice({
          ...payload,
          subtotal: calculations.subtotal,
          item_discount_total: calculations.itemDiscountTotal,
          overall_discount_amount: calculations.overallDiscountAmount,
          total_discount: calculations.totalDiscount,
          taxable_amount: calculations.taxableAmount,
          total_tax: calculations.totalTax,
          round_off: calculations.roundOff,
          final_amount: calculations.finalAmount,
        });
      }

      setCompletedInvoice({
        ...createdBill,
        customer_name: customerName || createdBill.customer_name || 'Walk-in Customer',
        customer_phone: customerPhone || createdBill.customer_phone,
        customer_address: customerAddress || createdBill.customer_address,
        customer_gstin: customerGstin || createdBill.customer_gstin,
      });

      // Reset cart for next bill
      setCartItems([]);
      setSelectedCustomer(null);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerGstin('');
      setOverallDiscountValue(0);
      setAmountReceived('');
      setBillNotes('');
      setShowQrModal(false);
      setPaymentStatus('idle');
      setAutoDetectSeconds(null);
      if (shop) {
        localStorage.removeItem(`shopbill_active_draft_${shop.id}`);
      }
      localStorage.removeItem('shopbill_active_draft');
    } catch (err: any) {
      console.error('Invoice creation failed:', err);
      alert(err.response?.data?.message || 'Failed to generate invoice. Please check fields.');
      setPaymentStatus('waiting');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Automatically Complete Payment & Auto-Generate Bill
  const completePaymentAndAutoGenerate = () => {
    if (cartItems.length === 0 || isSubmitting) return;

    // 1. Play realistic UPI soundbox chime
    playUpiPaymentChime();

    // 2. Set paid status visually
    setPaymentStatus('paid');
    setShowQrModal(false);

    // 3. Auto-generate bill after a brief 400ms visual confirmation
    setTimeout(() => {
      handleGenerateBill();
    }, 400);
  };

  // Auto-Detect Countdown Timer (Simulates POS / Soundbox webhook confirmation)
  useEffect(() => {
    let timer: any;
    if (autoDetectSeconds !== null && autoDetectSeconds > 0) {
      timer = setTimeout(() => {
        setAutoDetectSeconds(autoDetectSeconds - 1);
      }, 1000);
    } else if (autoDetectSeconds === 0) {
      setAutoDetectSeconds(null);
      completePaymentAndAutoGenerate();
    }
    return () => clearTimeout(timer);
  }, [autoDetectSeconds]);

  const startAutoDetect = (seconds = 4) => {
    setAutoDetectSeconds(seconds);
  };

  // Keyboard shortcut: Ctrl+Enter to generate bill
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (cartItems.length > 0 && !isSubmitting) {
          handleGenerateBill();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, isSubmitting, calculations, paymentMethod, amountReceived]);

  const currency = shop?.currency_symbol || '₹';

  // Active QR image source depending on toggle & availability
  const activeQrImage =
    qrSource === 'standee' && invoiceSettings?.custom_qr_url
      ? invoiceSettings.custom_qr_url
      : qrDataUrl;

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans select-none">
      {/* Top Header Bar: Mode Switcher & Quick Customer Input */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        {/* Billing Mode Switch */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setBillingMode('catalogue');
                setMobileTab('items');
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                billingMode === 'catalogue'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>1. Catalogue</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBillingMode('custom');
                setMobileTab('items');
                setTimeout(() => customNameRef.current?.focus(), 50);
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                billingMode === 'custom'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>2. Manual Price</span>
            </button>
          </div>

          {/* Mobile Tab Toggle for screens < md */}
          <div className="flex md:hidden items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setMobileTab('items')}
              className={`px-2 py-1 rounded-md ${mobileTab === 'items' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs' : 'text-slate-500'}`}
            >
              Catalogue
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('cart')}
              className={`px-2 py-1 rounded-md ${mobileTab === 'cart' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs' : 'text-slate-500'}`}
            >
              Bill ({cartItems.length})
            </button>
          </div>
        </div>

        {/* Buyer Details & Reset Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Phone Lookup Button */}
          <button
            type="button"
            onClick={() => setShowPhoneLookupModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-500/60 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-colors shrink-0"
            title="Check customer history, total purchases, and udhaar by mobile number"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Khata Lookup</span>
          </button>

          {/* Quick Sales Return Button */}
          <button
            type="button"
            onClick={() => setShowSalesReturnModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/60 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-bold text-xs transition-colors shrink-0"
            title="Process item return / refund from previous bill"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Sales Return</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBuyerInputName(customerName === 'Walk-in Customer' ? '' : customerName);
              setBuyerInputPhone(customerPhone);
              setBuyerInputAddress(customerAddress);
              setBuyerInputGstin(customerGstin);
              setShowBuyerModal(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer transition-all max-w-[280px] sm:max-w-xs text-left"
            title="Click to edit Buyer Name, Phone, and Address"
          >
            <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div className="truncate text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {customerName ? customerName : 'Buyer: Walk-in'}
              </span>
              {customerPhone && (
                <span className="text-slate-400 font-mono ml-1.5 text-[11px]">
                  ({customerPhone})
                </span>
              )}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
              {customerName && customerName !== 'Walk-in Customer' ? 'Edit' : '+ Buyer'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleResetBill}
            title="Reset Bill"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Product Selector */}
        <div
          className={`${
            mobileTab === 'cart' ? 'hidden md:flex' : 'flex'
          } w-full md:w-[320px] lg:w-[360px] xl:w-[400px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col shrink-0`}
        >
          {billingMode === 'catalogue' ? (
            /* Mode 1: Fast Catalogue Search & Category Chips */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search Bar */}
              <div className="p-2.5 sm:p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-slate-900 text-white dark:bg-emerald-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    All ({products.length})
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategory(c.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
                        selectedCategory === c.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredProducts.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-center p-4">
                    <Package className="w-8 h-8 mb-2 stroke-1" />
                    <p className="text-xs font-medium">No items found</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Switch to "Manual Price" to bill any item.
                    </p>
                  </div>
                ) : (
                  filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addCatalogueItem(p)}
                      className="w-full text-left p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 hover:border-emerald-400 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors flex items-center justify-between group"
                    >
                      <div className="truncate pr-2">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {p.category?.name || 'General'} • {p.unit}
                          {Number(p.gst_rate) > 0 && ` • ${p.gst_rate}% GST`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                          {currency}{p.default_price}
                        </span>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          + Add
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Mode 2: Minimalist Custom / Personal Price Entry */
            <div className="flex-1 flex flex-col p-3 sm:p-4 overflow-y-auto">
              <div className="mb-3">
                <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4" />
                  Mode 2: Enter Any Price
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Direct item entry. Does not alter your saved catalogue.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Item Description / Name *
                  </label>
                  <input
                    ref={customNameRef}
                    type="text"
                    placeholder="e.g. Loose Sugar, Cut Wire, Tailoring"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Price ({currency}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      value={customQty}
                      onChange={(e) => setCustomQty(parseFloat(e.target.value) || 1)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Unit
                    </label>
                    <select
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="g">Gram (g)</option>
                      <option value="L">Litre (L)</option>
                      <option value="ml">Millilitre (ml)</option>
                      <option value="m">Metre (m)</option>
                      <option value="pkt">Packet (pkt)</option>
                      <option value="box">Box (box)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="General">General</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {shop?.is_gst_registered && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      GST Rate (%)
                    </label>
                    <select
                      value={customGst}
                      onChange={(e) => setCustomGst(parseFloat(e.target.value))}
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                    >
                      <option value={0}>0% (Tax Exempt / Nil)</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                )}

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={customSaveToCatalogue}
                      onChange={(e) => setCustomSaveToCatalogue(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Save to catalogue for future bills</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={addCustomItem}
                  className="w-full py-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item to Bill</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Bill Items, QR Preview, Totals & Checkout */}
        <div
          className={`${
            mobileTab === 'items' ? 'hidden md:flex' : 'flex'
          } flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 overflow-hidden`}
        >
          {/* Active Bill Table */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3">
            {cartItems.length > 0 && (
              <div className="mb-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-emerald-900 dark:text-emerald-200">
                    Draft Bill: {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} saved
                  </span>
                  <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400 hidden sm:inline">
                    • Safely preserved across tab switches & page reloads
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetBill}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline px-2 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Clear Bill
                </button>
              </div>
            )}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Buyer / Customer Info Strip */}
              <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {customerName && customerName !== 'Walk-in Customer' ? customerName.charAt(0).toUpperCase() : 'W'}
                  </div>
                  <div className="truncate">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100">
                      {customerName || 'Walk-in / Cash Customer'}
                    </span>
                    {customerPhone && (
                      <span className="text-slate-500 font-mono ml-2 text-[11px]">📞 {customerPhone}</span>
                    )}
                    {customerAddress && (
                      <span className="text-slate-400 font-normal ml-2 text-[11px] truncate hidden md:inline">
                        📍 {customerAddress}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBuyerInputName(customerName === 'Walk-in Customer' ? '' : customerName);
                    setBuyerInputPhone(customerPhone);
                    setBuyerInputAddress(customerAddress);
                    setBuyerInputGstin(customerGstin);
                    setShowBuyerModal(true);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{customerName && customerName !== 'Walk-in Customer' ? 'Edit Buyer' : '+ Buyer Details'}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500">
                      <th className="py-2 px-3 w-8">#</th>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3 text-center w-16">Unit</th>
                      <th className="py-2 px-3 text-right w-24">Price ({currency})</th>
                      <th className="py-2 px-3 text-center w-28">Qty</th>
                      <th className="py-2 px-3 text-center w-20">Disc</th>
                      <th className="py-2 px-3 text-right w-24">Total ({currency})</th>
                      <th className="py-2 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                    {cartItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Receipt className="w-8 h-8 mx-auto mb-1 text-slate-300 dark:text-slate-700 stroke-1" />
                          <p className="font-semibold text-xs">Bill is empty</p>
                          <p className="text-[11px] text-slate-400">
                            Click items on the left to add them immediately.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      cartItems.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px]">
                              {item.item_name}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              {item.is_custom_item && (
                                <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 rounded border border-amber-200 dark:border-amber-800 text-[9px] font-bold">
                                  Manual
                                </span>
                              )}
                              <span>{item.category_name}</span>
                              {Number(item.gst_rate) > 0 && <span>• {item.gst_rate}% GST</span>}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center text-slate-500 font-mono text-xs">{item.unit}</td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateUnitPrice(idx, parseFloat(e.target.value) || 0)}
                              className="w-16 px-1 py-0.5 text-right text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800">
                              <button
                                type="button"
                                onClick={() => updateQuantity(idx, Math.max(1, item.quantity - 1))}
                                className="px-1.5 py-0.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                step="any"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(idx, parseFloat(e.target.value) || 1)}
                                className="w-10 text-center text-xs font-mono bg-transparent focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => updateQuantity(idx, item.quantity + 1)}
                                className="px-1.5 py-0.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              placeholder="0"
                              value={item.discount_value || ''}
                              onChange={(e) =>
                                updateItemDiscount(idx, parseFloat(e.target.value) || 0, item.discount_type || 'fixed')
                              }
                              className="w-12 px-1 py-0.5 text-center text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-bold font-mono text-slate-900 dark:text-white">
                            {currency}{item.subtotal.toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Checkout Footer & Payment Bar */}
          <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 shadow-md shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {/* Column 1: Payment Mode & Dynamic/Standee QR Code Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Payment Method:
                  </span>
                  {paymentMethod === 'upi' && calculations.finalAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Large QR</span>
                    </button>
                  )}
                </div>

                {/* 5 Payment Methods in Clean Row */}
                <div className="grid grid-cols-5 gap-1">
                  {(
                    [
                      { id: 'cash', label: 'Cash' },
                      { id: 'upi', label: 'UPI / QR' },
                      { id: 'card', label: 'Card' },
                      { id: 'bank_transfer', label: 'Bank' },
                      { id: 'credit', label: 'Udhaar' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center truncate ${
                        paymentMethod === m.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Inline Instant QR Card when UPI is Selected (Supports Uploaded Standee & Dynamic Amount QR) */}
                {paymentMethod === 'upi' && (
                  <div className="p-2 bg-emerald-50/90 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex flex-col gap-1.5 animate-in fade-in duration-150">
                    {/* Header with Standee vs Dynamic Toggle if custom QR is uploaded */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                        <QrCode className="w-3 h-3" />
                        <span>
                          {qrSource === 'standee' && invoiceSettings?.custom_qr_url
                            ? 'Shop Standee QR'
                            : 'Dynamic Amount QR'}
                        </span>
                      </div>

                      {hasCustomStandeeQr && (
                        <div className="flex items-center bg-white dark:bg-slate-900 rounded p-0.5 border border-emerald-200 text-[9px] font-bold">
                          <button
                            type="button"
                            onClick={() => setQrSource('standee')}
                            className={`px-1.5 py-0.5 rounded ${
                              qrSource === 'standee'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            Standee
                          </button>
                          <button
                            type="button"
                            onClick={() => setQrSource('dynamic')}
                            className={`px-1.5 py-0.5 rounded ${
                              qrSource === 'dynamic'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            Amount
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      {activeQrImage ? (
                        <img
                          src={activeQrImage}
                          alt="UPI QR Code"
                          className="w-16 h-16 bg-white p-0.5 rounded-lg border border-emerald-200 shadow-xs shrink-0 cursor-pointer hover:scale-105 transition-transform object-contain"
                          onClick={() => setShowQrModal(true)}
                          title="Click to view large QR Code"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                          <QrCode className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white font-mono leading-tight">
                          {currency}{calculations.finalAmount}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5">
                          {upiId}
                        </p>
                        <p className="text-[9px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                          Scan with PhonePe, GPay, Paytm
                        </p>
                      </div>
                    </div>

                    {/* Auto-Generate Trigger Action Bar */}
                    <div className="pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={completePaymentAndAutoGenerate}
                        disabled={cartItems.length === 0 || isSubmitting || paymentStatus === 'paid'}
                        className="flex-1 py-1.5 px-2 rounded-lg text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-xs flex items-center justify-center gap-1 transition-all"
                        title="Simulates payment confirmation and automatically generates bill"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                        <span>
                          {paymentStatus === 'paid'
                            ? 'Paid! Generating...'
                            : 'Payment Received (Auto-Bill)'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => startAutoDetect(4)}
                        disabled={autoDetectSeconds !== null || isSubmitting}
                        className="py-1.5 px-2 rounded-lg text-[10px] font-bold border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 transition-colors shrink-0"
                      >
                        {autoDetectSeconds !== null ? `${autoDetectSeconds}s...` : 'Auto (4s)'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Cash Received & Change */}
                {paymentMethod === 'cash' && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase">
                        Cash Received
                      </label>
                      <input
                        type="number"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                    {calculations.changeDue > 0 && (
                      <div className="text-right">
                        <span className="block text-[10px] font-semibold text-slate-500 uppercase">
                          Change Due
                        </span>
                        <span className="text-sm font-black text-emerald-600 font-mono">
                          {currency}{calculations.changeDue}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Column 2: Discounts & Bill Remarks */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Bill Discount:
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setOverallDiscountType('fixed')}
                      className={`px-2 py-0.5 rounded ${
                        overallDiscountType === 'fixed'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Flat {currency}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverallDiscountType('percentage')}
                      className={`px-2 py-0.5 rounded ${
                        overallDiscountType === 'percentage'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      % Off
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Discount value"
                    value={overallDiscountValue || ''}
                    onChange={(e) => setOverallDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                  {overallDiscountValue > 0 && (
                    <span className="text-xs font-bold text-emerald-600 shrink-0 font-mono">
                      -{currency}{calculations.overallDiscountAmount}
                    </span>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Bill remarks / notes..."
                    value={billNotes}
                    onChange={(e) => setBillNotes(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Column 3: Grand Total & Generate Action */}
              <div className="flex flex-col justify-between space-y-1.5 md:col-span-2 xl:col-span-1 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-mono">{currency}{calculations.subtotal}</span>
                  </div>
                  {calculations.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Total Discounts:</span>
                      <span className="font-mono">-{currency}{calculations.totalDiscount}</span>
                    </div>
                  )}
                  {shop?.is_gst_registered && calculations.totalTax > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>GST Tax:</span>
                      <span className="font-mono">{currency}{calculations.totalTax}</span>
                    </div>
                  )}
                  {calculations.roundOff !== 0 && (
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Round Off:</span>
                      <span className="font-mono">{currency}{calculations.roundOff}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">
                      Payable:
                    </span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {currency}{calculations.finalAmount}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={cartItems.length === 0 || isSubmitting}
                  onClick={handleGenerateBill}
                  className="w-full py-2.5 rounded-lg text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isSubmitting ? 'Generating...' : 'Generate Bill (Ctrl+Enter)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Dynamic / Standee QR Code Modal with Auto-Generate Payment */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-5 sm:p-6 text-center border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                <QrCode className="w-4 h-4" />
                <span>
                  {qrSource === 'standee' && invoiceSettings?.custom_qr_url
                    ? 'Shop Standee QR'
                    : 'UPI Payment QR'}
                </span>
              </span>

              {hasCustomStandeeQr && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs font-bold border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setQrSource('standee')}
                    className={`px-2 py-0.5 rounded-md ${
                      qrSource === 'standee' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Standee
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrSource('dynamic')}
                    className={`px-2 py-0.5 rounded-md ${
                      qrSource === 'dynamic' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Dynamic
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-0.5">{shopName}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white font-mono mb-3">
              {currency}{calculations.finalAmount}
            </h3>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-inner inline-block mb-3">
              {activeQrImage ? (
                <img
                  src={activeQrImage}
                  alt="UPI QR Code"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                />
              ) : (
                <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            <p className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
              {upiId}
            </p>
            <p className="text-[11px] text-slate-400 mb-3">
              Scan with GPay, PhonePe, Paytm or any UPI app
            </p>

            {/* Auto-Generate on Payment Completed */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={completePaymentAndAutoGenerate}
                disabled={cartItems.length === 0 || isSubmitting}
                className="w-full py-2.5 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <Zap className="w-4 h-4 fill-current text-amber-300" />
                <span>Payment Complete (Auto-Generate Bill)</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startAutoDetect(4)}
                  disabled={autoDetectSeconds !== null || isSubmitting}
                  className="flex-1 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {autoDetectSeconds !== null ? `Auto in ${autoDetectSeconds}s...` : '⚡ Auto-Detect (4s)'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="py-1.5 px-4 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buyer Details Prompt Modal (Asks Name, Phone, Address before/during adding items) */}
      {showBuyerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Buyer / Customer Details
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Enter details for Tax Invoice BILL TO section
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBuyerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBuyerAndAddItems} className="p-4 space-y-3.5">
              {/* Existing Customer Quick Select */}
              {customers.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Or Select Existing Customer
                  </label>
                  <select
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      if (id) {
                        const found = customers.find((c) => c.id === id);
                        if (found) {
                          setBuyerInputName(found.name);
                          setBuyerInputPhone(found.phone || '');
                          setBuyerInputAddress(found.address || '');
                          setBuyerInputGstin(found.gstin || '');
                        }
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">-- Choose from saved customers --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''} {c.address ? `- ${c.address}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Name of Buyer <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Sampath Singh / Rajesh Kumar"
                    value={buyerInputName}
                    onChange={(e) => setBuyerInputName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    placeholder="e.g. +91 9981028177"
                    value={buyerInputPhone}
                    onChange={(e) => setBuyerInputPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. 04, KK Buildings, Ajmeri Gate, Jodhpur"
                    value={buyerInputAddress}
                    onChange={(e) => setBuyerInputAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Optional GSTIN */}
              {shop?.is_gst_registered && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    GSTIN / PAN (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 08HULMP2839A1AB"
                    value={buyerInputGstin}
                    onChange={(e) => setBuyerInputGstin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Save to Directory */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 pt-1">
                <input
                  type="checkbox"
                  checked={saveBuyerToDirectory}
                  onChange={(e) => setSaveBuyerToDirectory(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Save to Customer Directory / Khata for future bills</span>
              </label>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleSkipBuyerForWalkIn}
                  className="flex-1 py-2 px-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Skip (Walk-in Cash)
                </button>
                <button
                  type="submit"
                  disabled={isSavingBuyer}
                  className="flex-1 py-2.5 px-4 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSavingBuyer ? 'Saving...' : 'Set Buyer & Add Items'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completed Bill Print Modal (Clean, No Payment QR, Highly Responsive) */}
      {completedInvoice && (
        <PrintInvoiceModal
          invoice={completedInvoice}
          shop={shop}
          settings={invoiceSettings}
          onClose={() => setCompletedInvoice(null)}
        />
      )}

      {/* Customer Mobile Lookup & Khata Modal */}
      {showPhoneLookupModal && (
        <CustomerLookupModal
          isOpen={showPhoneLookupModal}
          onClose={() => setShowPhoneLookupModal(false)}
          targetMode={billingMode}
          onSelectCustomer={(cust) => {
            setSelectedCustomer(cust);
            setCustomerName(cust.name);
            setCustomerPhone(cust.phone || '');
            setCustomerAddress(cust.address || '');
            setCustomerGstin(cust.gstin || '');
          }}
          onOpenReturns={() => {
            setShowSalesReturnModal(true);
          }}
        />
      )}

      {/* Sales Return Modal */}
      {showSalesReturnModal && (
        <SalesReturnModal
          isOpen={showSalesReturnModal}
          onClose={() => setShowSalesReturnModal(false)}
        />
      )}
    </div>
  );
};
