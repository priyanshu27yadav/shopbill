<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\InvoiceSetting;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\Role;
use App\Models\Shop;
use App\Models\ShopSetting;
use App\Models\ShopUser;
use App\Models\Subscription;
use App\Models\TaxRate;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles
        $roles = [
            ['name' => 'super_admin', 'display_name' => 'Super Administrator', 'description' => 'Platform administrator with full control'],
            ['name' => 'shop_owner', 'display_name' => 'Shop Owner', 'description' => 'Owner of the retail business with full shop permissions'],
            ['name' => 'shop_manager', 'display_name' => 'Store Manager', 'description' => 'Can manage items, view reports and create bills'],
            ['name' => 'cashier', 'display_name' => 'Billing Staff / Cashier', 'description' => 'Front desk cashier restricted to billing screen and customer search'],
        ];
        foreach ($roles as $r) {
            Role::firstOrCreate(['name' => $r['name']], $r);
        }

        // 2. Standard Tax Rates
        $standardTaxes = [
            ['name' => 'GST 0%', 'rate' => 0.00, 'cgst_rate' => 0.00, 'sgst_rate' => 0.00, 'igst_rate' => 0.00, 'is_default' => true],
            ['name' => 'GST 5%', 'rate' => 5.00, 'cgst_rate' => 2.50, 'sgst_rate' => 2.50, 'igst_rate' => 5.00, 'is_default' => false],
            ['name' => 'GST 12%', 'rate' => 12.00, 'cgst_rate' => 6.00, 'sgst_rate' => 6.00, 'igst_rate' => 12.00, 'is_default' => false],
            ['name' => 'GST 18%', 'rate' => 18.00, 'cgst_rate' => 9.00, 'sgst_rate' => 9.00, 'igst_rate' => 18.00, 'is_default' => false],
            ['name' => 'GST 28%', 'rate' => 28.00, 'cgst_rate' => 14.00, 'sgst_rate' => 14.00, 'igst_rate' => 28.00, 'is_default' => false],
        ];
        foreach ($standardTaxes as $tax) {
            TaxRate::firstOrCreate(['name' => $tax['name'], 'shop_id' => null], $tax);
        }

        // 3. Standard Product Units
        $standardUnits = [
            ['name' => 'Piece', 'short_code' => 'pcs', 'allow_decimal' => false],
            ['name' => 'Kilogram', 'short_code' => 'kg', 'allow_decimal' => true],
            ['name' => 'Gram', 'short_code' => 'g', 'allow_decimal' => true],
            ['name' => 'Litre', 'short_code' => 'L', 'allow_decimal' => true],
            ['name' => 'Millilitre', 'short_code' => 'ml', 'allow_decimal' => true],
            ['name' => 'Metre', 'short_code' => 'm', 'allow_decimal' => true],
            ['name' => 'Packet', 'short_code' => 'pkt', 'allow_decimal' => false],
            ['name' => 'Box', 'short_code' => 'box', 'allow_decimal' => false],
            ['name' => 'Dozen', 'short_code' => 'dz', 'allow_decimal' => false],
            ['name' => 'Quintal', 'short_code' => 'qtl', 'allow_decimal' => true],
        ];
        foreach ($standardUnits as $u) {
            ProductUnit::firstOrCreate(['short_code' => $u['short_code'], 'shop_id' => null], $u);
        }

        // 4. Super Admin User
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@shopbill.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password123'),
                'phone' => '9876543210',
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );

        // 5. Primary Shopkeeper User
        $shopkeeper = User::firstOrCreate(
            ['email' => 'shopkeeper@shopbill.com'],
            [
                'name' => 'Rajesh Sharma',
                'password' => Hash::make('password123'),
                'phone' => '9820012345',
                'role' => 'shopkeeper',
                'is_active' => true,
            ]
        );

        // 6. Primary Shop: City Supermarket & General Store
        $shop = Shop::firstOrCreate(
            ['name' => 'City Mart & General Store', 'user_id' => $shopkeeper->id],
            [
                'business_type' => 'grocery',
                'tagline' => 'Quality Goods at Honest Prices',
                'address_line1' => 'Shop No. 14, Main Commercial Complex',
                'address_line2' => 'MG Road, Sector 18',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'pincode' => '560001',
                'phone' => '9820012345',
                'email' => 'contact@citymart.in',
                'gstin' => '29AABCU9603R1Z7',
                'is_gst_registered' => true,
                'currency_symbol' => '₹',
                'status' => 'active',
            ]
        );

        $shopkeeper->update(['current_shop_id' => $shop->id]);

        $ownerRole = Role::where('name', 'shop_owner')->first();
        ShopUser::firstOrCreate(
            ['shop_id' => $shop->id, 'user_id' => $shopkeeper->id],
            [
                'role_id' => $ownerRole ? $ownerRole->id : null,
                'role' => 'owner',
                'can_give_discount' => true,
                'can_view_reports' => true,
                'can_manage_items' => true,
                'can_cancel_bills' => true,
                'status' => 'active',
            ]
        );

        // 7. Cashier Staff Account
        $cashierUser = User::firstOrCreate(
            ['email' => 'cashier@shopbill.com'],
            [
                'name' => 'Sunil Kumar (Cashier)',
                'password' => Hash::make('password123'),
                'phone' => '9820054321',
                'role' => 'staff',
                'is_active' => true,
                'current_shop_id' => $shop->id,
            ]
        );

        $cashierRole = Role::where('name', 'cashier')->first();
        ShopUser::firstOrCreate(
            ['shop_id' => $shop->id, 'user_id' => $cashierUser->id],
            [
                'role_id' => $cashierRole ? $cashierRole->id : null,
                'role' => 'cashier',
                'can_give_discount' => true,
                'can_view_reports' => false,
                'can_manage_items' => false,
                'can_cancel_bills' => false,
                'status' => 'active',
            ]
        );

        // 8. Invoice Settings for Shop
        InvoiceSetting::firstOrCreate(
            ['shop_id' => $shop->id],
            [
                'invoice_prefix' => 'SB-2026-',
                'next_invoice_number' => 1008,
                'template' => 'standard',
                'show_gst' => true,
                'show_hsn' => true,
                'show_shop_logo' => true,
                'terms_and_conditions' => "1. Goods once sold will not be taken back without original bill.\n2. In case of manufacturing defect, return within 7 days.\n3. All disputes subject to local jurisdiction.",
                'footer_message' => 'Thank you for shopping with City Mart! Have a great day!',
                'show_upi_qr' => true,
                'upi_id' => 'citymart@upi',
            ]
        );

        // 9. Shop Settings
        $settings = [
            'print_receipt_type' => 'thermal_80mm', // standard, thermal_58mm, thermal_80mm
            'tax_mode' => 'inclusive', // inclusive or exclusive
            'round_off_bills' => 'yes',
            'state_code' => '29',
        ];
        foreach ($settings as $k => $v) {
            ShopSetting::firstOrCreate(['shop_id' => $shop->id, 'key' => $k], ['value' => $v]);
        }

        // 10. Subscriptions
        Subscription::firstOrCreate(
            ['shop_id' => $shop->id],
            [
                'plan_name' => 'pro_yearly',
                'start_date' => Carbon::now()->subMonths(1)->toDateString(),
                'end_date' => Carbon::now()->addMonths(11)->toDateString(),
                'status' => 'active',
            ]
        );

        // 11. Categories (Grocery, Electronics, Clothing, Footwear, Hardware, Cosmetics, Stationery)
        $categoriesData = [
            ['name' => 'Grocery', 'slug' => 'grocery', 'description' => 'Daily staples, spices, rice, pulses, and oil', 'icon' => 'ShoppingBag', 'color' => '#10b981', 'display_order' => 1],
            ['name' => 'Electronics', 'slug' => 'electronics', 'description' => 'Cables, chargers, bulbs, and gadgets', 'icon' => 'Zap', 'color' => '#3b82f6', 'display_order' => 2],
            ['name' => 'Clothing', 'slug' => 'clothing', 'description' => 'Readymade garments, shirts, t-shirts, and jeans', 'icon' => 'Shirt', 'color' => '#8b5cf6', 'display_order' => 3],
            ['name' => 'Footwear', 'slug' => 'footwear', 'description' => 'Sandals, slippers, formal and sports shoes', 'icon' => 'Footprints', 'color' => '#ec4899', 'display_order' => 4],
            ['name' => 'Hardware', 'slug' => 'hardware', 'description' => 'Fasteners, electrical switches, tape, and tools', 'icon' => 'Wrench', 'color' => '#f59e0b', 'display_order' => 5],
            ['name' => 'Cosmetics', 'slug' => 'cosmetics', 'description' => 'Skin care, soaps, shampoos, and personal hygiene', 'icon' => 'Sparkles', 'color' => '#06b6d4', 'display_order' => 6],
            ['name' => 'Stationery', 'slug' => 'stationery', 'description' => 'Notebooks, pens, markers, and office supplies', 'icon' => 'BookOpen', 'color' => '#ef4444', 'display_order' => 7],
            ['name' => 'Beverages & Snacks', 'slug' => 'beverages-snacks', 'description' => 'Soft drinks, juices, biscuits, and chips', 'icon' => 'Coffee', 'color' => '#14b8a6', 'display_order' => 8],
        ];

        $catMap = [];
        foreach ($categoriesData as $c) {
            $cat = Category::firstOrCreate(['shop_id' => $shop->id, 'name' => $c['name']], $c);
            $catMap[$c['name']] = $cat->id;
        }

        // 12. Products for each category
        $productsData = [
            // Grocery
            ['name' => 'Basmati Rice Premium (1kg)', 'cat' => 'Grocery', 'unit' => 'kg', 'price' => 120.00, 'mrp' => 140.00, 'gst' => 0.00, 'hsn' => '1006'],
            ['name' => 'Toor Dal Supreme (1kg)', 'cat' => 'Grocery', 'unit' => 'kg', 'price' => 165.00, 'mrp' => 180.00, 'gst' => 0.00, 'hsn' => '0713'],
            ['name' => 'Sunflower Cooking Oil (1L)', 'cat' => 'Grocery', 'unit' => 'L', 'price' => 145.00, 'mrp' => 160.00, 'gst' => 5.00, 'hsn' => '1512'],
            ['name' => 'Whole Wheat Atta (5kg)', 'cat' => 'Grocery', 'unit' => 'pkt', 'price' => 240.00, 'mrp' => 275.00, 'gst' => 0.00, 'hsn' => '1101'],
            ['name' => 'Tata Iodized Salt (1kg)', 'cat' => 'Grocery', 'unit' => 'pkt', 'price' => 28.00, 'mrp' => 28.00, 'gst' => 0.00, 'hsn' => '2501'],
            ['name' => 'Refined Sugar (1kg)', 'cat' => 'Grocery', 'unit' => 'kg', 'price' => 46.00, 'mrp' => 50.00, 'gst' => 0.00, 'hsn' => '1701'],
            ['name' => 'Red Chilli Powder (200g)', 'cat' => 'Grocery', 'unit' => 'pkt', 'price' => 65.00, 'mrp' => 75.00, 'gst' => 5.00, 'hsn' => '0904'],

            // Electronics
            ['name' => 'Fast USB-C Charging Cable 65W', 'cat' => 'Electronics', 'unit' => 'pcs', 'price' => 299.00, 'mrp' => 499.00, 'gst' => 18.00, 'hsn' => '8544'],
            ['name' => '20W PD Wall Charger Adapter', 'cat' => 'Electronics', 'unit' => 'pcs', 'price' => 450.00, 'mrp' => 699.00, 'gst' => 18.00, 'hsn' => '8504'],
            ['name' => 'Philips LED Bulb 9W Cool White', 'cat' => 'Electronics', 'unit' => 'pcs', 'price' => 95.00, 'mrp' => 140.00, 'gst' => 12.00, 'hsn' => '8539'],
            ['name' => 'Extension Cord 4-Way with Surge', 'cat' => 'Electronics', 'unit' => 'pcs', 'price' => 380.00, 'mrp' => 550.00, 'gst' => 18.00, 'hsn' => '8537'],
            ['name' => 'Wireless Bluetooth Earbuds Pro', 'cat' => 'Electronics', 'unit' => 'pcs', 'price' => 899.00, 'mrp' => 1499.00, 'gst' => 18.00, 'hsn' => '8518'],

            // Clothing
            ['name' => 'Men Cotton Crew T-Shirt (M)', 'cat' => 'Clothing', 'unit' => 'pcs', 'price' => 499.00, 'mrp' => 799.00, 'gst' => 5.00, 'hsn' => '6109'],
            ['name' => 'Classic Denim Jeans 32"', 'cat' => 'Clothing', 'unit' => 'pcs', 'price' => 1199.00, 'mrp' => 1799.00, 'gst' => 12.00, 'hsn' => '6203'],
            ['name' => 'Formal Cotton Slim Shirt', 'cat' => 'Clothing', 'unit' => 'pcs', 'price' => 850.00, 'mrp' => 1299.00, 'gst' => 5.00, 'hsn' => '6205'],
            ['name' => 'Ankle Cotton Socks (Pack of 3)', 'cat' => 'Clothing', 'unit' => 'pkt', 'price' => 180.00, 'mrp' => 249.00, 'gst' => 5.00, 'hsn' => '6115'],

            // Footwear
            ['name' => 'Comfort Flip Flop Slippers 8', 'cat' => 'Footwear', 'unit' => 'pcs', 'price' => 250.00, 'mrp' => 399.00, 'gst' => 5.00, 'hsn' => '6402'],
            ['name' => 'Casual Walking Canvas Shoes', 'cat' => 'Footwear', 'unit' => 'pcs', 'price' => 799.00, 'mrp' => 1299.00, 'gst' => 12.00, 'hsn' => '6404'],

            // Hardware
            ['name' => 'Steel Measuring Tape 5 Metre', 'cat' => 'Hardware', 'unit' => 'pcs', 'price' => 140.00, 'mrp' => 190.00, 'gst' => 18.00, 'hsn' => '9017'],
            ['name' => 'Heavy Duty Screwdriver Set (6pc)', 'cat' => 'Hardware', 'unit' => 'box', 'price' => 320.00, 'mrp' => 450.00, 'gst' => 18.00, 'hsn' => '8205'],
            ['name' => 'Electrical Insulation Tape (Black)', 'cat' => 'Hardware', 'unit' => 'pcs', 'price' => 20.00, 'mrp' => 25.00, 'gst' => 18.00, 'hsn' => '3919'],
            ['name' => 'Anchor Wall Plug & Screw (Box of 50)', 'cat' => 'Hardware', 'unit' => 'box', 'price' => 110.00, 'mrp' => 150.00, 'gst' => 18.00, 'hsn' => '7318'],

            // Cosmetics
            ['name' => 'Herbal Face Wash 100ml', 'cat' => 'Cosmetics', 'unit' => 'pcs', 'price' => 135.00, 'mrp' => 160.00, 'gst' => 18.00, 'hsn' => '3304'],
            ['name' => 'Moisturizing Bath Soap (Pack of 4)', 'cat' => 'Cosmetics', 'unit' => 'pkt', 'price' => 175.00, 'mrp' => 210.00, 'gst' => 18.00, 'hsn' => '3401'],
            ['name' => 'Anti-Dandruff Shampoo 180ml', 'cat' => 'Cosmetics', 'unit' => 'pcs', 'price' => 190.00, 'mrp' => 220.00, 'gst' => 18.00, 'hsn' => '3305'],

            // Stationery
            ['name' => 'Classmate Spiral Notebook 200p', 'cat' => 'Stationery', 'unit' => 'pcs', 'price' => 85.00, 'mrp' => 95.00, 'gst' => 12.00, 'hsn' => '4820'],
            ['name' => 'Gel Pen Smooth Ink Blue (Pack of 5)', 'cat' => 'Stationery', 'unit' => 'pkt', 'price' => 60.00, 'mrp' => 75.00, 'gst' => 12.00, 'hsn' => '9608'],
            ['name' => 'A4 Copier Paper 75GSM (500 Sheets)', 'cat' => 'Stationery', 'unit' => 'pkt', 'price' => 310.00, 'mrp' => 380.00, 'gst' => 12.00, 'hsn' => '4802'],
            ['name' => 'Permanent Marker Black & Blue', 'cat' => 'Stationery', 'unit' => 'pcs', 'price' => 30.00, 'mrp' => 35.00, 'gst' => 12.00, 'hsn' => '9608'],

            // Beverages & Snacks
            ['name' => 'Amul Butter 500g Salted', 'cat' => 'Beverages & Snacks', 'unit' => 'pcs', 'price' => 275.00, 'mrp' => 285.00, 'gst' => 12.00, 'hsn' => '0405'],
            ['name' => 'Cadbury Dairy Milk Silk 150g', 'cat' => 'Beverages & Snacks', 'unit' => 'pcs', 'price' => 175.00, 'mrp' => 180.00, 'gst' => 18.00, 'hsn' => '1806'],
            ['name' => 'Britannia Good Day Cashew 200g', 'cat' => 'Beverages & Snacks', 'unit' => 'pkt', 'price' => 45.00, 'mrp' => 50.00, 'gst' => 18.00, 'hsn' => '1905'],
            ['name' => 'Red Label Tea 500g', 'cat' => 'Beverages & Snacks', 'unit' => 'pkt', 'price' => 260.00, 'mrp' => 290.00, 'gst' => 5.00, 'hsn' => '0902'],
        ];

        foreach ($productsData as $p) {
            Product::firstOrCreate(
                ['shop_id' => $shop->id, 'name' => $p['name']],
                [
                    'category_id' => $catMap[$p['cat']] ?? reset($catMap),
                    'unit' => $p['unit'],
                    'default_price' => $p['price'],
                    'mrp' => $p['mrp'],
                    'gst_rate' => $p['gst'],
                    'hsn_code' => $p['hsn'],
                    'is_tax_inclusive' => true,
                    'is_active' => true,
                    'source' => 'manual',
                ]
            );
        }

        // 13. Customers (including credit/udhaar accounts)
        $customersData = [
            ['name' => 'Ramesh Gupta', 'phone' => '9845011223', 'address' => 'House 42, 3rd Cross, Indiranagar', 'credit_limit' => 5000.00, 'current_balance' => 1250.00, 'total_purchases' => 18450.00],
            ['name' => 'Pooja Verma', 'phone' => '9731255441', 'address' => 'Flat 204, Green Heights, Koramangala', 'credit_limit' => 10000.00, 'current_balance' => 0.00, 'total_purchases' => 12300.00],
            ['name' => 'Anand Electrical Works', 'phone' => '9900887766', 'address' => 'Commercial Lane, HSR Layout', 'gstin' => '29AAACA1234F1Z1', 'credit_limit' => 25000.00, 'current_balance' => 4500.00, 'total_purchases' => 54200.00],
            ['name' => 'Dr. Meera Nambiar', 'phone' => '9880099112', 'address' => 'Clinic 5, BTM 2nd Stage', 'credit_limit' => 5000.00, 'current_balance' => 0.00, 'total_purchases' => 8700.00],
        ];

        $customerMap = [];
        foreach ($customersData as $c) {
            $cust = Customer::firstOrCreate(['shop_id' => $shop->id, 'phone' => $c['phone']], array_merge($c, ['shop_id' => $shop->id]));
            $customerMap[$c['name']] = $cust;
        }

        // 14. Discounts
        $discounts = [
            ['name' => 'Welcome Flat 50 Off', 'code' => 'WELCOME50', 'type' => 'fixed', 'value' => 50.00, 'min_bill_amount' => 500.00, 'is_active' => true],
            ['name' => 'Festival Special 5%', 'code' => 'FESTIVE5', 'type' => 'percentage', 'value' => 5.00, 'min_bill_amount' => 1000.00, 'is_active' => true],
            ['name' => 'Super Saver 10%', 'code' => 'SAVER10', 'type' => 'percentage', 'value' => 10.00, 'min_bill_amount' => 2500.00, 'is_active' => true],
        ];
        foreach ($discounts as $d) {
            Discount::firstOrCreate(['shop_id' => $shop->id, 'name' => $d['name']], array_merge($d, ['shop_id' => $shop->id]));
        }

        // 15. Create Sample Invoices (Catalogue-Based and Custom Mode, GST & Non-GST)
        $ramesh = $customerMap['Ramesh Gupta'];
        $pooja = $customerMap['Pooja Verma'];
        $anand = $customerMap['Anand Electrical Works'];

        // Sample Bill 1: Catalogue-Based GST Retail Bill (Paid by UPI)
        $inv1 = Invoice::create([
            'shop_id' => $shop->id,
            'user_id' => $shopkeeper->id,
            'customer_id' => $ramesh->id,
            'customer_name' => $ramesh->name,
            'customer_phone' => $ramesh->phone,
            'invoice_number' => 'SB-2026-1001',
            'invoice_date' => Carbon::now()->subDays(2)->setTime(11, 30),
            'billing_mode' => 'catalogue',
            'invoice_type' => 'gst',
            'subtotal' => 970.00,
            'item_discount_total' => 20.00,
            'overall_discount_type' => 'fixed',
            'overall_discount_value' => 50.00,
            'overall_discount_amount' => 50.00,
            'total_discount' => 70.00,
            'taxable_amount' => 762.71,
            'cgst_amount' => 68.64,
            'sgst_amount' => 68.64,
            'igst_amount' => 0.00,
            'total_tax' => 137.28,
            'round_off' => 0.00,
            'final_amount' => 900.00,
            'amount_paid' => 900.00,
            'balance_due' => 0.00,
            'payment_status' => 'paid',
            'payment_method' => 'upi',
            'notes' => 'Customer paid via Google Pay UPI.',
            'status' => 'completed',
        ]);

        InvoiceItem::create([
            'invoice_id' => $inv1->id,
            'product_id' => Product::where('name', 'like', '%USB-C%')->first()?->id,
            'item_name' => 'Fast USB-C Charging Cable 65W',
            'category_name' => 'Electronics',
            'is_custom_item' => false,
            'hsn_code' => '8544',
            'unit' => 'pcs',
            'quantity' => 2,
            'unit_price' => 299.00,
            'discount_type' => 'fixed',
            'discount_value' => 20.00,
            'discount_amount' => 20.00,
            'subtotal' => 578.00,
            'gst_rate' => 18.00,
            'cgst_amount' => 44.08,
            'sgst_amount' => 44.08,
            'igst_amount' => 0.00,
            'tax_amount' => 88.16,
            'total_amount' => 578.00,
        ]);

        InvoiceItem::create([
            'invoice_id' => $inv1->id,
            'product_id' => Product::where('name', 'like', '%Bulb%')->first()?->id,
            'item_name' => 'Philips LED Bulb 9W Cool White',
            'category_name' => 'Electronics',
            'is_custom_item' => false,
            'hsn_code' => '8539',
            'unit' => 'pcs',
            'quantity' => 4,
            'unit_price' => 95.00,
            'discount_type' => 'fixed',
            'discount_value' => 0.00,
            'discount_amount' => 0.00,
            'subtotal' => 380.00,
            'gst_rate' => 12.00,
            'cgst_amount' => 20.36,
            'sgst_amount' => 20.36,
            'igst_amount' => 0.00,
            'tax_amount' => 40.72,
            'total_amount' => 380.00,
        ]);

        $pay1 = Payment::create([
            'shop_id' => $shop->id,
            'invoice_id' => $inv1->id,
            'customer_id' => $ramesh->id,
            'payment_number' => 'PAY-2026-1001',
            'payment_date' => Carbon::now()->subDays(2)->setTime(11, 32),
            'amount' => 900.00,
            'payment_method' => 'upi',
            'reference_number' => 'UPI/GPay/4392819281',
            'payment_type' => 'invoice_payment',
        ]);
        PaymentAllocation::create(['payment_id' => $pay1->id, 'invoice_id' => $inv1->id, 'amount' => 900.00]);

        // Sample Bill 2: Custom / Personal Billing Mode (Shopkeeper manually priced items)
        $inv2 = Invoice::create([
            'shop_id' => $shop->id,
            'user_id' => $shopkeeper->id,
            'customer_id' => null,
            'customer_name' => 'Walk-in Customer (General Store)',
            'customer_phone' => '9811223344',
            'invoice_number' => 'SB-2026-1002',
            'invoice_date' => Carbon::now()->subDays(1)->setTime(16, 45),
            'billing_mode' => 'custom',
            'invoice_type' => 'retail',
            'subtotal' => 1480.00,
            'item_discount_total' => 0.00,
            'overall_discount_type' => 'fixed',
            'overall_discount_value' => 30.00,
            'overall_discount_amount' => 30.00,
            'total_discount' => 30.00,
            'taxable_amount' => 1450.00,
            'cgst_amount' => 0.00,
            'sgst_amount' => 0.00,
            'igst_amount' => 0.00,
            'total_tax' => 0.00,
            'round_off' => 0.00,
            'final_amount' => 1450.00,
            'amount_paid' => 1450.00,
            'balance_due' => 0.00,
            'payment_status' => 'paid',
            'payment_method' => 'cash',
            'notes' => 'Custom items priced manually by shopkeeper.',
            'status' => 'completed',
        ]);

        InvoiceItem::create([
            'invoice_id' => $inv2->id,
            'product_id' => null,
            'item_name' => 'Custom Brass Padlock 60mm with 3 keys',
            'category_name' => 'Hardware',
            'is_custom_item' => true,
            'hsn_code' => '8301',
            'unit' => 'pcs',
            'quantity' => 2,
            'unit_price' => 380.00,
            'discount_type' => 'fixed',
            'discount_value' => 0.00,
            'discount_amount' => 0.00,
            'subtotal' => 760.00,
            'gst_rate' => 0.00,
            'cgst_amount' => 0.00,
            'sgst_amount' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => 0.00,
            'total_amount' => 760.00,
        ]);

        InvoiceItem::create([
            'invoice_id' => $inv2->id,
            'product_id' => null,
            'item_name' => 'Special Galvanized Wire Bundle (10m)',
            'category_name' => 'Hardware',
            'is_custom_item' => true,
            'hsn_code' => '7217',
            'unit' => 'm',
            'quantity' => 1,
            'unit_price' => 720.00,
            'discount_type' => 'fixed',
            'discount_value' => 0.00,
            'discount_amount' => 0.00,
            'subtotal' => 720.00,
            'gst_rate' => 0.00,
            'cgst_amount' => 0.00,
            'sgst_amount' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => 0.00,
            'total_amount' => 720.00,
        ]);

        $pay2 = Payment::create([
            'shop_id' => $shop->id,
            'invoice_id' => $inv2->id,
            'customer_id' => null,
            'payment_number' => 'PAY-2026-1002',
            'payment_date' => Carbon::now()->subDays(1)->setTime(16, 46),
            'amount' => 1450.00,
            'payment_method' => 'cash',
            'payment_type' => 'invoice_payment',
        ]);
        PaymentAllocation::create(['payment_id' => $pay2->id, 'invoice_id' => $inv2->id, 'amount' => 1450.00]);

        // Sample Bill 3: Today's Bill with Credit / Udhaar
        $inv3 = Invoice::create([
            'shop_id' => $shop->id,
            'user_id' => $cashierUser->id,
            'customer_id' => $anand->id,
            'customer_name' => $anand->name,
            'customer_phone' => $anand->phone,
            'customer_gstin' => $anand->gstin,
            'invoice_number' => 'SB-2026-1003',
            'invoice_date' => Carbon::now()->setTime(14, 15),
            'billing_mode' => 'catalogue',
            'invoice_type' => 'gst',
            'subtotal' => 6500.00,
            'item_discount_total' => 200.00,
            'overall_discount_type' => 'percentage',
            'overall_discount_value' => 5.00,
            'overall_discount_amount' => 315.00,
            'total_discount' => 515.00,
            'taxable_amount' => 5072.03,
            'cgst_amount' => 456.48,
            'sgst_amount' => 456.48,
            'igst_amount' => 0.00,
            'total_tax' => 912.97,
            'round_off' => 0.00,
            'final_amount' => 5985.00,
            'amount_paid' => 2000.00,
            'balance_due' => 3985.00,
            'payment_status' => 'partial',
            'payment_method' => 'mixed',
            'notes' => 'Advance 2000 paid by UPI, balance 3985 added to Udhaar/Credit ledger.',
            'status' => 'completed',
        ]);

        $pay3 = Payment::create([
            'shop_id' => $shop->id,
            'invoice_id' => $inv3->id,
            'customer_id' => $anand->id,
            'payment_number' => 'PAY-2026-1003',
            'payment_date' => Carbon::now()->setTime(14, 16),
            'amount' => 2000.00,
            'payment_method' => 'upi',
            'reference_number' => 'UPI/Paytm/772189421',
            'payment_type' => 'invoice_payment',
        ]);
        PaymentAllocation::create(['payment_id' => $pay3->id, 'invoice_id' => $inv3->id, 'amount' => 2000.00]);

        // Audit Log
        AuditLog::create([
            'shop_id' => $shop->id,
            'user_id' => $shopkeeper->id,
            'action' => 'shop.initialized',
            'entity_type' => 'shop',
            'entity_id' => $shop->id,
            'ip_address' => '127.0.0.1',
            'details' => ['message' => 'Shop initialized with default categories, products and invoice settings.'],
        ]);
    }
}
