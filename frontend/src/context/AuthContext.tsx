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
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [accessibleShops, setAccessibleShops] = useState<Shop[]>([]);
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('shopbill_token'));
  const [loading, setLoading] = useState<boolean>(true);

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
      if (res.data.shop?.id) {
        localStorage.setItem('shopbill_active_shop_id', res.data.shop.id.toString());
      }
    } catch (err) {
      console.error('Failed to authenticate session:', err);
      localStorage.removeItem('shopbill_token');
      localStorage.removeItem('shopbill_active_shop_id');
      setToken(null);
      setUser(null);
      setShop(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (credentials: any) => {
    const res = await authApi.login(credentials);
    const { token: authToken, user: authUser, shop: authShop, permissions: authPerms } = res.data;
    localStorage.setItem('shopbill_token', authToken);
    if (authShop?.id) {
      localStorage.setItem('shopbill_active_shop_id', authShop.id.toString());
    }
    setToken(authToken);
    setUser(authUser);
    setShop(authShop);
    setPermissions(authPerms || defaultPermissions);
  };

  const register = async (data: any) => {
    const res = await authApi.register(data);
    const { token: authToken, user: authUser, shop: authShop, permissions: authPerms } = res.data;
    localStorage.setItem('shopbill_token', authToken);
    if (authShop?.id) {
      localStorage.setItem('shopbill_active_shop_id', authShop.id.toString());
    }
    setToken(authToken);
    setUser(authUser);
    setShop(authShop);
    setPermissions(authPerms || defaultPermissions);
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch (e) {
      // Ignore
    } finally {
      localStorage.removeItem('shopbill_token');
      localStorage.removeItem('shopbill_active_shop_id');
      setToken(null);
      setUser(null);
      setShop(null);
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
