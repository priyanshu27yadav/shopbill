import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  FileText,
  Users,
  Shield,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  QrCode,
  Upload,
  Sparkles,
  Lock,
  Image as ImageIcon,
} from 'lucide-react';
import { settingsApi, shopApi } from '../../api';
import { Shop, InvoiceSetting } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const SettingsScreen: React.FC = () => {
  const { shop, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'shop' | 'payment_qr' | 'invoice' | 'staff' | 'security'>('shop');

  // Shop Profile Form
  const [shopForm, setShopForm] = useState({
    name: '',
    business_type: 'grocery',
    tagline: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    gstin: '',
    is_gst_registered: false,
    currency_symbol: '₹',
  });

  // Invoice & Payment Settings Form
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_prefix: 'SB-',
    next_invoice_number: 1,
    template: 'thermal_80mm',
    show_gst: false,
    show_hsn: false,
    show_shop_logo: true,
    terms_and_conditions: '',
    footer_message: '',
    show_upi_qr: true,
    upi_id: '',
    custom_qr_url: '',
  });

  // Staff list
  const [staffList, setStaffList] = useState<any[]>([]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'cashier',
    can_give_discount: true,
    can_view_reports: false,
    can_manage_items: false,
    can_cancel_bills: false,
  });

  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Password Change Form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    loadSettings();
    loadStaff();
  }, [shop]);

  const loadSettings = async () => {
    try {
      const res = await settingsApi.get();
      const s = res.data.shop;
      const inv = res.data.invoice_settings;

      setShopForm({
        name: s.name || '',
        business_type: s.business_type || 'grocery',
        tagline: s.tagline || '',
        address_line1: s.address_line1 || '',
        address_line2: s.address_line2 || '',
        city: s.city || '',
        state: s.state || '',
        pincode: s.pincode || '',
        phone: s.phone || '',
        email: s.email || '',
        gstin: s.gstin || '',
        is_gst_registered: Boolean(s.is_gst_registered),
        currency_symbol: s.currency_symbol || '₹',
      });

      if (inv) {
        setInvoiceForm({
          invoice_prefix: inv.invoice_prefix || 'SB-',
          next_invoice_number: inv.next_invoice_number || 1,
          template: inv.template || 'thermal_80mm',
          show_gst: Boolean(inv.show_gst),
          show_hsn: Boolean(inv.show_hsn),
          show_shop_logo: Boolean(inv.show_shop_logo),
          terms_and_conditions: inv.terms_and_conditions || '',
          footer_message: inv.footer_message || '',
          show_upi_qr: Boolean(inv.show_upi_qr),
          upi_id: inv.upi_id || '',
          custom_qr_url: inv.custom_qr_url || '',
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadStaff = async () => {
    try {
      const res = await shopApi.listStaff();
      setStaffList(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage('');
    try {
      await shopApi.updateProfile(shopForm);
      await refreshProfile();
      setStatusMessage('Shop profile updated successfully.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating shop profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInvoice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setStatusMessage('');
    try {
      await settingsApi.updateInvoiceSettings(invoiceForm);
      setStatusMessage('Settings saved successfully.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingQr(true);
      setStatusMessage('');
      try {
        const res = await settingsApi.uploadQrImage(file);
        setInvoiceForm((prev) => ({ ...prev, custom_qr_url: res.data.custom_qr_url }));
        setStatusMessage('Shop QR code image uploaded successfully!');
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to upload QR code image.');
      } finally {
        setUploadingQr(false);
      }
    }
  };

  const handleRemoveQr = async () => {
    if (!confirm('Remove your custom uploaded QR code?')) return;
    try {
      setSaving(true);
      const updated = { ...invoiceForm, custom_qr_url: '' };
      await settingsApi.updateInvoiceSettings(updated);
      setInvoiceForm(updated);
      setStatusMessage('Custom QR code removed. ShopBill will generate dynamic QR codes.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove custom QR.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await shopApi.addStaff(newStaff);
      setShowAddStaffModal(false);
      setNewStaff({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'cashier',
        can_give_discount: true,
        can_view_reports: false,
        can_manage_items: false,
        can_cancel_bills: false,
      });
      loadStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add staff member.');
    }
  };

  const handleRemoveStaff = async (id: number) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await shopApi.removeStaff(id);
      loadStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove staff.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const res = await settingsApi.changePassword(passwordForm);
      setPasswordSuccess(res.data.message || 'Password updated successfully!');
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.message ||
        err.response?.data?.errors?.current_password?.[0] ||
        err.response?.data?.errors?.new_password?.[0] ||
        'Failed to change password. Please check your current password.'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 font-sans">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          <span>Shop Settings & Configuration</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure shop details, UPI payment QR standees, thermal invoice formats, and staff roles.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'shop'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Shop Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('payment_qr')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'payment_qr'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Payment & UPI QR Upload</span>
        </button>

        <button
          onClick={() => setActiveTab('invoice')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'invoice'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Invoice & Receipt Format</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'staff'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff & Cashiers</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Change Password (सुरक्षा एवं पासवर्ड)</span>
        </button>
      </div>

      {/* Tab 1: Shop Profile */}
      {activeTab === 'shop' && (
        <form onSubmit={handleSaveShop} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
            Shopkeeper & Store Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shop Name *
              </label>
              <input
                type="text"
                required
                value={shopForm.name}
                onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business Type
              </label>
              <select
                value={shopForm.business_type}
                onChange={(e) => setShopForm({ ...shopForm, business_type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white capitalize"
              >
                <option value="grocery">Grocery & Supermarket</option>
                <option value="electronics">Electronics & Mobile Accessories</option>
                <option value="clothing">Clothing & Garments</option>
                <option value="footwear">Footwear Store</option>
                <option value="hardware">Hardware & Electricals</option>
                <option value="cosmetics">Cosmetics & Beauty</option>
                <option value="stationery">Stationery & Book Store</option>
                <option value="general">General Retail Store</option>
                <option value="other">Other Business</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Shop Tagline / Slogan
            </label>
            <input
              type="text"
              value={shopForm.tagline}
              onChange={(e) => setShopForm({ ...shopForm, tagline: e.target.value })}
              placeholder="e.g. Best quality goods at honest prices"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shop Phone Number
              </label>
              <input
                type="text"
                value={shopForm.phone}
                onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shop Email Address
              </label>
              <input
                type="email"
                value={shopForm.email}
                onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Address
              </label>
              <input
                type="text"
                value={shopForm.address_line1}
                onChange={(e) => setShopForm({ ...shopForm, address_line1: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City / State
              </label>
              <input
                type="text"
                value={shopForm.city}
                onChange={(e) => setShopForm({ ...shopForm, city: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <input
                type="checkbox"
                checked={shopForm.is_gst_registered}
                onChange={(e) => setShopForm({ ...shopForm, is_gst_registered: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Shop is registered under GST (Goods & Services Tax)</span>
            </label>

            {shopForm.is_gst_registered && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GSTIN (15-Digit GST Identification Number) *
                </label>
                <input
                  type="text"
                  required={shopForm.is_gst_registered}
                  placeholder="e.g. 29AABCU9603R1Z7"
                  value={shopForm.gstin}
                  onChange={(e) => setShopForm({ ...shopForm, gstin: e.target.value.toUpperCase() })}
                  className="w-full sm:w-80 px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Shop Profile'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Payment & UPI QR Upload (Custom Shop Standee QR) */}
      {activeTab === 'payment_qr' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              <span>Shopkeeper UPI Payment & Standee QR Settings</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload your shop's official payment QR code (Paytm, PhonePe, Google Pay, BharatPe, or Bank standee). Customers will scan this at checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Column: Upload Standee QR */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                1. Upload Your Own Counter Standee QR Code
              </label>

              {invoiceForm.custom_qr_url ? (
                <div className="p-4 border-2 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl text-center space-y-3">
                  <div className="relative inline-block bg-white p-2 rounded-xl shadow-xs border border-slate-200">
                    <img
                      src={invoiceForm.custom_qr_url}
                      alt="Shop Standee QR"
                      className="w-48 h-48 object-contain mx-auto rounded-lg"
                    />
                    <span className="absolute -top-2 -right-2 bg-emerald-600 text-white p-1 rounded-full shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-full">
                      ✓ Active on Billing Counter
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      This QR code is shown to customers when they select UPI / QR.
                    </p>
                  </div>

                  <div className="flex justify-center gap-2 pt-1">
                    <label className="cursor-pointer py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors">
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveQr}
                      className="py-1.5 px-3 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition-colors"
                    >
                      Remove QR
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                  <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-2 stroke-1" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Upload your UPI Standee QR Code
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 mb-4 max-w-xs mx-auto">
                    Take a photo of your counter QR standee or upload your QR image (Paytm, PhonePe, GPay, BharatPe)
                  </p>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingQr ? 'Uploading QR...' : 'Choose QR Image Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      disabled={uploadingQr}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Right Column: UPI ID & Guidance */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  2. Shop UPI ID (VPA) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. yourshop@okhdfcbank or 9820012345@upi"
                  value={invoiceForm.upi_id}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, upi_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Used for dynamic amount QR generation and payment requests.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  How Payments Work in ShopBill
                </h4>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 leading-relaxed">
                  <p>
                    • <strong>Custom Standee QR:</strong> When you upload your QR photo, ShopBill displays your counter standee so customers scan your familiar branded QR code.
                  </p>
                  <p>
                    • <strong>Dynamic Amount QR:</strong> You can also toggle to Dynamic Amount QR at any time, which automatically encodes the exact bill amount (e.g. ₹247.00).
                  </p>
                  <p>
                    • <strong>Automatic Bill Generation:</strong> When the customer pays, clicking "Payment Received" plays an authentic UPI soundbox chime and auto-generates the bill immediately!
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveInvoice()}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Payment & QR Settings'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Invoice & Receipt Format */}
      {activeTab === 'invoice' && (
        <form onSubmit={handleSaveInvoice} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
            Invoice Printing & Template Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Invoice Number Prefix
              </label>
              <input
                type="text"
                value={invoiceForm.invoice_prefix}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_prefix: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Next Invoice Number
              </label>
              <input
                type="number"
                value={invoiceForm.next_invoice_number}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, next_invoice_number: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Printer Format
              </label>
              <select
                value={invoiceForm.template}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, template: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
              >
                <option value="thermal_80mm">80mm Thermal Receipt (Standard POS)</option>
                <option value="thermal_58mm">58mm Compact Thermal (Small POS)</option>
                <option value="modern_a4">Standard A4 Full Page Invoice</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bill Footer Message
            </label>
            <input
              type="text"
              value={invoiceForm.footer_message}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, footer_message: e.target.value })}
              placeholder="Thank you for your visit! Please come again."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Terms & Conditions
            </label>
            <textarea
              rows={3}
              value={invoiceForm.terms_and_conditions}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, terms_and_conditions: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Invoice Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Staff & Cashiers */}
      {activeTab === 'staff' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Staff & Cashier Accounts
              </h3>
              <p className="text-xs text-slate-400">
                Create cashier accounts with granular permissions (discounts, canceling bills, reports).
              </p>
            </div>
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {staffList.map((member) => (
              <div key={member.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {member.user?.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {member.user?.email} • Role: <span className="capitalize font-semibold text-emerald-600">{member.role}</span>
                  </p>
                </div>
                {member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveStaff(member.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Security & Change Password */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 max-w-xl">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Change Password (सुरक्षा एवं पासवर्ड बदलें)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Update your account password to keep your shop data and billing ledger secure.
            </p>
          </div>

          {passwordError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Password (वर्तमान पासवर्ड) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password (नया पासवर्ड) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password (पासवर्ड दोबारा लिखें) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordForm.new_password_confirmation}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{passwordLoading ? 'Updating Password...' : 'Save New Password (पासवर्ड बदलें)'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">
              Add New Cashier / Staff Member
            </h3>
            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="flex-1 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white shadow-xs"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
