import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Eye,
  EyeOff,
  Quote,
  ChevronLeft,
  ChevronRight,
  Zap,
  Printer,
  Smartphone,
  ShieldCheck,
  Globe,
  Store,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { authApi } from '../../api';

interface RetailQuote {
  quote_hi: string;
  quote_en: string;
  author: string;
  store: string;
  location: string;
  metric: string;
  tag: string;
}

const RETAIL_QUOTES: RetailQuote[] = [
  {
    quote_hi:
      'दुकानदारी सिर्फ सामान बेचना नहीं, ग्राहकों का अटूट विश्वास जीतना है। ShopBill ने हमारे 3 स्टोर्स की बिलिंग, जीएसटी और उधारी को 100% पारदर्शी बना दिया।',
    quote_en:
      'Retail is not just about selling items; it is about earning unshakeable customer trust. ShopBill made our billing, GST, and Udhaar ledger 100% crystal clear.',
    author: 'रमेश कुमार गुप्ता (Ramesh Gupta)',
    store: 'श्री राम इलेक्ट्रॉनिक्स & हार्डवेयर',
    location: 'जयपुर, राजस्थान',
    metric: '₹24 लाख+ मासिक बिलिंग',
    tag: 'Verified Retailer ✓',
  },
  {
    quote_hi:
      'काउंटर पर ग्राहकों की कतारें अब बीते दिनों की बात हैं। बारकोड स्कैनिंग और 0.5 सेकंड थर्मल प्रिंटिंग से हमारा बिलिंग समय 3 मिनट से घटकर सिर्फ 15 सेकंड रह गया।',
    quote_en:
      'Counter queues are history. With instant barcode lookup and 0.5s thermal receipt printing, our billing checkout dropped from 3 minutes to just 15 seconds.',
    author: 'आनंद शर्मा (Anand Sharma)',
    store: 'Anand Electricals & Light House',
    location: 'HSR Layout, Bengaluru',
    metric: '50,000+ बिल जनरेटेड',
    tag: 'High-Volume POS ⚡',
  },
  {
    quote_hi:
      'पहले उधारी का हिसाब डायरी में रहता था और पैसे मांगने में संकोच होता था। ShopBill के डिजिटल व्हाट्सएप लेजर और 1-क्लिक कलेक्शन से हमारी 95% उधारी समय पर आ जाती है।',
    quote_en:
      'Previously credit was scribbled in diaries, making collection awkward. With ShopBill digital WhatsApp Khata and 1-click settlement, 95% of dues arrive on time.',
    author: 'राजेश कुमार (Rajesh Kumar)',
    store: 'सिटी सुपरमार्ट & किराना स्टोर',
    location: 'वाराणसी, उत्तर प्रदेश',
    metric: '95% रिकवरी रेट',
    tag: 'Khata Specialist 🛡️',
  },
  {
    quote_hi:
      'बारिश या बिजली कटने पर इंटरनेट न हो तो भी कोई चिंता नहीं! ShopBill बिना इंटरनेट के ऑफलाइन बिल काटता रहता है और नेटवर्क आते ही क्लाउड पर ऑटो-सिंक कर देता है।',
    quote_en:
      'No internet during storms or power cuts? Zero stress! ShopBill keeps billing offline flawlessly and auto-syncs to cloud the instant network returns.',
    author: 'डॉ. मीरा नंबियार (Dr. Meera Nambiar)',
    store: 'LifeCare Pharmacy & Retail',
    location: 'BTM Stage 2, Bengaluru',
    metric: '100% ऑफलाइन रेजिलिएंस',
    tag: 'Zero Downtime 📶',
  },
];

