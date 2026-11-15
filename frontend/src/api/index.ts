import apiClient from './client';
import {
  User,
  Shop,
  Category,
  Product,
  Invoice,
  Customer,
  DashboardData,
  ExtractedPdfItem,
  InvoiceSetting,
} from '../types';

export const authApi = {
  getBusinessTypes: () => apiClient.get<any[]>('/business-types'),
  login: (data: any) => apiClient.post<{ message: string; token: string; user: User; shop: Shop; permissions: any }>('/login', data),
  register: (data: any) => apiClient.post<{ message: string; token: string; user: User; shop: Shop; permissions: any; seeded_items_count?: number }>('/register', data),
  me: () => apiClient.get<{ user: User; shop: Shop; accessible_shops: Shop[]; permissions: any }>('/me'),
  logout: () => apiClient.post('/logout'),
  switchShop: (shop_id: number) => apiClient.post<{ message: string; shop: Shop }>('/switch-shop', { shop_id }),
};

export const shopApi = {
  getProfile: () => apiClient.get<Shop>('/shop'),
  updateProfile: (data: any) => apiClient.put<{ message: string; shop: Shop }>('/shop', data),
  listStaff: () => apiClient.get<any[]>('/shop/staff'),
  addStaff: (data: any) => apiClient.post<{ message: string; staff: any }>('/shop/staff', data),
  updateStaff: (id: number, data: any) => apiClient.put<{ message: string; staff: any }>(`/shop/staff/${id}`, data),
  removeStaff: (id: number) => apiClient.delete(`/shop/staff/${id}`),
};

export const categoryApi = {
  list: () => apiClient.get<Category[]>('/categories'),
  create: (data: any) => apiClient.post<{ message: string; category: Category }>('/categories', data),
  applyTemplate: (business_type: string) => apiClient.post<{ message: string; items_created: number }>('/categories/apply-template', { business_type }),
  update: (id: number, data: any) => apiClient.put<{ message: string; category: Category }>(`/categories/${id}`, data),
  delete: (id: number) => apiClient.delete(`/categories/${id}`),
  reorder: (order: { id: number; display_order: number }[]) => apiClient.post('/categories/reorder', { order }),
};

export const productApi = {
  list: (params?: any) => apiClient.get<any>('/products', { params }),
  create: (data: any) => apiClient.post<{ message: string; product: Product }>('/products', data),
  bulkCreate: (items: any[]) => apiClient.post<{ message: string; count: number }>('/products/bulk', { items }),
  update: (id: number, data: any) => apiClient.put<{ message: string; product: Product }>(`/products/${id}`, data),
  delete: (id: number) => apiClient.delete(`/products/${id}`),
  metadata: () => apiClient.get<{ units: any[]; tax_rates: any[]; categories: Category[] }>('/products/metadata'),
};

