export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'shopkeeper' | 'staff';
  current_shop_id?: number;
}

export interface Shop {
  id: number;
  user_id: number;
  name: string;
  business_type: string;
  tagline?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  is_gst_registered: boolean;
  logo_url?: string;
  currency_symbol: string;
  status: 'active' | 'suspended';
  created_at?: string;
}

export interface Permissions {
  role: 'owner' | 'manager' | 'cashier' | 'super_admin';
  can_give_discount: boolean;
  can_view_reports: boolean;
  can_manage_items: boolean;
  can_cancel_bills: boolean;
}

export interface Category {
  id: number;
  shop_id: number;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  display_order: number;
  is_active: boolean;
  products_count?: number;
}

export interface ProductUnit {
  id: number;
  name: string;
  short_code: string;
  allow_decimal: boolean;
}

export interface TaxRate {
  id: number;
  name: string;
  rate: string | number;
  cgst_rate: string | number;
  sgst_rate: string | number;
  igst_rate: string | number;
  is_default: boolean;
}

export interface Product {
  id: number;
  shop_id: number;
  category_id: number;
  name: string;
  barcode?: string;
  sku?: string;
  unit: string;
  unit_id?: number;
  default_price: string | number;
  mrp?: string | number;
  gst_rate: string | number;
  hsn_code?: string;
  is_tax_inclusive: boolean;
  description?: string;
  is_active: boolean;
  source: string;
  category?: Category;
  product_unit?: ProductUnit;
}

export interface InvoiceItem {
  id?: number;
  product_id?: number | null;
  item_name: string;
  category_name?: string;
  is_custom_item?: boolean;
  save_to_catalogue?: boolean;
  hsn_code?: string;
  unit: string;
  quantity: number;
  unit_price: number;
  discount_type?: 'fixed' | 'percentage';
  discount_value?: number;
  discount_amount?: number;
  subtotal: number;
  gst_rate: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  tax_amount?: number;
  total_amount: number;
}

export interface Invoice {
  id: number;
  shop_id: number;
  user_id: number;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_gstin?: string;
  customer_address?: string;
  invoice_number: string;
  invoice_date: string;
  billing_mode: 'catalogue' | 'custom' | 'mixed';
  invoice_type: 'retail' | 'gst';
  subtotal: string | number;
  item_discount_total: string | number;
  overall_discount_type: 'fixed' | 'percentage';
  overall_discount_value: string | number;
  overall_discount_amount: string | number;
  total_discount: string | number;
  taxable_amount: string | number;
  cgst_amount: string | number;
  sgst_amount: string | number;
  igst_amount: string | number;
  total_tax: string | number;
  round_off: string | number;
  final_amount: string | number;
  amount_paid: string | number;
  balance_due: string | number;
  payment_status: 'paid' | 'partial' | 'unpaid' | 'credit';
  payment_method: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'credit' | 'mixed';
  notes?: string;
  status: 'completed' | 'cancelled';
  cancellation_reason?: string;
  cancelled_at?: string;
  sync_id?: string;
  is_offline?: boolean;
  items_count?: number;
  items?: InvoiceItem[];
  customer?: Customer;
  user?: { id: number; name: string };
  payments?: any[];
  shop?: Shop;
}

export interface Customer {
  id: number;
  shop_id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  credit_limit: string | number;
  current_balance: string | number;
  total_purchases: string | number;
  notes?: string;
}

export interface SalesReturnItem {
  id?: number;
  sales_return_id?: number;
  invoice_item_id?: number;
  product_id?: number | null;
  item_name: string;
  unit: string;
  unit_price: number;
  gst_rate: number;
  tax_amount: number;
  quantity_returned: number;
  refund_subtotal: number;
  refund_total: number;
}

export interface SalesReturn {
  id: number;
  shop_id: number;
  user_id: number;
  invoice_id: number;
  customer_id?: number | null;
  return_number: string;
  return_date: string;
  original_invoice_number: string;
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  tax_amount: number;
  refund_amount: number;
  refund_method: 'cash' | 'upi' | 'khata_adjustment' | 'store_credit';
  reason?: string;
  restock_inventory: boolean;
  items?: SalesReturnItem[];
  customer?: Customer;
  invoice?: Invoice;
  user?: { id: number; name: string };
  shop?: Shop;
}

export interface InvoiceSetting {
  id: number;
  shop_id: number;
  invoice_prefix: string;
  next_invoice_number: number;
  template: 'standard' | 'thermal_58mm' | 'thermal_80mm' | 'modern_a4';
  show_gst: boolean;
  show_hsn: boolean;
  show_shop_logo: boolean;
  terms_and_conditions?: string;
  footer_message?: string;
  show_upi_qr: boolean;
  upi_id?: string;
  custom_qr_url?: string;
}

export interface ExtractedPdfItem {
  temp_id: string;
  line_number: number;
  name: string;
  category: string;
  unit: string;
  default_price: string;
  mrp: string;
  gst_rate: number;
  hsn_code?: string;
  confidence: number;
  uncertain_price: boolean;
  raw_line?: string;
}

export interface DashboardData {
  today: {
    bills_count: number;
    sales: number;
    discounts: number;
  };
  month: {
    bills_count: number;
    sales: number;
    discounts: number;
  };
  gst_summary: {
    total_tax: number;
    cgst: number;
    sgst: number;
    igst: number;
    taxable_amount: number;
  };
  payment_methods: { payment_method: string; total_amount: string; count: number }[];
  customer_outstanding: number;
  top_debtors: Customer[];
  top_items: { item_name: string; unit: string; total_qty: string; total_revenue: string; bill_count: number }[];
  recent_bills: Invoice[];
  sales_trend: { date: string; day: string; sales: number }[];
}

export interface ShopPaymentAccount {
  id: number;
  shop_id: number;
  provider: 'cashfree' | 'razorpay';
  connection_type: 'existing' | 'new_onboarding';
  environment: 'sandbox' | 'production';
  status: 'active' | 'pending_verification' | 'under_review' | 'action_required' | 'disconnected';
  is_primary: boolean;
  merchant_id?: string;
  account_id?: string;
  app_id?: string;
  has_secret?: boolean;
  masked_app_id?: string;
  business_name?: string;
  business_type?: string;
  business_category?: string;
  shop_address?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  owner_name?: string;
  owner_mobile?: string;
  owner_email?: string;
  owner_pan_masked?: string;
  bank_account_holder?: string;
  bank_account_number_masked?: string;
  bank_ifsc?: string;
  bank_name?: string;
  application_reference?: string;
  kyc_status: 'not_started' | 'in_progress' | 'verified' | 'needs_clarification';
  onboarding_url?: string;
  verified_at?: string;
  meta?: any;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentSettingsResponse {
  shop_id: number;
  shop_name: string;
  accounts: ShopPaymentAccount[];
  active_account: ShopPaymentAccount | null;
  prefill: {
    shop_name: string;
    business_type: string;
    business_category: string;
    shop_address: string;
    state: string;
    district: string;
    city: string;
    pincode: string;
    owner_name: string;
    owner_mobile: string;
    owner_email: string;
    gstin?: string;
  };
  providers: {
    [key: string]: {
      name: string;
      tagline: string;
      logo: string;
      supported_methods: string[];
      settlement_cycle: string;
    };
  };
}
