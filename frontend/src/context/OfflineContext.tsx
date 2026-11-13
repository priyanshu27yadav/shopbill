import React, { createContext, useContext, useEffect, useState } from 'react';
import { syncApi } from '../api';
import { Category, Product, Customer, ProductUnit, TaxRate, InvoiceSetting } from '../types';

interface PendingOfflineBill {
  sync_id: string;
  billing_mode: string;
  invoice_type: string;
  invoice_date: string;
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  item_discount_total?: number;
  overall_discount_amount?: number;
  total_discount: number;
  taxable_amount?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total_tax: number;
  round_off?: number;
  final_amount: number;
  amount_paid: number;
  payment_method: string;
  notes?: string;
  items: any[];
}

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingBillsCount: number;
  pendingBills: PendingOfflineBill[];
  cachedCatalogue: {
    categories: Category[];
    products: Product[];
    customers: Customer[];
    units: ProductUnit[];
    tax_rates: TaxRate[];
    invoice_setting: InvoiceSetting | null;
    last_synced_at: string | null;
  };
  saveOfflineInvoice: (data: any) => Promise<any>;
  syncNow: () => Promise<{ success: boolean; syncedCount: number; message: string }>;
  refreshLocalCatalogue: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingBills, setPendingBills] = useState<PendingOfflineBill[]>(() => {
    try {
      const saved = localStorage.getItem('shopbill_pending_bills');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cachedCatalogue, setCachedCatalogue] = useState<{
    categories: Category[];
    products: Product[];
    customers: Customer[];
    units: ProductUnit[];
    tax_rates: TaxRate[];
    invoice_setting: InvoiceSetting | null;
    last_synced_at: string | null;
  }>(() => {
    try {
      const saved = localStorage.getItem('shopbill_cached_catalogue');
      return saved
        ? JSON.parse(saved)
        : {
            categories: [],
            products: [],
            customers: [],
            units: [],
            tax_rates: [],
            invoice_setting: null,
            last_synced_at: null,
          };
    } catch {
      return {
        categories: [],
        products: [],
        customers: [],
        units: [],
        tax_rates: [],
        invoice_setting: null,
        last_synced_at: null,
      };
    }
  });

  // Track online / offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when regaining connectivity
      syncPendingBills();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingBills]);

  // Persist pending bills
  useEffect(() => {
    localStorage.setItem('shopbill_pending_bills', JSON.stringify(pendingBills));
  }, [pendingBills]);

  // Refresh catalogue cache
  const refreshLocalCatalogue = async () => {
    if (!navigator.onLine) return;
    try {
      const res = await syncApi.pullCatalogue();
      const updated = {
        categories: res.data.categories || [],
        products: res.data.products || [],
        customers: res.data.customers || [],
        units: res.data.units || [],
        tax_rates: res.data.tax_rates || [],
        invoice_setting: res.data.invoice_setting || null,
        last_synced_at: res.data.synced_at || new Date().toISOString(),
      };
      setCachedCatalogue(updated);
      localStorage.setItem('shopbill_cached_catalogue', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not refresh local catalogue snapshot:', e);
    }
  };

  // Sync pending bills to central database
  const syncPendingBills = async (): Promise<{ success: boolean; syncedCount: number; message: string }> => {
    if (pendingBills.length === 0) {
      return { success: true, syncedCount: 0, message: 'No offline bills pending sync.' };
    }
    if (!navigator.onLine) {
      return { success: false, syncedCount: 0, message: 'You are currently offline. Connect to sync.' };
    }

    setIsSyncing(true);
    try {
      const res = await syncApi.pushBills(pendingBills);
      const syncedCount = res.data.synced_count || 0;

      // Clear synced bills from queue
      setPendingBills([]);
      localStorage.removeItem('shopbill_pending_bills');

      // Refresh local catalogue
      await refreshLocalCatalogue();

      setIsSyncing(false);
      return {
        success: true,
        syncedCount,
        message: `Successfully synced ${syncedCount} offline bill(s) to server.`,
      };
    } catch (err: any) {
      setIsSyncing(false);
      return {
        success: false,
        syncedCount: 0,
        message: err.response?.data?.message || 'Sync failed. Will retry automatically.',
      };
    }
  };

  // Save bill offline when internet is unavailable or in offline desktop mode
  const saveOfflineInvoice = async (data: any) => {
    const syncId = 'desk_sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const offlineBill: PendingOfflineBill = {
      ...data,
      sync_id: syncId,
      invoice_date: data.invoice_date || new Date().toISOString(),
    };

    setPendingBills((prev) => [...prev, offlineBill]);

    // Return mock invoice for immediate preview & receipt printing
    const offlineInvNumber = (cachedCatalogue.invoice_setting?.invoice_prefix || 'SB-OFF-') + Math.floor(1000 + Math.random() * 9000);
    return {
      id: Date.now(),
      invoice_number: offlineInvNumber,
      invoice_date: offlineBill.invoice_date,
      billing_mode: offlineBill.billing_mode,
      invoice_type: offlineBill.invoice_type,
      subtotal: offlineBill.subtotal,
      item_discount_total: offlineBill.item_discount_total || 0,
      overall_discount_amount: offlineBill.overall_discount_amount || 0,
      total_discount: offlineBill.total_discount,
      taxable_amount: offlineBill.taxable_amount || offlineBill.subtotal - offlineBill.total_discount,
      cgst_amount: offlineBill.cgst_amount || 0,
      sgst_amount: offlineBill.sgst_amount || 0,
      igst_amount: offlineBill.igst_amount || 0,
      total_tax: offlineBill.total_tax,
      final_amount: offlineBill.final_amount,
      amount_paid: offlineBill.amount_paid,
      balance_due: Math.max(0, offlineBill.final_amount - offlineBill.amount_paid),
      payment_method: offlineBill.payment_method,
      customer_name: offlineBill.customer_name,
      customer_phone: offlineBill.customer_phone,
      items: offlineBill.items,
      is_offline: true,
      sync_id: syncId,
    };
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingBillsCount: pendingBills.length,
        pendingBills,
        cachedCatalogue,
        saveOfflineInvoice,
        syncNow: syncPendingBills,
        refreshLocalCatalogue,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within OfflineProvider');
  return context;
};
