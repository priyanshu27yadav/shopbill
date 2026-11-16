import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';

export const LoginScreen: React.FC = () => {
  // Mode: 'login' | 'forgot_step1' | 'forgot_step2'
  const [mode, setMode] = useState<'login' | 'forgot_step1' | 'forgot_step2'>('login');

  // Login form state
  const [email, setEmail] = useState('shopkeeper@shopbill.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const { login, setAuthSession } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login({ email, password });
      navigate('/billing');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);
    setError('');
    try {
      await login({ email: demoEmail, password: 'password123' });
      navigate('/billing');
    } catch (err: any) {
      setError('Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Step 1 - Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');
    setDevOtp(null);

    try {
      const res = await authApi.forgotPassword(forgotEmail);
      setSuccessMessage(res.data.message || 'OTP sent successfully to your registered email.');
      if (res.data.dev_otp) {
        setDevOtp(res.data.dev_otp);
        setOtp(res.data.dev_otp); // autofill for instant convenience
      }
      setMode('forgot_step2');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Failed to send OTP. Please verify your email.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Step 2 - Verify OTP & Reset Password & Auto Login
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await authApi.resetPassword({
        email: forgotEmail,
        otp: otp.trim(),
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      // Auto login user directly
      if (res.data.token && res.data.user) {
        setAuthSession(res.data.token, res.data.user, res.data.shop, res.data.permissions);
        navigate('/billing');
      } else {
        setMode('login');
        setSuccessMessage('Password updated successfully! Please sign in with your new password.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.errors?.otp?.[0] || 'Password reset failed. Please check OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
          SB
        </div>
        <h2 className="mt-3 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          SHOPBILL
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {mode === 'login'
            ? 'Sign in to your shopkeeper or cashier account'
            : 'Account Recovery & Password Reset (पासवर्ड रीसेट करें)'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl rounded-3xl border border-slate-200 dark:border-slate-800 sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE: NORMAL LOGIN */}
          {mode === 'login' && (
            <>
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter registered email"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setError('');
                        setSuccessMessage('');
                        setMode('forgot_step1');
                      }}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline transition-colors"
                    >
                      Forgot Password? (पासवर्ड भूल गए?)
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{loading ? 'Signing in...' : 'Sign In to Store'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Demo Logins */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center mb-3">
                  Fast Demo Accounts
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('shopkeeper@shopbill.com')}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <p className="font-bold text-slate-800 dark:text-slate-200">Shopkeeper</p>
                    <p className="text-[10px] text-slate-400">Full Owner Access</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('cashier@shopbill.com')}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <p className="font-bold text-slate-800 dark:text-slate-200">Cashier</p>
                    <p className="text-[10px] text-slate-400">POS Billing Only</p>
                  </button>
                </div>
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('admin@shopbill.com')}
                    className="text-[11px] font-semibold text-purple-600 hover:underline cursor-pointer"
                  >
                    Login as Super Admin &rarr;
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center text-xs text-slate-500">
                Don't have a shop account?{' '}
                <Link to="/register" className="font-bold text-emerald-600 hover:underline">
                  Register Shop
                </Link>
              </div>
            </>
          )}

          {/* MODE: FORGOT PASSWORD - STEP 1 (ENTER EMAIL) */}
          {mode === 'forgot_step1' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setMode('login');
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span>Forgot Password (पासवर्ड भूल गए?)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Step 1 of 2: Enter your registered email address
                  </p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSendOtp}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Registered Email Address (पंजीकृत ईमेल)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. shopkeeper@shopbill.com"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    A 6-digit verification code (OTP) will be sent to this email.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{loading ? 'Sending OTP...' : 'Send OTP Code (ओटीपी भेजें)'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setMode('login');
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    &larr; Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE: FORGOT PASSWORD - STEP 2 (ENTER OTP & NEW PASSWORD) */}
          {mode === 'forgot_step2' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setMode('forgot_step1');
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span>Enter OTP & New Password</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Step 2 of 2: Sent to <span className="font-semibold text-slate-700 dark:text-slate-300">{forgotEmail}</span>
                  </p>
                </div>
              </div>

              {devOtp && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Local Demo OTP:
                  </span>
                  <span className="font-mono font-extrabold text-sm tracking-widest bg-amber-200 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                    {devOtp}
                  </span>
                </div>
              )}

              <form className="space-y-3" onSubmit={handleResetPassword}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    6-Digit Verification OTP (ओटीपी दर्ज करें)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.5em] font-mono text-base py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Password (नया पासवर्ड)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password (पासवर्ड दोबारा लिखें)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>{loading ? 'Resetting Password...' : 'Reset Password & Login (पासवर्ड बदलें)'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="text-emerald-600 hover:underline font-semibold cursor-pointer"
                  >
                    Resend OTP (दोबारा भेजें)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setMode('login');
                    }}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
