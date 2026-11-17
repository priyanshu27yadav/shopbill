import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Shop, Permissions } from '../types';
import { authApi } from '../api';

interface AuthContextType {
  user: User | null;
  shop: Shop | null;
  accessibleShops: Shop[];
  permissions: Permissions;
  token: string | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  setAuthSession: (authToken: string, authUser: User, authShop: Shop, authPerms?: Permissions) => void;
  switchShop: (shopId: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const defaultPermissions: Permissions = {
  role: 'owner',
  can_give_discount: true,
  can_view_reports: true,
  can_manage_items: true,
  can_cancel_bills: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const u = localStorage.getItem('shopbill_cached_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [shop, setShop] = useState<Shop | null>(() => {
    try {
      const s = localStorage.getItem('shopbill_cached_shop');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [accessibleShops, setAccessibleShops] = useState<Shop[]>([]);
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('shopbill_token'));
  const [loading, setLoading] = useState<boolean>(() => {
    const t = localStorage.getItem('shopbill_token');
    const u = localStorage.getItem('shopbill_cached_user');
    return !!t && !u;
  });

  const fetchCurrentUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.me();
      setUser(res.data.user);
      setShop(res.data.shop);
      setAccessibleShops(res.data.accessible_shops || []);
      setPermissions(res.data.permissions || defaultPermissions);
      if (res.data.user) {
        localStorage.setItem('shopbill_cached_user', JSON.stringify(res.data.user));
      }
      if (res.data.shop?.id) {
        localStorage.setItem('shopbill_active_shop_id', res.data.shop.id.toString());
        localStorage.setItem('shopbill_cached_shop', JSON.stringify(res.data.shop));
      }
    } catch (err: any) {
      console.warn('Authentication session check response:', err);
      // ONLY clear session if server explicitly returned 401 Unauthorized
      if (err.response?.status === 401) {
        localStorage.removeItem('shopbill_token');
        localStorage.removeItem('shopbill_active_shop_id');
        localStorage.removeItem('shopbill_cached_user');
        localStorage.removeItem('shopbill_cached_shop');
        setToken(null);
        setUser(null);
        setShop(null);
      } else {
        // Network offline, timeout, or server unreachable: Preserve offline shopkeeper session!
        console.info('Operating in offline session mode using cached credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && !user) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const setAuthSession = (authToken: string, authUser: User, authShop: Shop, authPerms?: Permissions) => {
    localStorage.setItem('shopbill_token', authToken);
    if (authUser) {
      localStorage.setItem('shopbill_cached_user', JSON.stringify(authUser));
    }
    if (authShop?.id) {
      localStorage.setItem('shopbill_active_shop_id', authShop.id.toString());
      localStorage.setItem('shopbill_cached_shop', JSON.stringify(authShop));
    }
    setToken(authToken);
    setUser(authUser);
    setShop(authShop);
    setPermissions(authPerms || defaultPermissions);
    setLoading(false);
  };

  const login = async (credentials: any) => {
    const res = await authApi.login(credentials);
    const { token: authToken, user: authUser, shop: authShop, permissions: authPerms } = res.data;
    setAuthSession(authToken, authUser, authShop, authPerms);
  };

  const register = async (data: any) => {
    const res = await authApi.register(data);
    const { token: authToken, user: authUser, shop: authShop, permissions: authPerms } = res.data;
    setAuthSession(authToken, authUser, authShop, authPerms);
  };

  const logout = async () => {
    const oldToken = token;
    // 0ms instant UI reset
    localStorage.removeItem('shopbill_token');
    localStorage.removeItem('shopbill_active_shop_id');
    localStorage.removeItem('shopbill_cached_user');
    localStorage.removeItem('shopbill_cached_shop');
    localStorage.removeItem('shopbill_cached_categories');
    localStorage.removeItem('shopbill_cached_invoices');
    setToken(null);
    setUser(null);
    setShop(null);
    setAccessibleShops([]);
    setLoading(false);

    // Asynchronously revoke token in background without blocking UI
    if (oldToken) {
      authApi.logout().catch(() => {});
    }
  };

  const switchShop = async (shopId: number) => {
    const res = await authApi.switchShop(shopId);
    setShop(res.data.shop);
    localStorage.setItem('shopbill_active_shop_id', shopId.toString());
    await fetchCurrentUser();
  };

  const refreshProfile = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        accessibleShops,
        permissions,
        token,
        loading,
        login,
        register,
        logout,
        setAuthSession,
        switchShop,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
