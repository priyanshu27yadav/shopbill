# SHOPBILL — Complete Retail Billing Software (Version 1)

A professional, high-performance retail billing software designed specifically for shopkeepers across diverse retail verticals including **Grocery & Supermarkets, Electronics & Mobile, Clothing & Garments, Footwear, Hardware & Electricals, Cosmetics, Stationery, and General Stores**.

Built with a unified modern architecture that runs seamlessly as both a **Web Application** and a **Windows Desktop Application** with **Offline SQLite Billing & Central MySQL Synchronization**.

---

## 🚀 Key Highlights & Architecture

- **Backend:** PHP Laravel 11/12 (REST API, Sanctum Auth, Eloquent ORM, Strict Multi-Tenant Shop Isolation)
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons
- **Database (Central):** MySQL (`shopbill_db` with 21 structured relational tables)
- **Desktop Application:** Tauri (Windows Native Shell)
- **Desktop Offline Storage:** SQLite (`shopbill_offline.db` with idempotent sync engine)
- **UI/UX:** Ultra-fast keyboard-friendly POS billing screen (`F2` shortcut), Light & Dark mode, thermal print support

> **Important Note:** As per Version 1 specifications, ShopBill is strictly a **billing-focused application**. Stock/inventory management and warehouse tracking are deliberately excluded in Version 1 to guarantee lightning-fast invoicing without blocking shopkeepers.

---

## 📦 Feature Overview

### 1. User Accounts & Multi-Shop Management
- **Shopkeeper Registration & Login:** Create account with business details.
- **Multi-Shop Separation:** Strict tenant authorization (`X-Shop-Id`) ensuring each shop's products, invoices, customers, and reports are 100% isolated.
- **Staff / Cashier Roles:** Granular permissions (`can_give_discount`, `can_view_reports`, `can_manage_items`, `can_cancel_bills`).
- **Super Admin Portal:** Platform-wide oversight of registered stores, active status toggle, and GMV volume.

### 2. Category-Wise Product Management
- Pre-loaded & custom categories for **Grocery, Electronics, Clothing, Footwear, Hardware, Cosmetics, Stationery, and Beverages & Snacks**.
- Items with: Name, Category, Unit (pcs, kg, g, L, ml, m, pkt, box, dz), Default Price, MRP, GST rate (0%, 5%, 12%, 18%, 28%), and HSN/SAC codes.

### 3. Two Methods to Create the Item Price List
- **Option A: Upload PDF Price List (with OCR & Extraction Heuristics):**
  - Upload supplier / wholesaler PDF price lists.
  - Automatically identifies item names, categories, units, prices, GST rates, and HSN codes.
  - Interactive staging preview screen with **confidence score badges**.
  - **Uncertain or low-confidence prices are clearly highlighted in amber/orange** for shopkeeper verification.
  - Inline editing, row deletion, and adding missing items.
  - Single-click confirmation before importing to database catalogue.
- **Option B: Manual Item Entry & Bulk Grid:**
  - Fast single item modal.
  - **Spreadsheet-style Bulk Entry Grid** for entering dozens of products rapidly.

### 4. Billing System — Two Distinct Billing Modes (Core Feature)
- **Mode 1: Catalogue-Based Billing:**
  - Quick category pills + instant search (`/` shortcut).
  - One-click addition to cart.
  - Auto-fetches default saved price.
  - Real-time subtotal, discount, and tax calculations.
- **Mode 2: Custom / Personal Billing:**
  - For shops where the shopkeeper wishes to personally price materials on the spot.
  - Enter description, custom manual price, quantity, and unit.
  - **Crucial Rule Guarantee:** Manually entered custom prices **never** alter the saved catalogue price.
  - Optional checkbox: *"Save to my catalogue for future bills"* to capture new items on the fly.
- **Hybrid Flexibility:** An invoice can contain both catalogue items and custom items in the same bill.

