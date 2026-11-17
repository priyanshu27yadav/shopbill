import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  X,
  ArrowRight,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  HelpCircle,
  Sparkles,
  QrCode,
  Zap,
  Clock,
  ChevronRight,
  Smartphone,
  Wallet,
  Landmark,
  FileCheck2,
} from 'lucide-react';
import { paymentSettingsApi } from '../../api';
import { ShopPaymentAccount, PaymentSettingsResponse } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const PaymentSettingsScreen: React.FC = () => {
  const { shop } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<PaymentSettingsResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [showOnboardModal, setShowOnboardModal] = useState<boolean>(false);
  const [showTestOrderModal, setShowTestOrderModal] = useState<boolean>(false);
  const [testOrderData, setTestOrderData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Connect Existing Account Form State
  const [connectProvider, setConnectProvider] = useState<'cashfree' | 'razorpay'>('razorpay');
  const [connectEnv, setConnectEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [connectForm, setConnectForm] = useState({
    key_id: '',
    key_secret: '',
    app_id: '',
    secret_key: '',
    merchant_id: '',
    account_id: '',
  });
  const [showSecretKey, setShowSecretKey] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<string>('');

  // New Merchant Onboarding Multi-step Form State
  const [onboardProvider, setOnboardProvider] = useState<'cashfree' | 'razorpay'>('cashfree');
  const [onboardEnv, setOnboardEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [onboardError, setOnboardError] = useState<string>('');
  const [onboardSubmittedAccount, setOnboardSubmittedAccount] = useState<ShopPaymentAccount | null>(null);

  const [onboardForm, setOnboardForm] = useState({
    // Step 1: Shop Information
    business_name: '',
    business_type: 'Sole Proprietorship (एकल स्वामित्व)',
    business_category: 'Grocery & Supermarket (किराना स्टोर)',
    shop_address: '',
    state: 'Delhi',
    district: '',
    city: '',
    pincode: '',

    // Step 2: Owner Information
    owner_name: '',
    owner_mobile: '',
    owner_email: '',
    owner_pan: '',
    gstin: '',

    // Step 3: Bank Account Verification
    bank_account_holder: '',
    bank_account_number: '',
    confirm_bank_account_number: '',
    bank_ifsc: '',
    bank_name: '',
  });

  useEffect(() => {
    loadSettings();
  }, [shop]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await paymentSettingsApi.get();
      setData(res.data);

      // Pre-fill onboarding form with shop and owner profile
      if (res.data.prefill) {
        const p = res.data.prefill;
        setOnboardForm((prev) => ({
          ...prev,
          business_name: p.shop_name || prev.business_name,
          business_type: p.business_type || prev.business_type,
          business_category: p.business_category || prev.business_category,
          shop_address: p.shop_address || prev.shop_address,
          state: p.state || prev.state,
          district: p.district || prev.district,
          city: p.city || prev.city,
          pincode: p.pincode || prev.pincode,
          owner_name: p.owner_name || prev.owner_name,
          owner_mobile: p.owner_mobile || prev.owner_mobile,
          owner_email: p.owner_email || prev.owner_email,
          gstin: p.gstin || prev.gstin,
          bank_account_holder: p.owner_name || prev.bank_account_holder,
        }));
      }
    } catch (err: any) {
      console.error('Failed to load payment settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 6000);
  };

  // Option A Handler: Connect Existing Account
  const handleConnectExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectError('');
    setActionLoading(true);

    try {
      const payload: any = {
        provider: connectProvider,
        environment: connectEnv,
      };

      if (connectProvider === 'razorpay') {
        if (!connectForm.key_id.trim() || !connectForm.key_secret.trim()) {
          setConnectError('Please enter both Razorpay Key ID and Key Secret.');
          setActionLoading(false);
          return;
        }
        payload.key_id = connectForm.key_id.trim();
        payload.key_secret = connectForm.key_secret.trim();
        if (connectForm.account_id) payload.account_id = connectForm.account_id.trim();
      } else {
        if (!connectForm.app_id.trim() || !connectForm.secret_key.trim()) {
          setConnectError('Please enter both Cashfree App ID and Secret Key.');
          setActionLoading(false);
          return;
        }
        payload.app_id = connectForm.app_id.trim();
        payload.secret_key = connectForm.secret_key.trim();
        if (connectForm.merchant_id) payload.merchant_id = connectForm.merchant_id.trim();
      }

      const res = await paymentSettingsApi.connectExisting(payload);
      showToast(res.data.message || 'Payment account verified and connected successfully!', 'success');
      setShowConnectModal(false);
      setConnectForm({
        key_id: '',
        key_secret: '',
        app_id: '',
        secret_key: '',
        merchant_id: '',
        account_id: '',
      });
      loadSettings();
    } catch (err: any) {
      setConnectError(
        err.response?.data?.message ||
        'Failed to verify credentials with the provider API. Please double-check your keys.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Option B Handler: Multi-step Onboarding
  const handleNextStep = () => {
    setOnboardError('');

    if (currentStep === 1) {
      if (!onboardForm.business_name.trim()) {
        setOnboardError('Shop/Business Name is required.');
        return;
      }
      if (!onboardForm.shop_address.trim()) {
        setOnboardError('Shop Address is required.');
        return;
      }
      if (!onboardForm.city.trim()) {
        setOnboardError('City is required.');
        return;
      }
      if (!onboardForm.pincode || !/^[1-9][0-9]{5}$/.test(onboardForm.pincode.trim())) {
        setOnboardError('Please enter a valid 6-digit PIN code.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!onboardForm.owner_name.trim()) {
        setOnboardError('Owner name is required.');
        return;
      }
      if (!onboardForm.owner_mobile || !/^[6-9][0-9]{9}$/.test(onboardForm.owner_mobile.trim())) {
        setOnboardError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
      if (!onboardForm.owner_email || !/\S+@\S+\.\S+/.test(onboardForm.owner_email.trim())) {
        setOnboardError('Please enter a valid email address.');
        return;
      }
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
      if (!onboardForm.owner_pan || !panRegex.test(onboardForm.owner_pan.trim())) {
        setOnboardError('Please enter a valid 10-character Indian PAN number (e.g. ABCDE1234F).');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!onboardForm.bank_account_holder.trim()) {
        setOnboardError('Account Holder Name is required.');
        return;
      }
      if (!onboardForm.bank_account_number || onboardForm.bank_account_number.length < 8) {
        setOnboardError('Please enter a valid Bank Account Number (minimum 8 digits).');
        return;
      }
      if (onboardForm.bank_account_number !== onboardForm.confirm_bank_account_number) {
        setOnboardError('Account numbers do not match. Please re-check.');
        return;
      }
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
      if (!onboardForm.bank_ifsc || !ifscRegex.test(onboardForm.bank_ifsc.trim())) {
        setOnboardError('Please enter a valid 11-character IFSC code (e.g. HDFC0001234).');
        return;
      }
      if (!onboardForm.bank_name.trim()) {
        setOnboardError('Bank Name is required.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleStepSubmit = async () => {
    setOnboardError('');
    setActionLoading(true);

    try {
      const payload = {
        provider: onboardProvider,
        environment: onboardEnv,
        ...onboardForm,
        owner_pan: onboardForm.owner_pan.toUpperCase().trim(),
        bank_ifsc: onboardForm.bank_ifsc.toUpperCase().trim(),
      };

      const res = await paymentSettingsApi.onboardNew(payload);
      showToast(res.data.message || 'Onboarding application submitted successfully!', 'success');
      setOnboardSubmittedAccount(res.data.account);
      loadSettings();
    } catch (err: any) {
      setOnboardError(
        err.response?.data?.message ||
        'Failed to submit onboarding application. Please verify details.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Advance KYC / Check status
  const handleVerifyKyc = async (accountId: number) => {
    setActionLoading(true);
    try {
      const res = await paymentSettingsApi.verifyKyc(accountId);
      showToast(res.data.message || 'KYC verification status refreshed!', 'success');
      loadSettings();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to check KYC status.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Disconnect Account
  const handleDisconnect = async (accountId: number, providerName: string) => {
    if (!window.confirm(`Are you sure you want to disconnect ${providerName}? Digital QR and online checkout for this account will be paused.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await paymentSettingsApi.disconnect(accountId);
      showToast(res.data.message || 'Account disconnected.', 'success');
      loadSettings();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to disconnect account.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Set as primary gateway
  const handleSetPrimary = async (accountId: number) => {
    setActionLoading(true);
    try {
      const res = await paymentSettingsApi.setPrimary(accountId);
      showToast(res.data.message || 'Primary gateway updated.', 'success');
      loadSettings();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update primary gateway.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger ₹1 Test Order
  const handleTestOrder = async () => {
    setActionLoading(true);
    try {
      const res = await paymentSettingsApi.testOrder();
      setTestOrderData(res.data.order);
      setShowTestOrderModal(true);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Unable to generate test order.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const activeAccount = data?.active_account || data?.accounts?.find((a) => a.status === 'active');
  const underReviewAccount = data?.accounts?.find((a) => a.status === 'under_review' || a.kyc_status === 'in_progress');

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <span>Payment Settings (पेमेंट सेटिंग्स)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Connect your payment account to receive digital payments directly through your supported payment provider.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeAccount && (
            <button
              type="button"
              onClick={handleTestOrder}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Test Payment (₹1 Order)</span>
            </button>
          )}
          <button
            type="button"
            onClick={loadSettings}
            disabled={loading || actionLoading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Status Toast */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: Active Merchant Account Banner (If Connected) */}
      {activeAccount && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-5 sm:p-6 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
            <ShieldCheck className="w-64 h-64 text-white" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Active Gateway</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-white/10 text-white/90">
                  {activeAccount.environment === 'production' ? 'Live Production' : 'Sandbox / Test Mode'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDisconnect(activeAccount.id, activeAccount.provider === 'razorpay' ? 'Razorpay' : 'Cashfree')}
                  disabled={actionLoading}
                  className="text-xs font-semibold px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 transition-colors"
                >
                  Disconnect Account
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-black capitalize tracking-tight text-white">
                    {activeAccount.provider === 'razorpay' ? 'Razorpay Merchant Gateway' : 'Cashfree Payments Gateway'}
                  </h2>
                </div>
                <p className="text-xs text-emerald-100/80 mt-1">
                  Connected Store: <strong className="text-white">{activeAccount.business_name || shop?.name}</strong> • Direct Settlement Active
                </p>
              </div>

              <div className="bg-black/20 backdrop-blur-xs p-3 rounded-xl border border-white/10 space-y-1 text-xs sm:text-right">
                <div className="text-[11px] text-emerald-200/80 font-mono">
                  Merchant ID: <span className="font-bold text-white">{activeAccount.merchant_id || activeAccount.account_id || activeAccount.masked_app_id || 'Active MID'}</span>
                </div>
                {activeAccount.bank_account_number_masked && (
                  <div className="text-[11px] text-emerald-200/80 font-mono flex items-center sm:justify-end gap-1">
                    <Landmark className="w-3 h-3 text-emerald-300" />
                    <span>Bank: {activeAccount.bank_name || 'Linked'} ({activeAccount.bank_account_number_masked})</span>
                  </div>
                )}
                <div className="text-[10px] text-emerald-300 font-bold flex items-center sm:justify-end gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>KYC Verified & Settlements Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Pending Onboarding Application Tracker (If in progress) */}
      {underReviewAccount && !activeAccount && (
        <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Merchant Application Under Verification
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Application Reference: <strong className="font-mono text-amber-700 dark:text-amber-300">{underReviewAccount.application_reference}</strong> ({underReviewAccount.provider.toUpperCase()})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {underReviewAccount.onboarding_url && (
                <a
                  href={underReviewAccount.onboarding_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs"
                >
                  <span>Complete KYC on Provider Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => handleVerifyKyc(underReviewAccount.id)}
                disabled={actionLoading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                <span>Verify Status</span>
              </button>
            </div>
          </div>

          {/* Verification Progress Steps Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>1. Shop Profile</span>
              </div>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1">Submitted & Confirmed</p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>2. Owner Identity</span>
              </div>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1">PAN: {underReviewAccount.owner_pan_masked}</p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>3. Bank Verification</span>
              </div>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1">Acc: {underReviewAccount.bank_account_number_masked}</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-200">
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>4. Biometric KYC</span>
              </div>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-1">Complete on Provider Portal</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: The Two Prominent Integration Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* OPTION A: Connect Existing Account */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Option A • Instant Linking
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                Already have a merchant account?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Connect your existing Cashfree or Razorpay merchant account to ShopBill. Verify API keys in seconds and enable immediate digital collections.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <span>⚡ Cashfree Payments</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <span>⚡ Razorpay</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <span>0ms API Verification</span>
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setShowConnectModal(true);
                setConnectError('');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition-all shadow-md shadow-emerald-600/20"
            >
              <span>Connect Existing Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* OPTION B: Create a New Merchant Account */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Option B • Zero Setup Hassle
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                Don't have a merchant account?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Create a new merchant account directly through ShopBill. Complete 4-step guided verification, submit KYC, and start receiving digital customer payments.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                <span>1. Shop Profile</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                <span>2. Owner Identity</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                <span>3. Bank Verification</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                <span>4. Fast KYC</span>
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setShowOnboardModal(true);
                setCurrentStep(1);
                setOnboardError('');
                setOnboardSubmittedAccount(null);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md shadow-blue-600/20"
            >
              <span>Create Merchant Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4: Connected Accounts List & Status: Mobile Cards & Desktop Table */}
      {data?.accounts && data.accounts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600" />
              <span>Configured Merchant Accounts ({data.accounts.length})</span>
            </h3>
            <span className="text-[11px] sm:text-xs text-slate-400">Multi-tenant secure isolated configuration</span>
          </div>

          {/* Mobile Card Layout (< sm) */}
          <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
            {data.accounts.map((acc) => (
              <div key={acc.id} className="py-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm text-slate-900 dark:text-white capitalize">
                      {acc.provider === 'razorpay' ? 'Razorpay' : 'Cashfree'}
                    </span>
                    {acc.is_primary && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Primary
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      acc.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : acc.status === 'under_review'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {acc.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Type & Env</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {acc.connection_type === 'new_onboarding' ? 'New Onboarding' : 'Linked Account'} • <span className="uppercase text-[10px] font-bold">{acc.environment}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">KYC Status</span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        acc.kyc_status === 'verified'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {acc.kyc_status === 'verified' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span className="capitalize">{acc.kyc_status.replace('_', ' ')}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="font-mono text-[11px] text-slate-500 truncate max-w-[170px]">
                    ID: {acc.merchant_id || acc.account_id || acc.masked_app_id || 'Active MID'}
                  </div>
                  <div className="flex items-center gap-2">
                    {!acc.is_primary && acc.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(acc.id)}
                        disabled={actionLoading}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg border border-emerald-200 dark:border-emerald-800"
                      >
                        Set Primary
                      </button>
                    )}
                    {acc.status === 'under_review' && (
                      <button
                        type="button"
                        onClick={() => handleVerifyKyc(acc.id)}
                        disabled={actionLoading}
                        className="px-2.5 py-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 rounded-lg border border-amber-200 dark:border-amber-800"
                      >
                        Verify
                      </button>
                    )}
                    {acc.status !== 'disconnected' && (
                      <button
                        type="button"
                        onClick={() => handleDisconnect(acc.id, acc.provider)}
                        disabled={actionLoading}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Disconnect account"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout (>= sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Connection Type</th>
                  <th className="py-2.5 px-3">Environment</th>
                  <th className="py-2.5 px-3">Merchant / App ID</th>
                  <th className="py-2.5 px-3">KYC Status</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 dark:text-slate-100 capitalize">
                          {acc.provider === 'razorpay' ? 'Razorpay' : 'Cashfree'}
                        </span>
                        {acc.is_primary && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Primary
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 capitalize">
                      {acc.connection_type === 'new_onboarding' ? 'New Onboarding' : 'Existing Account'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {acc.environment}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {acc.merchant_id || acc.account_id || acc.masked_app_id || 'Active MID'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          acc.kyc_status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {acc.kyc_status === 'verified' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span className="capitalize">{acc.kyc_status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          acc.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : acc.status === 'under_review'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {acc.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!acc.is_primary && acc.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(acc.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200"
                          >
                            Set Primary
                          </button>
                        )}
                        {acc.status === 'under_review' && (
                          <button
                            type="button"
                            onClick={() => handleVerifyKyc(acc.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 text-[11px] font-bold text-amber-600 hover:bg-amber-50 rounded-lg border border-amber-200"
                          >
                            Verify
                          </button>
                        )}
                        {acc.status !== 'disconnected' && (
                          <button
                            type="button"
                            onClick={() => handleDisconnect(acc.id, acc.provider)}
                            disabled={actionLoading}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="Disconnect account"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Connect Existing Account (Option A) */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    Connect Existing Merchant Account
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verify & link your live Cashfree or Razorpay merchant credentials.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConnectExisting} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {connectError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{connectError}</span>
                </div>
              )}

              {/* 1. Provider Choice */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select Payment Gateway Provider *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setConnectProvider('razorpay');
                      setConnectError('');
                    }}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between space-y-2 ${
                      connectProvider === 'razorpay'
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-slate-900 dark:text-white">Razorpay</span>
                      {connectProvider === 'razorpay' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Key ID & Key Secret authentication
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConnectProvider('cashfree');
                      setConnectError('');
                    }}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between space-y-2 ${
                      connectProvider === 'cashfree'
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-slate-900 dark:text-white">Cashfree Payments</span>
                      {connectProvider === 'cashfree' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      App ID & Secret Key authentication
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Environment Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Operating Environment *
                </label>
                <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setConnectEnv('sandbox')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      connectEnv === 'sandbox'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Sandbox / Test (Testing)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConnectEnv('production')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      connectEnv === 'production'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Production (Live Store Payments)
                  </button>
                </div>
              </div>

              {/* 3. Credentials based on Provider */}
              {connectProvider === 'razorpay' ? (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Razorpay Key ID *
                    </label>
                    <input
                      type="text"
                      placeholder={connectEnv === 'production' ? 'rzp_live_xxxxxxxxxxxxxxxx' : 'rzp_test_xxxxxxxxxxxxxxxx'}
                      value={connectForm.key_id}
                      onChange={(e) => setConnectForm({ ...connectForm, key_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Razorpay Key Secret *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1"
                      >
                        {showSecretKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showSecretKey ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <input
                      type={showSecretKey ? 'text' : 'password'}
                      placeholder="Enter Key Secret from Razorpay Dashboard"
                      value={connectForm.key_secret}
                      onChange={(e) => setConnectForm({ ...connectForm, key_secret: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Merchant Account ID <span className="text-slate-400 font-normal">(Optional / Sub-account)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="acc_xxxxxxxxxxxxxx"
                      value={connectForm.account_id}
                      onChange={(e) => setConnectForm({ ...connectForm, account_id: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cashfree App ID (Client ID) *
                    </label>
                    <input
                      type="text"
                      placeholder={connectEnv === 'production' ? 'CF_APP_xxxxxxxxxxxxxxxx' : 'TEST_CF_APP_xxxxxxxxxxxx'}
                      value={connectForm.app_id}
                      onChange={(e) => setConnectForm({ ...connectForm, app_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Cashfree Secret Key *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1"
                      >
                        {showSecretKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showSecretKey ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <input
                      type={showSecretKey ? 'text' : 'password'}
                      placeholder="Enter Secret Key from Cashfree Merchant Portal"
                      value={connectForm.secret_key}
                      onChange={(e) => setConnectForm({ ...connectForm, secret_key: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Merchant ID <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="cf_merchant_id"
                      value={connectForm.merchant_id}
                      onChange={(e) => setConnectForm({ ...connectForm, merchant_id: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Security Assurance Box */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Secure Backend Verification & Encrypted Vault</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Keys are validated in real-time against the provider's API server. API secrets are encrypted using AES-256 and never exposed in frontend bundles. Never enter login passwords or bank PINs.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20"
                >
                  {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Verify & Connect Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create New Merchant Account (Option B - 4 Step Wizard) */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    New Merchant Account Registration
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Step {currentStep} of 4 • {currentStep === 1 ? 'Shop Information' : currentStep === 2 ? 'Owner Information' : currentStep === 3 ? 'Bank Account Verification' : 'KYC Verification & Submission'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOnboardModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="bg-slate-100 dark:bg-slate-800/70 px-4 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold">
              <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${currentStep >= 1 ? 'bg-blue-600' : 'bg-slate-400'}`}>1</span>
                <span className="hidden sm:inline">Shop Info</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
              <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${currentStep >= 2 ? 'bg-blue-600' : 'bg-slate-400'}`}>2</span>
                <span className="hidden sm:inline">Owner Info</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
              <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${currentStep >= 3 ? 'bg-blue-600' : 'bg-slate-400'}`}>3</span>
                <span className="hidden sm:inline">Bank Verification</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
              <div className={`flex items-center gap-1.5 ${currentStep === 4 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${currentStep === 4 ? 'bg-blue-600' : 'bg-slate-400'}`}>4</span>
                <span className="hidden sm:inline">KYC & Submit</span>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {onboardError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{onboardError}</span>
                </div>
              )}

              {/* Provider Selection (Shown on Step 1) */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Select Preferred Payment Provider *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setOnboardProvider('cashfree')}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between space-y-2 ${
                          onboardProvider === 'cashfree'
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-slate-900 dark:text-white">Cashfree Payments</span>
                          {onboardProvider === 'cashfree' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Instant UPI, Card & QR settlement • 0% UPI gateway fee
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOnboardProvider('razorpay')}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between space-y-2 ${
                          onboardProvider === 'razorpay'
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-slate-900 dark:text-white">Razorpay</span>
                          {onboardProvider === 'razorpay' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          India's largest merchant ecosystem • Dynamic POS QR
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Shop / Business Name *
                      </label>
                      <input
                        type="text"
                        value={onboardForm.business_name}
                        onChange={(e) => setOnboardForm({ ...onboardForm, business_name: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Business Type *
                      </label>
                      <select
                        value={onboardForm.business_type}
                        onChange={(e) => setOnboardForm({ ...onboardForm, business_type: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Sole Proprietorship (एकल स्वामित्व)">Sole Proprietorship (एकल स्वामित्व)</option>
                        <option value="Partnership Firm (साझेदारी फर्म)">Partnership Firm (साझेदारी फर्म)</option>
                        <option value="Private Limited Company">Private Limited Company</option>
                        <option value="Individual / Unregistered Retailer">Individual / Unregistered Retailer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Business Category *
                    </label>
                    <select
                      value={onboardForm.business_category}
                      onChange={(e) => setOnboardForm({ ...onboardForm, business_category: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Grocery & Supermarket (किराना स्टोर)">Grocery & Supermarket (किराना स्टोर)</option>
                      <option value="Cafe, Restaurant & Fast Food">Cafe, Restaurant & Fast Food</option>
                      <option value="Electronics & Mobile Store">Electronics & Mobile Store</option>
                      <option value="Clothing, Garments & Footwear">Clothing, Garments & Footwear</option>
                      <option value="Pharmacy & Medical Store">Pharmacy & Medical Store</option>
                      <option value="General Retail Merchant (सामान्य खुदरा विक्रेता)">General Retail Merchant (सामान्य खुदरा विक्रेता)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Shop Address *
                    </label>
                    <input
                      type="text"
                      placeholder="Shop No., Street, Market / Commercial Area"
                      value={onboardForm.shop_address}
                      onChange={(e) => setOnboardForm({ ...onboardForm, shop_address: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        value={onboardForm.state}
                        onChange={(e) => setOnboardForm({ ...onboardForm, state: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        District
                      </label>
                      <input
                        type="text"
                        value={onboardForm.district}
                        onChange={(e) => setOnboardForm({ ...onboardForm, district: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={onboardForm.city}
                        onChange={(e) => setOnboardForm({ ...onboardForm, city: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="110001"
                        value={onboardForm.pincode}
                        onChange={(e) => setOnboardForm({ ...onboardForm, pincode: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Owner Information */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200">
                    <span className="font-bold">Authorized Signatory / Proprietor Details:</span> Government financial regulations require verified PAN and contact details for merchant bank settlements.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Owner's Full Name (As per PAN Card) *
                    </label>
                    <input
                      type="text"
                      value={onboardForm.owner_name}
                      onChange={(e) => setOnboardForm({ ...onboardForm, owner_name: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Number * (For OTP & verification)
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="9876543210"
                        value={onboardForm.owner_mobile}
                        onChange={(e) => setOnboardForm({ ...onboardForm, owner_mobile: e.target.value.replace(/\D/g, '') })}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address * (For settlement reports)
                      </label>
                      <input
                        type="email"
                        placeholder="owner@myretailstore.com"
                        value={onboardForm.owner_email}
                        onChange={(e) => setOnboardForm({ ...onboardForm, owner_email: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Permanent Account Number (PAN) *
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="ABCDE1234F"
                        value={onboardForm.owner_pan}
                        onChange={(e) => setOnboardForm({ ...onboardForm, owner_pan: e.target.value.toUpperCase() })}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono uppercase outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        GSTIN <span className="text-slate-400 font-normal">(Optional if unregistered)</span>
                      </label>
                      <input
                        type="text"
                        maxLength={15}
                        placeholder="29ABCDE1234F1Z5"
                        value={onboardForm.gstin}
                        onChange={(e) => setOnboardForm({ ...onboardForm, gstin: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono uppercase outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Bank Account Verification */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>Security & Non-Custodial Compliance Notice</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      ShopBill strictly collects settlement bank routing info for vendor payout creation. We <strong>NEVER</strong> collect, ask for, or store UPI PINs, Internet Banking passwords, or Debit/Credit Card PINs.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Account Holder Name (As in Bank Passbook) *
                    </label>
                    <input
                      type="text"
                      value={onboardForm.bank_account_holder}
                      onChange={(e) => setOnboardForm({ ...onboardForm, bank_account_holder: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Bank Account Number *
                      </label>
                      <input
                        type="password"
                        placeholder="Enter bank account number"
                        value={onboardForm.bank_account_number}
                        onChange={(e) => setOnboardForm({ ...onboardForm, bank_account_number: e.target.value.replace(/\D/g, '') })}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Confirm Bank Account Number *
                      </label>
                      <input
                        type="text"
                        placeholder="Re-enter bank account number"
                        value={onboardForm.confirm_bank_account_number}
                        onChange={(e) => setOnboardForm({ ...onboardForm, confirm_bank_account_number: e.target.value.replace(/\D/g, '') })}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Bank IFSC Code *
                      </label>
                      <input
                        type="text"
                        maxLength={11}
                        placeholder="HDFC0001234 / SBIN0000691"
                        value={onboardForm.bank_ifsc}
                        onChange={(e) => setOnboardForm({ ...onboardForm, bank_ifsc: e.target.value.toUpperCase() })}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono uppercase outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Bank Name & Branch *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. State Bank of India, Main Branch"
                        value={onboardForm.bank_name}
                        onChange={(e) => setOnboardForm({ ...onboardForm, bank_name: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: KYC Verification & Application Submission */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  {!onboardSubmittedAccount ? (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
                        <h4 className="font-bold text-xs text-blue-900 dark:text-blue-100 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          <span>Review Registration Summary</span>
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <div>Provider: <strong className="text-slate-900 dark:text-white capitalize">{onboardProvider}</strong></div>
                          <div>Store Name: <strong className="text-slate-900 dark:text-white">{onboardForm.business_name}</strong></div>
                          <div>Owner Name: <strong className="text-slate-900 dark:text-white">{onboardForm.owner_name}</strong></div>
                          <div>Mobile: <strong className="text-slate-900 dark:text-white">{onboardForm.owner_mobile}</strong></div>
                          <div>PAN: <strong className="font-mono text-slate-900 dark:text-white">{onboardForm.owner_pan.toUpperCase()}</strong></div>
                          <div>Bank: <strong className="text-slate-900 dark:text-white">{onboardForm.bank_name} (••••{onboardForm.bank_account_number.slice(-4)})</strong></div>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                        <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Official Hosted KYC Integration</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          Upon submission, your application reference will be generated and routed directly to <strong>{onboardProvider === 'razorpay' ? 'Razorpay' : 'Cashfree'}</strong>. You will receive an official hosted KYC link to complete biometric or Aadhaar OTP verification.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleStepSubmit}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 transition-all shadow-md shadow-blue-600/20"
                      >
                        {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                        <span>Submit Merchant Onboarding Application</span>
                      </button>
                    </div>
                  ) : (
                    /* Post Submission Status & Reference Display */
                    <div className="space-y-4 py-2">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h4 className="font-black text-slate-900 dark:text-white text-base">
                          Application Submitted Successfully!
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Your merchant account has been provisioned and is currently under verification.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-slate-500 font-semibold">Application Reference:</span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                            {onboardSubmittedAccount.application_reference}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Provider:</span>
                          <span className="font-bold capitalize text-slate-800 dark:text-slate-100">{onboardSubmittedAccount.provider}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Status:</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                            {onboardSubmittedAccount.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">KYC Progress:</span>
                          <span className="font-bold text-amber-600">Pending Biometric / Penny Drop</span>
                        </div>
                      </div>

                      {onboardSubmittedAccount.onboarding_url && (
                        <div className="space-y-2 pt-1">
                          <a
                            href={onboardSubmittedAccount.onboarding_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md"
                          >
                            <span>Open {onboardSubmittedAccount.provider === 'razorpay' ? 'Razorpay' : 'Cashfree'} Hosted KYC Window</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleVerifyKyc(onboardSubmittedAccount.id)}
                          disabled={actionLoading}
                          className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Check Status / Test Approval
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowOnboardModal(false)}
                          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Navigation Buttons (Steps 1 to 3) */}
              {!onboardSubmittedAccount && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  ) : (
                    <div></div>
                  )}

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Test Payment Order Modal */}
      {showTestOrderModal && testOrderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-5 space-y-4 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase text-emerald-600">Test Payment Order (₹1.00)</span>
              <button
                type="button"
                onClick={() => setShowTestOrderModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">₹1.00</p>
              <p className="text-xs text-slate-500">Live Merchant Payment Simulation</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1.5 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Gateway:</span>
                <span className="font-bold capitalize">{testOrderData.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono font-bold">{testOrderData.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Merchant MID:</span>
                <span className="font-mono">{testOrderData.merchant_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Environment:</span>
                <span className="font-bold uppercase text-emerald-600">{testOrderData.environment}</span>
              </div>
            </div>

            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Gateway route connected & responding!</span>
            </div>

            <button
              type="button"
              onClick={() => setShowTestOrderModal(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900"
            >
              Close Test Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSettingsScreen;
