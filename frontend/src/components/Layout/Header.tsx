import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  PlusCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Languages,
  Menu,
} from 'lucide-react';
import { useOffline } from '../../context/OfflineContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface HeaderProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ sidebarOpen, onToggleSidebar }) => {
  const { isOnline, isManualOffline, isSyncing, pendingBillsCount, syncNow, toggleOfflineMode } = useOffline();
  const { shop } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Global F2 keyboard shortcut for Fast Billing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        navigate('/billing');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleSyncClick = async () => {
    const res = await syncNow();
    if (res.message) {
      alert(res.message);
    }
  };

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between select-none">
      <div className="flex items-center gap-3">
        {/* 3-Line Hamburger Menu Toggle Button */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={sidebarOpen ? 'Hide Sidebar (साइडबार छुपाएं)' : 'Show Sidebar (साइडबार खोलें)'}
            aria-label="Toggle navigation sidebar"
            className="p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-2xs active:scale-95"
          >
            <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
        )}

        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>{shop?.name || 'ShopBill Central'}</span>
            {shop?.is_gst_registered ? (
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                {t('header.gstin')}: {shop.gstin}
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded">
                {t('header.non_gst')}
              </span>
            )}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Language Switch Toggle (English / हिंदी) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <Languages className="w-3.5 h-3.5 text-slate-400 mx-1.5 shrink-0 hidden sm:inline" />
          <button
            type="button"
            onClick={() => setLanguage('en')}
            title="Switch to English"
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              language === 'en'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            title="हिंदी भाषा चुनें"
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              language === 'hi'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            हिंदी
          </button>
        </div>

        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{time}</span>
        </div>

        {/* Offline / Online Desktop Sync Status */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleOfflineMode}
            title={
              isOnline
                ? 'Online Central • Click to switch to Offline POS mode'
                : isManualOffline
                ? 'Manual Offline Mode • Click to connect online & auto-sync'
                : 'Offline • Network disconnected, bills saved locally'
            }
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              isOnline
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50'
                : 'text-amber-800 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 animate-pulse'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">{t('header.online')}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>{isManualOffline ? 'Offline (Test)' : t('header.offline')}</span>
              </>
            )}
          </button>

          {pendingBillsCount > 0 && (
            <button
              onClick={handleSyncClick}
              disabled={isSyncing || !isOnline}
              title="Sync offline bills with server database"
              className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{t('header.sync')} {pendingBillsCount}</span>
            </button>
          )}
        </div>

        {/* Quick New Bill Button */}
        {location.pathname !== '/billing' && (
          <button
            onClick={() => navigate('/billing')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t('header.new_bill')}</span>
            <kbd className="hidden sm:inline bg-emerald-700/60 text-[10px] px-1 py-0.2 rounded font-mono">
              F2
            </kbd>
          </button>
        )}
      </div>
    </header>
  );
};