### 5. Fast Keyboard-Friendly Billing Screen
- Sequential invoice number generation per shop.
- Customer autocomplete with phone search and **instant Udhaar / balance due warning**.
- Item-level discounts (flat amount or percentage).
- Overall bill discount (flat amount or percentage).
- Real-time GST calculation (CGST + SGST for intra-state, IGST for inter-state).
- Automatic Round-Off.
- Payment Methods: **Cash, UPI, Card, Bank Transfer, and Credit / Udhaar**.
- Dynamic **UPI QR Code** generated live on screen for instant customer smartphone scanning.
- Instant recalculation of Amount Received, Change Due, or Balance Due.

### 6. GST vs Non-GST Invoicing
- **GST Billing:** Configurable shop GSTIN, customer GSTIN, HSN codes, tax breakdown tables, tax-inclusive calculations.
- **Non-GST Billing:** Clean retail cash memo / bill of supply with zero tax clutter.

### 7. Professional Bill Generation & Printing
- **Supported Print Layouts:**
  - **80mm Thermal Receipt** (Standard POS printers like Epson, TVS, Citizen).
  - **58mm Compact Thermal Receipt** (Small mobile/Bluetooth POS printers).
  - **Modern A4 Full Page Invoice**.
- **WhatsApp Direct Sharing:** Opens WhatsApp Web / App with pre-formatted invoice summary and link.
- **Invoice Immutability:** Historical integrity preserved — cancellations require a reason and issue credit adjustments rather than silent database mutation.

### 8. Customer & Udhaar Management (Khata)
- Customer profiles with purchase history and ledger.
- Credit balance tracking (receivables owed to the shop).
- One-click **"Collect Payment"** to settle outstanding credit balances with receipt generation.

### 9. Shopkeeper Dashboard
- Today's Bills Count & Sales.
- Monthly Revenue & Discounts.
- 7-Day Visual Sales Trend.
- Payment Method Distribution (Cash vs UPI vs Card vs Udhaar).
- GST Tax Summary (CGST, SGST, Total Tax).
- Most Frequently Billed Items.
- Top Udhaar Debtor Accounts.

### 10. 8 Comprehensive Reports
1. **Daily Sales Report**
2. **Monthly Sales Report**
3. **Item-Wise Sales Report**
4. **Category-Wise Sales Report**
5. **Discount Utilization Report**
6. **Payment Methods Report**
7. **Customer Credit (Udhaar) Report**
8. **GST Sales Summary (GSTR-1 Ready)**
- **Export to CSV / Excel** and printable views.

### 11. Central MySQL Database (`shopbill_db`)
The schema contains all 21 required relational tables:
1. `users`
2. `shops`
3. `shop_users`
4. `roles`
5. `categories`
6. `products`
7. `product_units`
8. `price_lists`
9. `price_list_uploads`
10. `invoices`
11. `invoice_items`
12. `customers`
13. `payments`
14. `payment_allocations`
15. `discounts`
16. `tax_rates`
17. `shop_settings`
18. `invoice_settings`
19. `subscriptions`
20. `subscription_payments`
21. `audit_logs`

### 12. Windows Desktop Application & Offline SQLite Synchronization
- **Tauri Windows App:** Native Windows desktop application wrapper.
- **Offline SQLite DB:** In offline mode, bills are saved locally with a client-generated UUID (`sync_id`).
- **Idempotent Sync Engine:** When connected, bills push to the central Laravel API, preventing duplicates and updating inventory/customer balances.

---

## 🛠️ Quick Installation & Setup

### Prerequisites
- Windows OS (Windows 10 / 11)
- PHP 8.2+ with `pdo_mysql`, `pdo_sqlite`, `curl`, `mbstring`, `zip`, `fileinfo` enabled (e.g. XAMPP)
- MySQL Server (Port 3306)
- Composer
- Node.js (v18+) and npm