export const priceListApi = {
  list: () => apiClient.get<any[]>('/pricelists'),
  upload: (formData: FormData) => apiClient.post<{ message: string; upload_id: number; filename: string; total_extracted: number; items: ExtractedPdfItem[]; categories: any[] }>('/pricelists/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  preview: (id: number) => apiClient.get<{ upload: any; items: ExtractedPdfItem[]; categories: any[] }>(`/pricelists/${id}/preview`),
  confirm: (id: number, items: any[]) => apiClient.post<{ message: string; imported_count: number }>(`/pricelists/${id}/confirm`, { items }),
  delete: (id: number) => apiClient.delete(`/pricelists/${id}`),
};

export const invoiceApi = {
  list: (params?: any) => apiClient.get<any>('/invoices', { params }),
  get: (id: number) => apiClient.get<{ invoice: Invoice; settings: InvoiceSetting }>(`/invoices/${id}`),
  create: (data: any) => apiClient.post<{ message: string; invoice: Invoice }>('/invoices', data),
  cancel: (id: number, reason: string) => apiClient.post<{ message: string; invoice: Invoice }>(`/invoices/${id}/cancel`, { reason }),
};

export const customerApi = {
  list: (params?: any) => apiClient.get<any>('/customers', { params }),
  lookupByPhone: (phone: string) => apiClient.get<{
    found: boolean;
    phone: string;
    customer?: Customer;
    summary?: {
      total_shopping: number;
      total_bills: number;
      current_balance: number;
      total_paid: number;
      credit_limit: number;
    };
    recent_bills?: any[];
  }>('/customers/lookup', { params: { phone } }),
  create: (data: any) => apiClient.post<{ message: string; customer: Customer }>('/customers', data),
  get: (id: number) => apiClient.get<{ customer: Customer; invoices: Invoice[]; payments: any[] }>(`/customers/${id}`),
  update: (id: number, data: any) => apiClient.put<{ message: string; customer: Customer }>(`/customers/${id}`, data),
  collectPayment: (id: number, data: any) => apiClient.post<{ message: string; payment: any; updated_balance: number }>(`/customers/${id}/collect-payment`, data),
  delete: (id: number) => apiClient.delete(`/customers/${id}`),
};

export const salesReturnApi = {
  list: (params?: any) => apiClient.get<any>('/sales-returns', { params }),
  get: (id: number) => apiClient.get<{ sales_return: any }>(`/sales-returns/${id}`),
  searchInvoice: (query: string) => apiClient.get<any[]>('/sales-returns/search-invoice', { params: { query } }),
  create: (data: any) => apiClient.post<{ message: string; sales_return: any }>('/sales-returns', data),
};

export const paymentApi = {
  list: (params?: any) => apiClient.get<any>('/payments', { params }),
};

export const dashboardApi = {
  get: () => apiClient.get<DashboardData>('/dashboard'),
};

export const reportApi = {
  dailySales: (date?: string) => apiClient.get<any>('/reports/daily-sales', { params: { date } }),
  monthlySales: (year?: number, month?: number) => apiClient.get<any>('/reports/monthly-sales', { params: { year, month } }),
  itemWiseSales: (params?: any) => apiClient.get<any>('/reports/item-wise-sales', { params }),
  categoryWiseSales: (params?: any) => apiClient.get<any>('/reports/category-wise-sales', { params }),
  discounts: (params?: any) => apiClient.get<any>('/reports/discounts', { params }),
  paymentMethods: (params?: any) => apiClient.get<any>('/reports/payment-methods', { params }),
  customerCredit: () => apiClient.get<any>('/reports/customer-credit'),
  gstSummary: (params?: any) => apiClient.get<any>('/reports/gst-summary', { params }),
};

export const settingsApi = {
  get: () => apiClient.get<{ shop: Shop; shop_settings: Record<string, string>; invoice_settings: InvoiceSetting }>('/settings'),
  updateInvoiceSettings: (data: any) => apiClient.put<{ message: string; invoice_settings: InvoiceSetting }>('/settings/invoice', data),
  uploadQrImage: (file: File) => {
    const formData = new FormData();
    formData.append('qr_image', file);
    return apiClient.post<{ message: string; custom_qr_url: string; invoice_settings: InvoiceSetting }>('/settings/upload-qr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateShopSettings: (settings: Record<string, any>) => apiClient.put<{ message: string; shop_settings: Record<string, string> }>('/settings/shop', { settings }),
};

export const syncApi = {
  pullCatalogue: () => apiClient.get<any>('/sync/pull-catalogue'),
  pushBills: (invoices: any[]) => apiClient.post<any>('/sync/push-bills', { invoices }),
};

export const adminApi = {
  dashboard: () => apiClient.get<any>('/admin/dashboard'),
  shops: (params?: any) => apiClient.get<any>('/admin/shops', { params }),
  toggleShopStatus: (id: number) => apiClient.post<any>(`/admin/shops/${id}/toggle-status`),
};
