import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  PlusCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useOffline } from '../../context/OfflineContext';
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC = () => {
  const { isOnline, isSyncing, pendingBillsCount, syncNow } = useOffline();
  const { shop } = useAuth();
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
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between select-none">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>{shop?.name || 'ShopBill Central'}</span>
            {shop?.is_gst_registered ? (
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                GSTIN: {shop.gstin}
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded">
                Non-GST Retail Mode
              </span>
            )}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-700/60">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{time}</span>
        </div>

        {/* Offline / Online Desktop Sync Status */}
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <div
              title="Online - Connected to Central MySQL"
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/50"
            >
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Online Central</span>
            </div>
          ) : (
            <div
              title="Offline - Storing bills in local SQLite database"
              className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/50"
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-500" />
              <span>Offline SQLite</span>
            </div>
          )}

          {pendingBillsCount > 0 && (
            <button
              onClick={handleSyncClick}
              disabled={isSyncing || !isOnline}
              title="Sync offline bills with server database"
              className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md shadow-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync {pendingBillsCount}</span>
            </button>
          )}
        </div>

        {/* Quick New Bill Button */}
        {location.pathname !== '/billing' && (
          <button
            onClick={() => navigate('/billing')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Bill</span>
            <kbd className="hidden sm:inline bg-emerald-700/60 text-[10px] px-1 py-0.2 rounded font-mono">
              F2
            </kbd>
          </button>
        )}
      </div>
    </header>
  );
};
