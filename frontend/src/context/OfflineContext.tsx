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
  isManualOffline: boolean;
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
  toggleOfflineMode: () => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkOnline, setNetworkOnline] = useState<boolean>(navigator.onLine);
  const [isManualOffline, setIsManualOffline] = useState<boolean>(() => {
    return localStorage.getItem('shopbill_manual_offline') === 'true';
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingBills, setPendingBills] = useState<PendingOfflineBill[]>(() => {
    try {
      const saved = localStorage.getItem('shopbill_pending_bills');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isOnline = networkOnline && !isManualOffline;

  const toggleOfflineMode = () => {
    setIsManualOffline((prev) => {
      const next = !prev;
      localStorage.setItem('shopbill_manual_offline', String(next));
      if (!next && networkOnline) {
        // Trigger sync when manually toggling back online
        setTimeout(() => syncPendingBills(), 100);
      }
      return next;
    });
  };

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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.products && parsed.products.length > 0) {
          return parsed;
        }
      }
      // Fallback: merge individually cached products, categories, customers
      const prods = JSON.parse(localStorage.getItem('shopbill_cached_products') || '[]');
      const cats = JSON.parse(localStorage.getItem('shopbill_cached_categories') || '[]');
      const custs = JSON.parse(localStorage.getItem('shopbill_cached_customers') || '[]');
      return {
        categories: cats,
        products: prods,
        customers: custs,
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
      setNetworkOnline(true);
      if (!isManualOffline) {
        syncPendingBills();
        refreshLocalCatalogue();
      }
    };
    const handleOffline = () => {
      setNetworkOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync & cache refresh if online
    if (navigator.onLine && !isManualOffline) {
      refreshLocalCatalogue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isManualOffline]);

  // Persist pending bills
  useEffect(() => {
    localStorage.setItem('shopbill_pending_bills', JSON.stringify(pendingBills));
  }, [pendingBills]);

  // Refresh catalogue cache
  const refreshLocalCatalogue = async () => {
    if (!navigator.onLine || isManualOffline) return;
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

      // Also persist individual caches for fast offline lookup
      if (updated.products?.length) {
        localStorage.setItem('shopbill_cached_products', JSON.stringify(updated.products));
      }
      if (updated.categories?.length) {
        localStorage.setItem('shopbill_cached_categories', JSON.stringify(updated.categories));
      }
      if (updated.customers?.length) {
        localStorage.setItem('shopbill_cached_customers', JSON.stringify(updated.customers));
      }
    } catch (e) {
      console.warn('Could not refresh local catalogue snapshot:', e);
    }
  };

  // Sync pending bills to central database
  const syncPendingBills = async (): Promise<{ success: boolean; syncedCount: number; message: string }> => {
    const billsToSync = JSON.parse(localStorage.getItem('shopbill_pending_bills') || '[]');
    if (billsToSync.length === 0) {
      return { success: true, syncedCount: 0, message: 'No offline bills pending sync.' };
    }
    if (!navigator.onLine || isManualOffline) {
      return { success: false, syncedCount: 0, message: 'You are currently offline. Connect to sync.' };
    }

    setIsSyncing(true);
    try {
      const res = await syncApi.pushBills(billsToSync);
      const syncedCount = res.data.synced_count || 0;
      const syncedList = res.data.synced || [];

      // Clear synced bills from queue
      setPendingBills([]);
      localStorage.removeItem('shopbill_pending_bills');

      // Update cached invoices history with real server invoice numbers
      try {
        const cachedInvoices = JSON.parse(localStorage.getItem('shopbill_cached_invoices') || '[]');
        const updatedInvoices = cachedInvoices.map((inv: any) => {
          const match = syncedList.find((s: any) => s.sync_id === inv.sync_id);
          if (match) {
            return {
              ...inv,
              id: match.invoice_id,
              invoice_number: match.invoice_number,
              is_offline: false,
              is_synced: true,
            };
          }
          return inv;
        });
        localStorage.setItem('shopbill_cached_invoices', JSON.stringify(updatedInvoices));
        window.dispatchEvent(new CustomEvent('shopbill_bills_synced'));
      } catch {}

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

    // Return realistic mock invoice for immediate preview & receipt printing
    const prefix = cachedCatalogue.invoice_setting?.invoice_prefix || 'SB-';
    const offlineInvNumber = `${prefix}OFF-${Math.floor(1000 + Math.random() * 9000)}`;

    const mockInvoice: any = {
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
      customer_name: offlineBill.customer_name || 'Walk-in Customer',
      customer_phone: offlineBill.customer_phone || null,
      items: offlineBill.items,
      is_offline: true,
      sync_id: syncId,
      status: 'completed',
    };

    // Save to local invoices list so Invoice History shows this offline bill immediately
    try {
      const cachedInvoices = JSON.parse(localStorage.getItem('shopbill_cached_invoices') || '[]');
      localStorage.setItem('shopbill_cached_invoices', JSON.stringify([mockInvoice, ...cachedInvoices]));
    } catch {}

    return mockInvoice;
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isManualOffline,
        isSyncing,
        pendingBillsCount: pendingBills.length,
        pendingBills,
        cachedCatalogue,
        saveOfflineInvoice,
        syncNow: syncPendingBills,
        refreshLocalCatalogue,
        toggleOfflineMode,
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
