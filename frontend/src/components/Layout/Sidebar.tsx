import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Receipt,
  LayoutDashboard,
  Package,
  FileSpreadsheet,
  FolderTree,
  FileText,
  Users,
  BarChart3,
  Settings,
  Shield,
  Moon,
  Sun,
  LogOut,
  Store,
  ChevronDown,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export const Sidebar: React.FC = () => {
  const { user, shop, accessibleShops, permissions, switchShop, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  interface NavItem {
    name: string;
    path: string;
    icon: any;
    badge?: string;
    highlight?: boolean;
    requirePerm?: 'can_give_discount' | 'can_view_reports' | 'can_manage_items' | 'can_cancel_bills';
  }

  const navItems: NavItem[] = [
    {
      name: t('nav.fast_billing'),
      path: '/billing',
      icon: Receipt,
      badge: 'POS',
      highlight: true,
    },
    {
      name: t('nav.dashboard'),
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: t('nav.products'),
      path: '/products',
      icon: Package,
    },
    {
      name: t('nav.pdf_upload'),
      path: '/price-list-upload',
      icon: FileSpreadsheet,
      badge: 'OCR',
    },
    {
      name: t('nav.categories'),
      path: '/categories',
      icon: FolderTree,
    },
    {
      name: t('nav.invoices'),
      path: '/invoices',
      icon: FileText,
    },
    {
      name: t('nav.sales_return'),
      path: '/returns',
      icon: RotateCcw,
      badge: 'Return',
    },
    {
      name: t('nav.customers'),
      path: '/customers',
      icon: Users,
    },
    {
      name: t('nav.reports'),
      path: '/reports',
      icon: BarChart3,
      requirePerm: 'can_view_reports',
    },
    {
      name: t('nav.settings'),
      path: '/settings',
      icon: Settings,
      requirePerm: 'can_manage_items',
    },
  ];

  if (user?.role === 'super_admin') {
    navItems.push({
      name: t('nav.super_admin'),
      path: '/admin',
      icon: Shield,
      badge: 'Admin',
      highlight: false,
    });
  }

  return (
    <>
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen select-none transition-colors duration-200">
        {/* Brand & Shop Switcher */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-bold text-lg">
              SB
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>SHOPBILL</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded">
                  v1.0
                </span>
              </h1>
              <p className="text-xs text-slate-400">{t('user.retail_billing')}</p>
            </div>
          </div>

          {/* Shop Switcher Card */}
          <div className="relative">
            <button
              onClick={() => setShowShopDropdown(!showShopDropdown)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {shop?.name || 'My Shop'}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize">
                    {shop?.business_type || 'Retail'} • {shop?.is_gst_registered ? 'GST' : 'Non-GST'}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {showShopDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {t('user.your_shops')}
                </div>
                {accessibleShops.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      switchShop(s.id);
                      setShowShopDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                  >
                    <div className="truncate text-left">
                      <p className={`font-medium ${shop?.id === s.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {s.name}
                      </p>
                      <p className="text-[10px] text-slate-400 capitalize">{s.business_type} • {s.city || 'Store'}</p>
                    </div>
                    {shop?.id === s.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            if (item.requirePerm && !permissions[item.requirePerm]) {
              return null;
            }

            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? item.highlight
                        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                        : 'bg-slate-100 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400'
                      : item.highlight
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive
                            ? item.highlight
                              ? 'text-white'
                              : 'text-emerald-600 dark:text-emerald-400'
                            : item.highlight
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          isActive && item.highlight
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / Profile & Theme Toggle */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user?.name || 'Staff User'}
                </p>
                <p className="text-[10px] text-slate-400 capitalize">
                  {permissions.role.replace('_', ' ')}
                </p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('user.sign_out')}</span>
          </button>
        </div>
      </aside>

      {/* Sign Out Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/40">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t('logout.title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('logout.message')}
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t('logout.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="flex-1 py-2.5 text-xs font-extrabold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {t('logout.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