export const LoginScreen: React.FC = () => {
  // Mode: 'login' | 'forgot_step1' | 'forgot_step2'
  const [mode, setMode] = useState<'login' | 'forgot_step1' | 'forgot_step2'>('login');

  // Login form state
  const [email, setEmail] = useState('shopkeeper@shopbill.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Quotes Carousel State
  const [activeQuoteIdx, setActiveQuoteIdx] = useState(0);
  const [quoteProgress, setQuoteProgress] = useState(0);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const { login, setAuthSession } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  // Canvas ref for dynamic high-tech ambient particle network
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-rotating quotes carousel timer
  useEffect(() => {
    const intervalTime = 6000;
    const stepTime = 100;
    const totalSteps = intervalTime / stepTime;

    const timer = setInterval(() => {
      setQuoteProgress((prev) => {
        if (prev >= 100) {
          setActiveQuoteIdx((curr) => (curr + 1) % RETAIL_QUOTES.length);
          return 0;
        }
        return prev + 100 / totalSteps;
      });
    }, stepTime);

    return () => clearInterval(timer);
  }, [activeQuoteIdx]);

  // Dynamic 60fps Particle Canvas Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes
    const particleCount = Math.min(50, Math.floor(width / 35));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2 + 1,
      color: Math.random() > 0.4 ? 'rgba(16, 185, 129, ' : 'rgba(56, 189, 248, ',
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw particle connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.12 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw and move particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleNextQuote = () => {
    setActiveQuoteIdx((curr) => (curr + 1) % RETAIL_QUOTES.length);
    setQuoteProgress(0);
  };

  const handlePrevQuote = () => {
    setActiveQuoteIdx((curr) => (curr - 1 + RETAIL_QUOTES.length) % RETAIL_QUOTES.length);
    setQuoteProgress(0);
  };

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
        setOtp(res.data.dev_otp);
      }
      setMode('forgot_step2');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.email?.[0] ||
          'Failed to send OTP. Please verify your email.'
      );
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

      if (res.data.token && res.data.user) {
        setAuthSession(res.data.token, res.data.user, res.data.shop, res.data.permissions);
        navigate('/billing');
      } else {
        setMode('login');
        setSuccessMessage('Password updated successfully! Please sign in with your new password.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.otp?.[0] ||
          'Password reset failed. Please check OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  const currentQuote = RETAIL_QUOTES[activeQuoteIdx];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* 1. Ambient Background Video Loop (Subtle Tech & Light Motion) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-18 pointer-events-none filter blur-[1px] mix-blend-screen"
        src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-charts-31912-large.mp4"
      />

      {/* 2. Interactive Canvas Particle Field */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* 3. Luminous Glowing Gradient Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-[30rem] h-[30rem] bg-teal-500/15 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />

      {/* 4. Subtle Radial Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* 5. Main Responsive Grid Container */}
      <div className="relative z-10 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-12 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT COLUMN: BRAND EXPERIENCE & INSPIRATIONAL RETAIL QUOTES CAROUSEL (7 COLS) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
            {/* Top Brand Badge */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Next-Gen Cloud & Offline POS • V1.0</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Smart Retail Billing.{' '}
                <span className="shimmer-text">100% Peace of Mind.</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                {language === 'hi'
                  ? 'भारतीय किराना, इलेक्ट्रिकल, हार्डवेयर और गारमेंट्स रिटेलर्स का सबसे तेज़, भरोसेमंद और आधुनिक बिलिंग साथी।'
                  : 'Empowering retail business owners with lightning-fast GST billing, automated Udhaar Khata, and 0.5s thermal receipt generation.'}
              </p>
            </div>

            {/* Inspiring Quotes Carousel Card */}
            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/60 p-6 sm:p-8 rounded-3xl shadow-2xl overflow-hidden group">
              {/* Subtle quote accent glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Quote className="w-5 h-5 fill-emerald-500/20" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {language === 'hi' ? 'रिटेलर्स का अनुभव' : 'Retailer Story'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {currentQuote.tag}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-400 ml-1">
                    0{activeQuoteIdx + 1} / 0{RETAIL_QUOTES.length}
                  </span>
                </div>
              </div>

              {/* Quote Text */}
              <div className="py-5 min-h-[105px]">
                <p className="text-sm sm:text-base font-medium text-slate-100 italic leading-relaxed">
                  "{language === 'hi' ? currentQuote.quote_hi : currentQuote.quote_en}"
                </p>
              </div>

              {/* Quote Author & Metric */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-extrabold text-white text-xs sm:text-sm">
                    {currentQuote.author}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {currentQuote.store} • {currentQuote.location}
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono font-bold text-emerald-400 shrink-0 self-start sm:self-auto">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{currentQuote.metric}</span>
                </div>
              </div>

              {/* Carousel Navigation & Progress Bar */}
              <div className="mt-5 flex items-center justify-between pt-2">
                {/* Dots indicator */}
                <div className="flex items-center gap-2">
                  {RETAIL_QUOTES.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveQuoteIdx(idx);
                        setQuoteProgress(0);
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === activeQuoteIdx
                          ? 'w-6 bg-emerald-500 shadow-sm shadow-emerald-500/50'
                          : 'w-2 bg-slate-700 hover:bg-slate-500'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Left/Right Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevQuote}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    aria-label="Previous quote"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextQuote}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    aria-label="Next quote"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar animation */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-100 ease-linear"
                  style={{ width: `${quoteProgress}%` }}
                />
              </div>
            </div>

            {/* Trust and Key Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">0.5s Thermal</p>
                  <p className="text-[10px] text-slate-400">58mm & 80mm</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">WhatsApp Bill</p>
                  <p className="text-[10px] text-slate-400">Instant PDF Link</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">Smart Khata</p>
                  <p className="text-[10px] text-slate-400">Auto Udhaar Sync</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">Offline POS</p>
                  <p className="text-[10px] text-slate-400">Zero Internet Halt</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ELEVATED FROSTED GLASSMORPHIC LOGIN CARD (5 COLS) */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl py-8 px-6 sm:px-9 shadow-2xl rounded-3xl border border-white/50 dark:border-slate-800 text-slate-900 dark:text-white transition-all">
              {/* Header with Logo & Language Toggle */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-600/30">
                    SB
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>SHOPBILL</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase">
                        POS
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Retail Billing Software
                    </p>
                  </div>
                </div>

                {/* Language Switch Toggle Button */}
                <button
                  type="button"
                  onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-colors cursor-pointer"
                  title="Switch Language / भाषा बदलें"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
                </button>
              </div>

              {/* Title Description */}
              <div className="mt-4 mb-5">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {mode === 'login'
                    ? language === 'hi'
                      ? 'स्टोर में लॉगिन करें'
                      : 'Sign in to Store'
                    : language === 'hi'
                    ? 'पासवर्ड रीसेट करें'
                    : 'Account Recovery'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {mode === 'login'
                    ? language === 'hi'
                      ? 'अपने दुकानदार या कैशियर खाते से प्रवेश करें'
                      : 'Access your billing counter, stock & ledger'
                    : 'Enter registered details to recover access'}
                </p>
              </div>

              {/* Error Notice Banner */}
              {error && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Notice Banner */}
              {successMessage && (
                <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* MODE 1: NORMAL SIGN IN */}
              {mode === 'login' && (
                <>
                  <form className="space-y-4" onSubmit={handleLoginSubmit}>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'hi' ? 'ईमेल पता' : 'Email Address'} *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="shopkeeper@shopbill.com"
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {language === 'hi' ? 'पासवर्ड' : 'Password'} *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotEmail(email);
                            setError('');
                            setSuccessMessage('');
                            setMode('forgot_step1');
                          }}
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline transition-colors cursor-pointer"
                        >
                          {language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                        </button>
                      </div>

                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                      <span>
                        {loading
                          ? language === 'hi'
                            ? 'प्रवेश हो रहा है...'
                            : 'Signing in...'
                          : language === 'hi'
                          ? 'दुकान में लॉगिन करें'
                          : 'Sign In to Store'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Quick Demo Accounts Helper */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center mb-2.5">
                      Fast Demo Accounts
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleQuickDemoLogin('shopkeeper@shopbill.com')}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group"
                      >
                        <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">
                          Shopkeeper
                        </p>
                        <p className="text-[10px] text-slate-400">Full Owner Access</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickDemoLogin('cashier@shopbill.com')}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group"
                      >
                        <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">
                          Cashier
                        </p>
                        <p className="text-[10px] text-slate-400">POS Billing Only</p>
                      </button>
                    </div>

                    <div className="mt-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleQuickDemoLogin('admin@shopbill.com')}
                        className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        Login as Super Admin &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Register New Shop CTA */}
                  <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5">
                    <span>{language === 'hi' ? 'दुकान का खाता नहीं है?' : "Don't have a shop account?"}</span>
                    <Link
                      to="/register"
                      className="font-extrabold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>{language === 'hi' ? 'नया स्टोर बनाएं' : 'Register Shop'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </>
              )}

              {/* MODE 2: FORGOT PASSWORD - STEP 1 (EMAIL ENTRY) */}
              {mode === 'forgot_step1' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setMode('login');
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="e.g. shopkeeper@shopbill.com"
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        A 6-digit verification code (OTP) will be sent to this email.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                      >
                        &larr; Back to Sign In
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* MODE 3: FORGOT PASSWORD - STEP 2 (OTP & RESET PASSWORD) */}
              {mode === 'forgot_step2' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setMode('forgot_step1');
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-emerald-600" />
                        <span>Enter OTP & New Password</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Step 2 of 2: Sent to{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {forgotEmail}
                        </span>
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
                        6-Digit Verification OTP (ओटीपी कोड)
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
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Confirm New Password (पासवर्ड दोबारा लिखें)
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <span>
                        {loading
                          ? 'Resetting Password...'
                          : 'Reset Password & Login (पासवर्ड बदलें)'}
                      </span>
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
      </div>
    </div>
  );
};