### Automated Setup (Recommended)
Simply double-click:
```bat
setup.bat
```
This script will:
1. Validate system tools.
2. Configure `.env` with MySQL `shopbill_db`.
3. Install Laravel dependencies via Composer.
4. Run all 20 migrations and seed rich sample data.
5. Install npm dependencies and build the frontend bundle.

### Starting the Application
Double click:
```bat
start_all.bat
```
This launches:
- Backend API at: `http://localhost:8000`
- Frontend Web App at: `http://localhost:5173`
- Opens your default web browser automatically.

---

## 🔑 Pre-Configured Test Accounts

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Shopkeeper (Owner)** | `shopkeeper@shopbill.com` | `password123` | Full store owner access (Billing, Products, Reports, Settings) |
| **Cashier (Staff)** | `cashier@shopbill.com` | `password123` | Fast billing POS and customer search only |
| **Super Administrator** | `admin@shopbill.com` | `password123` | Platform oversight, all registered stores, tenant management |

---

## 🧪 Testing Option A: PDF Price List Upload

A sample PDF price list is included in:
`sample_data/sample_price_list.pdf`

To test:
1. Navigate to **"Upload PDF Price List"** in the sidebar.
2. Select `sample_data/sample_price_list.pdf`.
3. Click **"Start Extraction & Preview"**.
4. The system will extract 16 retail products across Grocery, Electronics, Stationery, and Hardware.
5. Notice the **Confidence badges** and verify the extracted prices.
6. Click **"Confirm & Save All to Catalogue"** to import them into your active shop catalogue!

---

## 🧪 Testing Billing Modes

1. Go to **Fast Billing (F2)**.
2. **Mode 1 (Catalogue-Based):** Click category tabs (Grocery, Electronics, Clothing, etc.), click any product to add to cart, adjust quantity, and observe real-time tax and subtotal calculation.
3. **Mode 2 (Custom / Personal):** Click *"2. Custom / Personal Pricing"*, type custom item name, custom price, quantity, and unit. Click *"Add Custom Item to Bill"*. Notice that your custom price is applied without modifying your catalogue database.
4. Select payment method (Cash, UPI with dynamic QR code, or Credit/Udhaar).
5. Click **"Generate & Print Bill"** to view the professional 80mm thermal receipt, print it, or test WhatsApp sharing.

---

## 📁 Project Structure

```
d:\billingsaas\
├── backend/                  # Laravel 11/12 REST API
│   ├── app/
│   │   ├── Http/Controllers/ # Auth, Invoice, Product, PriceList, Shop, Report, Admin, Sync
│   │   ├── Models/          # 21 Eloquent Models
│   │   ├── Services/        # PdfPriceListExtractor (OCR & text heuristics)
│   │   └── Middleware/      # IdentifyShop (Multi-tenant isolation)
│   ├── database/
│   │   ├── migrations/      # 20 Database Migrations
│   │   └── seeders/         # DatabaseSeeder with realistic retail store data
│   └── routes/api.php       # 55 API Endpoints
├── frontend/                 # React 19 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── api/             # Axios client & typed API SDK
│   │   ├── context/         # AuthContext, ThemeContext, OfflineContext
│   │   ├── components/      # BillingScreen, Products, PriceLists, Customers, Reports, Settings
│   │   └── types/           # TypeScript interfaces
│   └── src-tauri/           # Tauri Windows Desktop Application
│       ├── src/main.rs      # Rust Desktop application entry
│       ├── tauri.conf.json  # Window & SQLite plugin configuration
│       └── Cargo.toml       # Desktop dependencies
├── sample_data/              # Sample test PDF price list
├── setup.bat                 # One-click environment installer
├── start_all.bat             # One-click launcher (API + Web)
├── start_desktop.bat         # Desktop Tauri launcher
└── README.md                 # Complete documentation
```

---

## 📄 License & Credits
Developed for retail shopkeepers with speed, simplicity, and rock-solid reliability in mind.
Version 1.0.0 (Production-Ready).
