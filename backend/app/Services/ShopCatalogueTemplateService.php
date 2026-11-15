<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ShopCatalogueTemplateService
{
    /**
     * Get list of supported business categories with metadata and sample preview items.
     */
    public static function getBusinessTypes(): array
    {
        return [
            [
                'id' => 'electrical',
                'name' => 'Electrical Store',
                'hindi_name' => 'इलेक्ट्रिकल दुकान',
                'icon' => 'Zap',
                'color' => '#f59e0b',
                'badge' => 'Wires, Switches & Lighting',
                'description' => 'Wires (Havells, Polycab), Switches (Anchor Roma), MCBs, LED Bulbs, Fans & Conduit Pipes.',
                'preview_categories' => [
                    'Wires & Cables (Havells, Polycab, Finolex)',
                    'Modular Switches & Sockets (Anchor Roma, Legrand)',
                    'LED Bulbs & Battens (Philips, Crompton)',
                    'MCBs & Distribution Boxes (Schneider, L&T)',
                    'Ceiling Fans & Appliances (Orient, Crompton)',
                    'PVC Conduit Pipes & Insulation Tapes',
                ],
            ],
            [
                'id' => 'hardware',
                'name' => 'Hardware & Sanitary',
                'hindi_name' => 'हार्डवेयर एवं सेनेटरी',
                'icon' => 'Wrench',
                'color' => '#ef4444',
                'badge' => 'Tools, Paints & Plumbing',
                'description' => 'Hand Tools (Taparia), Paints (Asian Paints), CPVC Pipes (Astral), Locks (Godrej) & Adhesives.',
                'preview_categories' => [
                    'Hand Tools & Measurement (Taparia, Stanley)',
                    'Paints, Primers & Brushes (Asian Paints, Berger)',
                    'Plumbing & CPVC Pipes (Astral, Supreme)',
                    'Door Fittings & Brass Locks (Godrej)',
                    'Adhesives & Waterproofing (Fevicol, Dr. Fixit)',
                ],
            ],
            [
                'id' => 'grocery',
                'name' => 'Grocery & Kirana',
                'hindi_name' => 'किराना एवं सुपरमार्केट',
                'icon' => 'ShoppingBag',
                'color' => '#10b981',
                'badge' => 'Grains, Oil & FMCG',
                'description' => 'Atta & Rice (Fortune, Aashirvaad), Edible Oils, Spices (MDH), Soaps (Dettol) & Detergents.',
                'preview_categories' => [
                    'Atta, Rice & Grains (Aashirvaad, Fortune)',
                    'Edible Cooking Oils & Pure Ghee (Amul, Dhara)',
                    'Spices & Masalas (MDH, Everest, Catch)',
                    'Tea, Sugar & Dairy Products',
                    'Personal Care & Bath Soaps (Dettol, Colgate)',
                    'Detergents & Surface Cleaners (Surf Excel, Vim)',
                ],
            ],
            [
                'id' => 'general',
                'name' => 'General Store & Daily Needs',
                'hindi_name' => 'जनरल स्टोर एवं डेली नीड्स',
                'icon' => 'Store',
                'color' => '#8b5cf6',
                'badge' => 'Snacks, Stationery & Care',
                'description' => 'Packaged Biscuits, Cold Drinks, School Stationery (Classmate), Toiletries & Puja items.',
                'preview_categories' => [
                    'Biscuits, Snacks & Chocolates (Parle-G, Dairy Milk)',
                    'Beverages, Cold Drinks & Juices (Coca-Cola, Real)',
                    'Notebooks & Stationery (Classmate, Reynolds)',
                    'Toiletries & Shaving Grooming (Gillette, Nivea)',
                    'Puja Samagri & Daily Household Goods',
                ],
            ],
            [
                'id' => 'mobile',
                'name' => 'Mobile & Accessories',
                'hindi_name' => 'मोबाइल एवं एक्सेसरीज',
                'icon' => 'Smartphone',
                'color' => '#06b6d4',
                'badge' => 'Cables, Earbuds & Covers',
                'description' => 'Fast Chargers (Boat, Portronics), Power Banks (Mi), Earbuds, 11D Tempered Glass & Covers.',
                'preview_categories' => [
                    'Fast Charging Cables & Adapters (Boat, Apple)',
                    'High Capacity Power Banks (Mi, Ambrane)',
                    'Wireless Earbuds & Headphones (OnePlus, Boat)',
                    '11D Tempered Glass & Screen Guards',
                    'Mobile Back Covers & Premium Cases',
                ],
            ],
            [
                'id' => 'laptop',
                'name' => 'Laptop & Computers',
                'hindi_name' => 'लैपटॉप एवं कंप्यूटर',
                'icon' => 'Laptop',
                'color' => '#3b82f6',
                'badge' => 'Mice, SSDs & Adapters',
                'description' => 'Wireless Mice (Logitech), High Speed SSDs (Crucial, Kingston), HDMI/Type-C Hubs & Stands.',
                'preview_categories' => [
                    'Wireless Keyboards & Mice (Logitech, Zebronics)',
                    'SSDs, Pendrives & RAM (Crucial, Kingston, SanDisk)',
                    'HDMI, Type-C Hubs & Network Cables (Portronics)',
                    'Laptop Bags, Backpacks & Ergonomic Stands',
                ],
            ],
            [
                'id' => 'sweets',
                'name' => 'Sweets & Bakery',
                'hindi_name' => 'मिठाई एवं बेकरी',
                'icon' => 'Cake',
                'color' => '#ec4899',
                'badge' => 'Mithai, Namkeen & Cakes',
                'description' => 'Desi Ghee Mithai (Kaju Katli, Ladoo), Hot Samosa & Namkeen, Pastries, Cakes & Rusk.',
                'preview_categories' => [
                    'Traditional Sweets (Kaju Katli, Gulab Jamun, Ladoo)',
                    'Fresh Samosa, Dhokla & Spicy Namkeen (Ratlami Sev)',
                    'Cakes & Fresh Pastries (Black Forest, Truffle)',
                    'Bakery Rusks, Cookies & Toast',
                ],
            ],
            [
                'id' => 'cafe',
                'name' => 'Cafe & Restaurant',
                'hindi_name' => 'कैफे एवं रेस्टोरेंट',
                'icon' => 'Coffee',
                'color' => '#d97706',
                'badge' => 'Chai, Coffee, Burgers & Pizza',
                'description' => 'Masala Chai, Cappuccino, Cold Coffee, Burgers, Sandwiches, Thin Crust Pizza & Fries.',
                'preview_categories' => [
                    'Hot Teas, Kulhad Chai & Espresso Coffees',
                    'Cold Coffees, Milkshakes & Mint Mojitos',
                    'Veg Burgers, Grilled Sandwiches & Paneer Wraps',
                    'Pizzas (Margherita, Farmhouse) & Alfredo Pastas',
                    'Crispy Salted French Fries & Loaded Nachos',
                ],
            ],
            [
                'id' => 'clothing',
                'name' => 'Clothing & Garments',
                'hindi_name' => 'कपड़ा दुकान एवं गारमेंट्स',
                'icon' => 'Shirt',
                'color' => '#6366f1',
                'badge' => 'Shirts, Jeans & Sarees',
                'description' => 'Men Formal Shirts, Casual Jeans, Daily Wear Kurtis, Silk Sarees & Kids Wear.',
                'preview_categories' => [
                    'Men Formal & Casual Cotton Shirts',
                    'Stretchable Denim Jeans & Cotton Trousers',
                    'Women Cotton Kurtis, Sarees & Ethnic Wear',
                    'Kids Wear Sets & Cotton Innerwear',
                ],
            ],
            [
                'id' => 'medical',
                'name' => 'Pharmacy & Medical',
                'hindi_name' => 'दवा दुकान एवं फार्मेसी',
                'icon' => 'Cross',
                'color' => '#14b8a6',
                'badge' => 'Medicines & Health Care',
                'description' => 'OTC Fever & Pain Relief, First Aid (Dettol, Band-Aid), Health Drinks (Horlicks) & Supplements.',
                'preview_categories' => [
                    'OTC Tablets & Pain Relief (Dolo, Crocin, Combiflam)',
                    'First Aid, Antiseptics & Bandages (Dettol, Cotton)',
                    'Health Supplements, Horlicks & Chyawanprash',
                ],
            ],
            [
                'id' => 'other',
                'name' => 'Other Retail Store',
                'hindi_name' => 'अन्य कोई भी व्यवसाय',
                'icon' => 'Boxes',
                'color' => '#64748b',
                'badge' => 'Custom Retail Catalog',
                'description' => 'General customizable retail product categories and starter templates for any custom business.',
                'preview_categories' => [
                    'General Retail Items (दुकान का मुख्य सामान)',
                    'Special Accessories & Add-ons (एक्सेसरीज एवं विविध)',
                ],
            ],
        ];
    }

    /**
     * Seed item categories and rich branded starter products for a shop based on its business type.
     */
    public static function seedCatalogueForShop(Shop $shop, string $businessType): int
    {
        $templates = self::getDetailedCatalogueData();
        $typeData = $templates[$businessType] ?? $templates['general'];

        $now = now();
        $totalProductsCreated = 0;

        foreach ($typeData as $catIndex => $catDef) {
            $category = Category::create([
                'shop_id' => $shop->id,
                'name' => $catDef['category_name'],
                'slug' => Str::slug($catDef['category_name']) . '-' . $shop->id . '-' . rand(100, 999),
                'description' => $catDef['description'] ?? null,
                'icon' => $catDef['icon'] ?? 'Package',
                'color' => $catDef['color'] ?? '#3b82f6',
                'display_order' => $catIndex + 1,
                'is_active' => true,
            ]);

            $productsToInsert = [];
            foreach ($catDef['products'] as $prodDef) {
                $productsToInsert[] = [
                    'shop_id' => $shop->id,
                    'category_id' => $category->id,
                    'name' => $prodDef['name'],
                    'barcode' => $prodDef['barcode'] ?? null,
                    'hsn_code' => $prodDef['hsn_code'] ?? null,
                    'unit' => $prodDef['unit'] ?? 'pcs',
                    'default_price' => $prodDef['price'],
                    'mrp' => $prodDef['mrp'] ?? $prodDef['price'],
                    'cost_price' => $prodDef['cost_price'] ?? round($prodDef['price'] * 0.75, 2),
                    'gst_rate' => $prodDef['gst_rate'] ?? 18.00,
                    'is_tax_inclusive' => true,
                    'is_active' => true,
                    'source' => 'category_template',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
                $totalProductsCreated++;
            }

            if (!empty($productsToInsert)) {
                Product::insert($productsToInsert);
            }
        }

        // Invalidate all shop cache keys so fresh catalog loads instantly
        Cache::forget("shop_{$shop->id}_categories");
        Cache::forget("shop_{$shop->id}_products_all");
        Cache::forget("shop_{$shop->id}_products_metadata");
        Cache::forget("shop_{$shop->id}_bootstrap");
        Cache::forget("shop_{$shop->id}_settings_data");

        return $totalProductsCreated;
    }

    /**
     * Complete catalogue blueprint with realistic Indian retail items, brands and market prices.
     */
    private static function getDetailedCatalogueData(): array
    {
        return [
            // ==========================================
            // 1. ELECTRICAL STORE (User's prime example)
            // ==========================================
            'electrical' => [
                [
                    'category_name' => 'Wires & Cables (वायर एवं केबल)',
                    'icon' => 'Zap',
                    'color' => '#f59e0b',
                    'description' => 'House wiring single core copper cables & flexible cords',
                    'products' => [
                        ['name' => 'Havells Life Line Plus Wire 1.0 sq mm Red (90m Box)', 'unit' => 'box', 'price' => 1450, 'mrp' => 1750, 'cost_price' => 1180, 'gst_rate' => 18, 'hsn_code' => '8544', 'stock' => 20],
                        ['name' => 'Havells Life Line Plus Wire 1.5 sq mm Blue (90m Box)', 'unit' => 'box', 'price' => 2150, 'mrp' => 2550, 'cost_price' => 1780, 'gst_rate' => 18, 'hsn_code' => '8544', 'stock' => 25],
                        ['name' => 'Polycab Green Wire 2.5 sq mm Yellow (90m Box)', 'unit' => 'box', 'price' => 3450, 'mrp' => 4100, 'cost_price' => 2850, 'gst_rate' => 18, 'hsn_code' => '8544', 'stock' => 15],
                        ['name' => 'Finolex FRLS Wire 4.0 sq mm Black (90m Box)', 'unit' => 'box', 'price' => 5200, 'mrp' => 6100, 'cost_price' => 4350, 'gst_rate' => 18, 'hsn_code' => '8544', 'stock' => 10],
                        ['name' => 'RR Kabel Superex Wire 1.5 sq mm Green (90m Box)', 'unit' => 'box', 'price' => 2200, 'mrp' => 2600, 'cost_price' => 1820, 'gst_rate' => 18, 'hsn_code' => '8544', 'stock' => 15],
                        ['name' => 'Copper Flexible Twin Wire 23/76 (Per Metre)', 'unit' => 'mtr', 'price' => 18, 'mrp' => 25, 'cost_price' => 12, 'gst_rate' => 18, 'hsn_code' => '8544', 'stock' => 200],
                    ],
                ],
                [
                    'category_name' => 'Modular Switches & Sockets (स्विच एवं सॉकेट)',
                    'icon' => 'ToggleRight',
                    'color' => '#3b82f6',
                    'description' => 'Modular 6A & 16A switches, 3-pin sockets and fan regulators',
                    'products' => [
                        ['name' => 'Anchor Roma 1-Way 6A Switch (White)', 'unit' => 'pcs', 'price' => 35, 'mrp' => 45, 'cost_price' => 24, 'gst_rate' => 18, 'hsn_code' => '8536', 'stock' => 150],
                        ['name' => 'Anchor Roma 16A Power Switch', 'unit' => 'pcs', 'price' => 75, 'mrp' => 95, 'cost_price' => 52, 'gst_rate' => 18, 'hsn_code' => '8536', 'stock' => 80],
                        ['name' => 'Havells Fabio 6A 3-Pin Shuttered Socket', 'unit' => 'pcs', 'price' => 95, 'mrp' => 120, 'cost_price' => 68, 'gst_rate' => 18, 'hsn_code' => '8536', 'stock' => 60],
                        ['name' => 'Legrand Arteor 16A Power Socket', 'unit' => 'pcs', 'price' => 145, 'mrp' => 180, 'cost_price' => 105, 'gst_rate' => 18, 'hsn_code' => '8536', 'stock' => 40],
                        ['name' => 'Anchor Roma 4-Step Rotary Fan Regulator', 'unit' => 'pcs', 'price' => 180, 'mrp' => 230, 'cost_price' => 130, 'gst_rate' => 18, 'hsn_code' => '8536', 'stock' => 30],
                        ['name' => 'Anchor Penta 6A Piano Switch (Non-Modular)', 'unit' => 'pcs', 'price' => 22, 'mrp' => 30, 'cost_price' => 14, 'gst_rate' => 18, 'hsn_code' => '8536', 'stock' => 100],
                    ],
                ],
                [
                    'category_name' => 'LED Bulbs & Battens (एलईडी बल्ब एवं ट्यूब)',
                    'icon' => 'Sun',
                    'color' => '#10b981',
                    'description' => 'Energy efficient LED bulbs, battens, panel lights and downlights',
                    'products' => [
                        ['name' => 'Philips 9W Cool Daylight B22 LED Bulb', 'unit' => 'pcs', 'price' => 95, 'mrp' => 140, 'cost_price' => 65, 'gst_rate' => 12, 'hsn_code' => '8539', 'stock' => 80],
                        ['name' => 'Philips 12W Inverter Rechargeable Emergency Bulb', 'unit' => 'pcs', 'price' => 340, 'mrp' => 499, 'cost_price' => 250, 'gst_rate' => 12, 'hsn_code' => '8539', 'stock' => 25],
                        ['name' => 'Crompton 20W LED Batten Tube Light (4ft)', 'unit' => 'pcs', 'price' => 220, 'mrp' => 350, 'cost_price' => 155, 'gst_rate' => 12, 'hsn_code' => '9405', 'stock' => 40],
                        ['name' => 'Syska 15W Round Concealed Downlight / Panel Light', 'unit' => 'pcs', 'price' => 280, 'mrp' => 450, 'cost_price' => 195, 'gst_rate' => 12, 'hsn_code' => '9405', 'stock' => 30],
                        ['name' => 'Wipro 0.5W Night Deco LED Bulb (Blue/Warm)', 'unit' => 'pcs', 'price' => 45, 'mrp' => 70, 'cost_price' => 28, 'gst_rate' => 12, 'hsn_code' => '8539', 'stock' => 50],
                    ],
                ],
                [
                    'category_name' => 'MCBs & Distribution Boxes (एमसीबी एवं डीबी)',
                    'icon' => 'Shield',
                    'color' => '#ef4444',
                    'description' => 'Circuit breakers, isolators and metal distribution boxes',
                    'products' => [
                        ['name' => 'Schneider Acti9 16A Single Pole C-Curve MCB', 'unit' => 'pcs', 'price' => 185, 'mrp' => 240, 'cost_price' => 135, 'gst_rate' => 18, 'hsn_code' => '8536', 'stock' => 40],
                        ['name' => 'Schneider Acti9 32A Single Pole MCB', 'unit' => 'pcs', 'price' => 210, 'mrp' => 275, 'cost_price' => 155, 'gst_rate' => 18, 'hsn_code' => '8536', 'stock' => 30],
                        ['name' => 'Havells 32A Double Pole DP Isolator Switch', 'unit' => 'pcs', 'price' => 420, 'mrp' => 550, 'cost_price' => 310, 'gst_rate' => 18, 'hsn_code' => '8536', 'stock' => 20],
                        ['name' => 'L&T 63A 4-Pole RCCB 30mA Earth Leakage', 'unit' => 'pcs', 'price' => 2450, 'mrp' => 3100, 'cost_price' => 1950, 'gst_rate' => 18, 'hsn_code' => '8536', 'stock' => 8],
                        ['name' => 'Havells 8-Way Double Door MCB Distribution Box', 'unit' => 'pcs', 'price' => 850, 'mrp' => 1150, 'cost_price' => 640, 'gst_rate' => 18, 'hsn_code' => '8537', 'stock' => 12],
                    ],
                ],
                [
                    'category_name' => 'Ceiling Fans & Heating (पंखे एवं हीटर)',
                    'icon' => 'Wind',
                    'color' => '#06b6d4',
                    'description' => 'Ceiling fans, exhaust fans and water heating appliances',
                    'products' => [
                        ['name' => 'Orient Electric Apex-FX 1200mm Ceiling Fan (Brown)', 'unit' => 'pcs', 'price' => 1650, 'mrp' => 2100, 'cost_price' => 1350, 'gst_rate' => 18, 'hsn_code' => '8414', 'stock' => 15],
                        ['name' => 'Crompton Hill Briz 1200mm High Speed Ceiling Fan', 'unit' => 'pcs', 'price' => 1850, 'mrp' => 2350, 'cost_price' => 1520, 'gst_rate' => 18, 'hsn_code' => '8414', 'stock' => 12],
                        ['name' => 'Usha Crisp Air 150mm High Speed Exhaust Fan', 'unit' => 'pcs', 'price' => 980, 'mrp' => 1290, 'cost_price' => 780, 'gst_rate' => 18, 'hsn_code' => '8414', 'stock' => 10],
                        ['name' => 'Bajaj Immersion Rod Water Heater 1500W', 'unit' => 'pcs', 'price' => 650, 'mrp' => 850, 'cost_price' => 490, 'gst_rate' => 18, 'hsn_code' => '8516', 'stock' => 20],
                    ],
                ],
                [
                    'category_name' => 'Conduit Pipes & Accessories (कंड्यूट पाइप एवं फिटिंग्स)',
                    'icon' => 'Package',
                    'color' => '#64748b',
                    'description' => 'PVC conduit pipes, bends, tape, junction boxes and screws',
                    'products' => [
                        ['name' => 'Steelgrip PVC Electrical Insulation Tape (Pack of 5)', 'unit' => 'pack', 'price' => 50, 'mrp' => 60, 'cost_price' => 35, 'gst_rate' => 18, 'hsn_code' => '3919', 'stock' => 60],
                        ['name' => 'VIP 25mm Heavy Duty PVC Conduit Pipe (3m Length)', 'unit' => 'pcs', 'price' => 65, 'mrp' => 85, 'cost_price' => 46, 'gst_rate' => 18, 'hsn_code' => '3917', 'stock' => 100],
                        ['name' => 'PVC 4-Way Round Deep Junction Box 25mm', 'unit' => 'pcs', 'price' => 18, 'mrp' => 25, 'cost_price' => 11, 'gst_rate' => 18, 'hsn_code' => '3926', 'stock' => 120],
                        ['name' => 'Anchor 3-Pin Multi Plug Top 6A/16A Adapter', 'unit' => 'pcs', 'price' => 65, 'mrp' => 85, 'cost_price' => 42, 'gst_rate' => 18, 'hsn_code' => '8536', 'stock' => 50],
                    ],
                ],
            ],

            // ==========================================
            // 2. HARDWARE & SANITARY STORE
            // ==========================================
            'hardware' => [
                [
                    'category_name' => 'Hand Tools & Measurement (हैंड टूल्स)',
                    'icon' => 'Wrench',
                    'color' => '#ef4444',
                    'products' => [
                        ['name' => 'Taparia 8-inch Combination Pliers', 'unit' => 'pcs', 'price' => 260, 'mrp' => 320, 'cost_price' => 195, 'gst_rate' => 18, 'hsn_code' => '8203', 'stock' => 25],
                        ['name' => 'Taparia Screw Driver Set 812 (5 Blades)', 'unit' => 'set', 'price' => 340, 'mrp' => 410, 'cost_price' => 255, 'gst_rate' => 18, 'hsn_code' => '8205', 'stock' => 20],
                        ['name' => 'Freemans 5m Steel Measuring Tape Pro', 'unit' => 'pcs', 'price' => 180, 'mrp' => 240, 'cost_price' => 130, 'gst_rate' => 18, 'hsn_code' => '9017', 'stock' => 30],
                        ['name' => 'Stanley 500g Steel Shaft Claw Hammer', 'unit' => 'pcs', 'price' => 420, 'mrp' => 550, 'cost_price' => 310, 'gst_rate' => 18, 'hsn_code' => '8205', 'stock' => 15],
                        ['name' => 'Bosch 13mm Impact Drill Machine GSB 550W', 'unit' => 'pcs', 'price' => 2950, 'mrp' => 3800, 'cost_price' => 2350, 'gst_rate' => 18, 'hsn_code' => '8467', 'stock' => 6],
                    ],
                ],
                [
                    'category_name' => 'Paints, Primers & Brushes (पेंट एवं ब्रश)',
                    'icon' => 'Paintbrush',
                    'color' => '#f59e0b',
                    'products' => [
                        ['name' => 'Asian Paints Tractor Emulsion Brilliant White (4L)', 'unit' => 'can', 'price' => 720, 'mrp' => 880, 'cost_price' => 580, 'gst_rate' => 18, 'hsn_code' => '3209', 'stock' => 15],
                        ['name' => 'Berger Paints Wall Primer Interior (1L)', 'unit' => 'can', 'price' => 160, 'mrp' => 210, 'cost_price' => 125, 'gst_rate' => 18, 'hsn_code' => '3209', 'stock' => 30],
                        ['name' => 'Asian Paints 3-inch Royal Paint Brush', 'unit' => 'pcs', 'price' => 85, 'mrp' => 110, 'cost_price' => 58, 'gst_rate' => 18, 'hsn_code' => '9603', 'stock' => 40],
                        ['name' => 'Birla White Wall Care Putty (5 kg Bag)', 'unit' => 'bag', 'price' => 210, 'mrp' => 260, 'cost_price' => 170, 'gst_rate' => 18, 'hsn_code' => '3214', 'stock' => 25],
                    ],
                ],
                [
                    'category_name' => 'Plumbing & CPVC Pipes (प्लंबिंग एवं पाइप)',
                    'icon' => 'Droplets',
                    'color' => '#06b6d4',
                    'products' => [
                        ['name' => 'Astral CPVC Pro Pipe 1-inch SDR-11 (3m)', 'unit' => 'pcs', 'price' => 290, 'mrp' => 360, 'cost_price' => 220, 'gst_rate' => 18, 'hsn_code' => '3917', 'stock' => 30],
                        ['name' => 'Supreme PVC Brass Elbow 1/2-inch Fitting', 'unit' => 'pcs', 'price' => 45, 'mrp' => 60, 'cost_price' => 30, 'gst_rate' => 18, 'hsn_code' => '3917', 'stock' => 60],
                        ['name' => 'Parryware PTMT Bib Cock Tap 15mm Chrome Look', 'unit' => 'pcs', 'price' => 120, 'mrp' => 160, 'cost_price' => 85, 'gst_rate' => 18, 'hsn_code' => '8481', 'stock' => 25],
                        ['name' => 'Teflon Thread Seal Tape 12mm x 10m', 'unit' => 'pcs', 'price' => 20, 'mrp' => 30, 'cost_price' => 10, 'gst_rate' => 18, 'hsn_code' => '3919', 'stock' => 100],
                    ],
                ],
                [
                    'category_name' => 'Locks, Fasteners & Adhesives (ताले एवं फेविकोल)',
                    'icon' => 'Lock',
                    'color' => '#8b5cf6',
                    'products' => [
                        ['name' => 'Godrej Navtal 7 Levers Brass Padlock with 3 Keys', 'unit' => 'pcs', 'price' => 480, 'mrp' => 595, 'cost_price' => 380, 'gst_rate' => 18, 'hsn_code' => '8301', 'stock' => 20],
                        ['name' => 'Fevicol SH Ultimate Synthetic Resin (1 kg)', 'unit' => 'kg', 'price' => 240, 'mrp' => 290, 'cost_price' => 190, 'gst_rate' => 18, 'hsn_code' => '3506', 'stock' => 25],
                        ['name' => 'Dr. Fixit Waterproofing LW+ Liquid (1L)', 'unit' => 'can', 'price' => 170, 'mrp' => 220, 'cost_price' => 135, 'gst_rate' => 18, 'hsn_code' => '3824', 'stock' => 20],
                        ['name' => 'M-Seal Regular Epoxy Compound 100g', 'unit' => 'pack', 'price' => 30, 'mrp' => 35, 'cost_price' => 22, 'gst_rate' => 18, 'hsn_code' => '3214', 'stock' => 80],
                    ],
                ],
            ],

            // ==========================================
            // 3. GROCERY & SUPERMARKET
            // ==========================================
            'grocery' => [
                [
                    'category_name' => 'Atta, Rice & Grains (आटा, चावल एवं अनाज)',
                    'icon' => 'Wheat',
                    'color' => '#10b981',
                    'products' => [
                        ['name' => 'Aashirvaad Shudh Chakki Atta (10 kg)', 'unit' => 'bag', 'price' => 440, 'mrp' => 480, 'cost_price' => 395, 'gst_rate' => 0, 'hsn_code' => '1101', 'stock' => 40],
                        ['name' => 'Fortune Rozana Basmati Rice (5 kg)', 'unit' => 'bag', 'price' => 390, 'mrp' => 450, 'cost_price' => 340, 'gst_rate' => 0, 'hsn_code' => '1006', 'stock' => 30],
                        ['name' => 'Tata Sampann Unpolished Toor Dal (1 kg)', 'unit' => 'kg', 'price' => 180, 'mrp' => 210, 'cost_price' => 155, 'gst_rate' => 0, 'hsn_code' => '0713', 'stock' => 50],
                        ['name' => 'Rajdhani Maida Refined Flour (1 kg)', 'unit' => 'kg', 'price' => 45, 'mrp' => 52, 'cost_price' => 38, 'gst_rate' => 0, 'hsn_code' => '1101', 'stock' => 40],
                    ],
                ],
                [
                    'category_name' => 'Cooking Oils & Pure Ghee (खाद्य तेल एवं घी)',
                    'icon' => 'Droplet',
                    'color' => '#f59e0b',
                    'products' => [
                        ['name' => 'Fortune Sunlite Refined Sunflower Oil (1L Pouch)', 'unit' => 'pcs', 'price' => 135, 'mrp' => 160, 'cost_price' => 118, 'gst_rate' => 5, 'hsn_code' => '1512', 'stock' => 50],
                        ['name' => 'Dhara Kachi Ghani Mustard Oil (1L Bottle)', 'unit' => 'pcs', 'price' => 150, 'mrp' => 175, 'cost_price' => 130, 'gst_rate' => 5, 'hsn_code' => '1514', 'stock' => 40],
                        ['name' => 'Amul Pure Cow Ghee Tin (1 Litre)', 'unit' => 'can', 'price' => 590, 'mrp' => 650, 'cost_price' => 520, 'gst_rate' => 12, 'hsn_code' => '0405', 'stock' => 20],
                    ],
                ],
                [
                    'category_name' => 'Spices & Seasoning (मसाले एवं नमक)',
                    'icon' => 'Flame',
                    'color' => '#ef4444',
                    'products' => [
                        ['name' => 'Tata Salt Vacuum Evaporated Iodized Salt (1 kg)', 'unit' => 'kg', 'price' => 28, 'mrp' => 30, 'cost_price' => 24, 'gst_rate' => 0, 'hsn_code' => '2501', 'stock' => 100],
                        ['name' => 'MDH Deggi Mirch Red Chilli Powder (100g)', 'unit' => 'pack', 'price' => 85, 'mrp' => 95, 'cost_price' => 70, 'gst_rate' => 5, 'hsn_code' => '0904', 'stock' => 40],
                        ['name' => 'Everest Garam Masala (100g)', 'unit' => 'pack', 'price' => 90, 'mrp' => 102, 'cost_price' => 74, 'gst_rate' => 5, 'hsn_code' => '0910', 'stock' => 35],
                        ['name' => 'Catch Turmeric Haldi Powder (200g)', 'unit' => 'pack', 'price' => 62, 'mrp' => 72, 'cost_price' => 48, 'gst_rate' => 5, 'hsn_code' => '0910', 'stock' => 50],
                    ],
                ],
                [
                    'category_name' => 'Personal Care & Cleaning (साबुन एवं सर्फ)',
                    'icon' => 'Sparkles',
                    'color' => '#3b82f6',
                    'products' => [
                        ['name' => 'Dettol Original Bathing Soap (Pack of 4 x 100g)', 'unit' => 'pack', 'price' => 175, 'mrp' => 210, 'cost_price' => 145, 'gst_rate' => 18, 'hsn_code' => '3401', 'stock' => 35],
                        ['name' => 'Colgate Strong Teeth Dental Toothpaste (200g)', 'unit' => 'pcs', 'price' => 115, 'mrp' => 130, 'cost_price' => 95, 'gst_rate' => 18, 'hsn_code' => '3306', 'stock' => 45],
                        ['name' => 'Surf Excel Easy Wash Detergent Powder (1 kg)', 'unit' => 'kg', 'price' => 140, 'mrp' => 155, 'cost_price' => 120, 'gst_rate' => 18, 'hsn_code' => '3402', 'stock' => 50],
                        ['name' => 'Vim Dishwash Gel Lemon (500ml)', 'unit' => 'bottle', 'price' => 105, 'mrp' => 125, 'cost_price' => 88, 'gst_rate' => 18, 'hsn_code' => '3402', 'stock' => 30],
                    ],
                ],
            ],

            // ==========================================
            // 4. GENERAL STORE & DAILY NEEDS
            // ==========================================
            'general' => [
                [
                    'category_name' => 'Snacks, Biscuits & Chocolates (बिस्कुट एवं स्नैक्स)',
                    'icon' => 'Cookie',
                    'color' => '#8b5cf6',
                    'products' => [
                        ['name' => 'Parle-G Glucose Biscuit Family Pack (800g)', 'unit' => 'pack', 'price' => 80, 'mrp' => 90, 'cost_price' => 68, 'gst_rate' => 18, 'hsn_code' => '1905', 'stock' => 60],
                        ['name' => 'Britannia Good Day Butter Cookies (200g)', 'unit' => 'pack', 'price' => 45, 'mrp' => 50, 'cost_price' => 38, 'gst_rate' => 18, 'hsn_code' => '1905', 'stock' => 50],
                        ['name' => 'Cadbury Dairy Milk Chocolate Bar (50g)', 'unit' => 'pcs', 'price' => 40, 'mrp' => 40, 'cost_price' => 34, 'gst_rate' => 18, 'hsn_code' => '1806', 'stock' => 70],
                        ['name' => "Haldiram's Nagpur Aloo Bhujia Namkeen (200g)", 'unit' => 'pack', 'price' => 55, 'mrp' => 60, 'cost_price' => 45, 'gst_rate' => 12, 'hsn_code' => '2106', 'stock' => 40],
                    ],
                ],
                [
                    'category_name' => 'Beverages & Soft Drinks (कोल्ड ड्रिंक्स)',
                    'icon' => 'CupSoda',
                    'color' => '#ef4444',
                    'products' => [
                        ['name' => 'Coca-Cola Refreshing Pet Bottle (750ml)', 'unit' => 'bottle', 'price' => 40, 'mrp' => 40, 'cost_price' => 32, 'gst_rate' => 28, 'hsn_code' => '2202', 'stock' => 40],
                        ['name' => 'Real Fruit Power Mixed Fruit Juice (1L)', 'unit' => 'pack', 'price' => 110, 'mrp' => 130, 'cost_price' => 88, 'gst_rate' => 12, 'hsn_code' => '2009', 'stock' => 25],
                        ['name' => 'Red Bull Energy Drink Can (250ml)', 'unit' => 'can', 'price' => 125, 'mrp' => 125, 'cost_price' => 102, 'gst_rate' => 28, 'hsn_code' => '2202', 'stock' => 30],
                    ],
                ],
                [
                    'category_name' => 'Stationery & School Needs (स्टेशनरी एवं कॉपियां)',
                    'icon' => 'BookOpen',
                    'color' => '#10b981',
                    'products' => [
                        ['name' => 'Classmate Long Notebook Single Line (160 pgs)', 'unit' => 'pcs', 'price' => 55, 'mrp' => 65, 'cost_price' => 42, 'gst_rate' => 12, 'hsn_code' => '4820', 'stock' => 80],
                        ['name' => 'Reynolds 045 Fine Carbure Ball Pen (Pack of 5)', 'unit' => 'pack', 'price' => 50, 'mrp' => 50, 'cost_price' => 38, 'gst_rate' => 18, 'hsn_code' => '9608', 'stock' => 60],
                        ['name' => 'Doms Smart Kit Stationery Assorted Set', 'unit' => 'set', 'price' => 150, 'mrp' => 175, 'cost_price' => 120, 'gst_rate' => 12, 'hsn_code' => '9609', 'stock' => 25],
                    ],
                ],
                [
                    'category_name' => 'Puja & Daily Household (पूजा एवं घर का सामान)',
                    'icon' => 'Home',
                    'color' => '#f59e0b',
                    'products' => [
                        ['name' => 'Cycle Pure Agarbatti Lia Jasmine (Pack of 2)', 'unit' => 'pack', 'price' => 60, 'mrp' => 70, 'cost_price' => 45, 'gst_rate' => 5, 'hsn_code' => '3307', 'stock' => 50],
                        ['name' => 'Camphor Pure Pooja Karpoor Tablets (50g)', 'unit' => 'pack', 'price' => 45, 'mrp' => 55, 'cost_price' => 32, 'gst_rate' => 5, 'hsn_code' => '2914', 'stock' => 60],
                        ['name' => 'Gillette Guard Shaving Razor + 3 Blades Pack', 'unit' => 'pack', 'price' => 90, 'mrp' => 105, 'cost_price' => 75, 'gst_rate' => 18, 'hsn_code' => '8212', 'stock' => 35],
                    ],
                ],
            ],

            // ==========================================
            // 5. MOBILE & ACCESSORIES
            // ==========================================
            'mobile' => [
                [
                    'category_name' => 'Fast Cables & Adapters (चार्जर एवं केबल)',
                    'icon' => 'Cable',
                    'color' => '#06b6d4',
                    'products' => [
                        ['name' => 'Boat Deuce USB Type-C Fast Charging Cable 65W (1.5m)', 'unit' => 'pcs', 'price' => 299, 'mrp' => 599, 'cost_price' => 175, 'gst_rate' => 18, 'hsn_code' => '8544', 'stock' => 40],
                        ['name' => 'Portronics Adapto 65W GaN Fast Charger Multiport', 'unit' => 'pcs', 'price' => 1499, 'mrp' => 2499, 'cost_price' => 950, 'gst_rate' => 18, 'hsn_code' => '8504', 'stock' => 15],
                        ['name' => 'Apple 20W USB-C Power Adapter Genuine Type', 'unit' => 'pcs', 'price' => 1850, 'mrp' => 1900, 'cost_price' => 1450, 'gst_rate' => 18, 'hsn_code' => '8504', 'stock' => 12],
                        ['name' => 'Boat Rugged v3 Micro USB Cable 1.5m', 'unit' => 'pcs', 'price' => 199, 'mrp' => 399, 'cost_price' => 110, 'gst_rate' => 18, 'hsn_code' => '8544', 'stock' => 30],
                    ],
                ],
                [
                    'category_name' => 'Power Banks & Audio (पावर बैंक एवं इयरबड्स)',
                    'icon' => 'Headphones',
                    'color' => '#3b82f6',
                    'products' => [
                        ['name' => 'Mi 10000mAh 22.5W Fast Charging Power Bank 3i', 'unit' => 'pcs', 'price' => 1299, 'mrp' => 1999, 'cost_price' => 980, 'gst_rate' => 18, 'hsn_code' => '8507', 'stock' => 18],
                        ['name' => 'Ambrane 20000mAh 20W Boosted Power Bank', 'unit' => 'pcs', 'price' => 1699, 'mrp' => 2499, 'cost_price' => 1250, 'gst_rate' => 18, 'hsn_code' => '8507', 'stock' => 10],
                        ['name' => 'Boat Airdopes 141 Bluetooth Wireless TWS Earbuds', 'unit' => 'pcs', 'price' => 1199, 'mrp' => 2990, 'cost_price' => 820, 'gst_rate' => 18, 'hsn_code' => '8518', 'stock' => 20],
                        ['name' => 'OnePlus Bullets Wireless Z2 Bluetooth Neckband', 'unit' => 'pcs', 'price' => 1799, 'mrp' => 2299, 'cost_price' => 1390, 'gst_rate' => 18, 'hsn_code' => '8518', 'stock' => 15],
                    ],
                ],
                [
                    'category_name' => 'Tempered Glass & Covers (ग्लास एवं कवर)',
                    'icon' => 'Shield',
                    'color' => '#10b981',
                    'products' => [
                        ['name' => '11D Edge-to-Edge Super Clear Tempered Glass (Assorted)', 'unit' => 'pcs', 'price' => 99, 'mrp' => 249, 'cost_price' => 28, 'gst_rate' => 18, 'hsn_code' => '7007', 'stock' => 150],
                        ['name' => 'Matte Finish Gaming Anti-Fingerprint Screen Guard', 'unit' => 'pcs', 'price' => 149, 'mrp' => 299, 'cost_price' => 45, 'gst_rate' => 18, 'hsn_code' => '7007', 'stock' => 60],
                        ['name' => 'Transparent Shockproof Silicone Bumper Back Cover', 'unit' => 'pcs', 'price' => 120, 'mrp' => 250, 'cost_price' => 38, 'gst_rate' => 18, 'hsn_code' => '3926', 'stock' => 80],
                        ['name' => 'Premium Leather Magnetic Wallet Flip Cover with Pockets', 'unit' => 'pcs', 'price' => 299, 'mrp' => 599, 'cost_price' => 135, 'gst_rate' => 18, 'hsn_code' => '4202', 'stock' => 40],
                    ],
                ],
            ],

            // ==========================================
            // 6. LAPTOP & COMPUTERS
            // ==========================================
            'laptop' => [
                [
                    'category_name' => 'Keyboards, Mice & Input (कीबोर्ड एवं माउस)',
                    'icon' => 'Mouse',
                    'color' => '#3b82f6',
                    'products' => [
                        ['name' => 'Logitech B170 Wireless Optical Mouse (Black)', 'unit' => 'pcs', 'price' => 649, 'mrp' => 895, 'cost_price' => 490, 'gst_rate' => 18, 'hsn_code' => '8471', 'stock' => 25],
                        ['name' => 'Logitech MK215 Wireless Keyboard and Mouse Combo', 'unit' => 'set', 'price' => 1495, 'mrp' => 1895, 'cost_price' => 1180, 'gst_rate' => 18, 'hsn_code' => '8471', 'stock' => 15],
                        ['name' => 'Zebronics Transformer Gaming RGB Keyboard', 'unit' => 'pcs', 'price' => 999, 'mrp' => 1499, 'cost_price' => 710, 'gst_rate' => 18, 'hsn_code' => '8471', 'stock' => 12],
                    ],
                ],
                [
                    'category_name' => 'SSDs, Memory & Storage (एसएसडी एवं रैम)',
                    'icon' => 'HardDrive',
                    'color' => '#8b5cf6',
                    'products' => [
                        ['name' => 'Crucial BX500 500GB 3D NAND SATA 2.5-inch Internal SSD', 'unit' => 'pcs', 'price' => 2850, 'mrp' => 3600, 'cost_price' => 2350, 'gst_rate' => 18, 'hsn_code' => '8471', 'stock' => 12],
                        ['name' => 'Kingston NV2 1TB M.2 NVMe PCIe 4.0 Internal SSD', 'unit' => 'pcs', 'price' => 5400, 'mrp' => 6800, 'cost_price' => 4500, 'gst_rate' => 18, 'hsn_code' => '8471', 'stock' => 8],
                        ['name' => 'SanDisk Ultra 64GB USB 3.0 High Speed Pen Drive', 'unit' => 'pcs', 'price' => 480, 'mrp' => 650, 'cost_price' => 360, 'gst_rate' => 18, 'hsn_code' => '8523', 'stock' => 30],
                        ['name' => 'Crucial 8GB DDR4 3200MHz Laptop RAM SODIMM', 'unit' => 'pcs', 'price' => 1650, 'mrp' => 2200, 'cost_price' => 1320, 'gst_rate' => 18, 'hsn_code' => '8473', 'stock' => 10],
                    ],
                ],
                [
                    'category_name' => 'Cables, Adapters & Stands (हब एवं स्टैंड)',
                    'icon' => 'Cpu',
                    'color' => '#10b981',
                    'products' => [
                        ['name' => 'AmazonBasics High-Speed 4K HDMI Cable (1.8m)', 'unit' => 'pcs', 'price' => 299, 'mrp' => 499, 'cost_price' => 180, 'gst_rate' => 18, 'hsn_code' => '8544', 'stock' => 25],
                        ['name' => 'Portronics 5-in-1 Type-C Multiport Adapter Hub (HDMI/USB)', 'unit' => 'pcs', 'price' => 1199, 'mrp' => 1999, 'cost_price' => 780, 'gst_rate' => 18, 'hsn_code' => '8471', 'stock' => 14],
                        ['name' => 'Ergonomic Aluminum Adjustable Laptop Riser Stand', 'unit' => 'pcs', 'price' => 699, 'mrp' => 1299, 'cost_price' => 420, 'gst_rate' => 18, 'hsn_code' => '7616', 'stock' => 15],
                    ],
                ],
            ],

            // ==========================================
            // 7. SWEETS & BAKERY
            // ==========================================
            'sweets' => [
                [
                    'category_name' => 'Traditional Sweets / Mithai (पारंपरिक मिठाई)',
                    'icon' => 'Heart',
                    'color' => '#ec4899',
                    'products' => [
                        ['name' => 'Special Kaju Katli (Pure Cashew with Silver Foil)', 'unit' => 'kg', 'price' => 950, 'mrp' => 1050, 'cost_price' => 720, 'gst_rate' => 5, 'hsn_code' => '2106', 'stock' => 30],
                        ['name' => 'Pure Desi Ghee Motichoor Ladoo', 'unit' => 'kg', 'price' => 480, 'mrp' => 540, 'cost_price' => 360, 'gst_rate' => 5, 'hsn_code' => '2106', 'stock' => 40],
                        ['name' => 'Fresh Soft Gulab Jamun (Box of 16 pcs)', 'unit' => 'box', 'price' => 240, 'mrp' => 280, 'cost_price' => 170, 'gst_rate' => 5, 'hsn_code' => '2106', 'stock' => 25],
                        ['name' => 'Sponge Rasgulla Bengali Style (1 kg Can)', 'unit' => 'can', 'price' => 220, 'mrp' => 260, 'cost_price' => 155, 'gst_rate' => 5, 'hsn_code' => '2106', 'stock' => 20],
                    ],
                ],
                [
                    'category_name' => 'Hot Snacks, Samosa & Namkeen (नाश्ता एवं नमकीन)',
                    'icon' => 'Flame',
                    'color' => '#f59e0b',
                    'products' => [
                        ['name' => 'Fresh Hot Crispy Samosa with Chutney (1 pc)', 'unit' => 'pcs', 'price' => 18, 'mrp' => 20, 'cost_price' => 10, 'gst_rate' => 5, 'hsn_code' => '2106', 'stock' => 150],
                        ['name' => 'Gujarati Khaman Soft Dhokla (Plate of 4 pcs)', 'unit' => 'plate', 'price' => 40, 'mrp' => 50, 'cost_price' => 22, 'gst_rate' => 5, 'hsn_code' => '2106', 'stock' => 50],
                        ['name' => 'Ratlami Sev Premium Spicy Namkeen (500g)', 'unit' => 'pack', 'price' => 160, 'mrp' => 180, 'cost_price' => 120, 'gst_rate' => 12, 'hsn_code' => '2106', 'stock' => 30],
                    ],
                ],
                [
                    'category_name' => 'Bakery Cakes & Rusks (केक एवं टोस्ट)',
                    'icon' => 'Cake',
                    'color' => '#8b5cf6',
                    'products' => [
                        ['name' => 'Dutch Chocolate Truffle Cake (500g Regular)', 'unit' => 'pcs', 'price' => 380, 'mrp' => 450, 'cost_price' => 240, 'gst_rate' => 18, 'hsn_code' => '1905', 'stock' => 15],
                        ['name' => 'Fresh Pineapple Pastry Slice (Eggless)', 'unit' => 'pcs', 'price' => 50, 'mrp' => 60, 'cost_price' => 30, 'gst_rate' => 18, 'hsn_code' => '1905', 'stock' => 40],
                        ['name' => 'Crunchy Butter Elaichi Rusk (400g Pack)', 'unit' => 'pack', 'price' => 65, 'mrp' => 75, 'cost_price' => 48, 'gst_rate' => 12, 'hsn_code' => '1905', 'stock' => 50],
                    ],
                ],
            ],

            // ==========================================
            // 8. CAFE & RESTAURANT
            // ==========================================
            'cafe' => [
                [
                    'category_name' => 'Hot Teas & Coffees (गर्म पेय एवं कॉफी)',
                    'icon' => 'Coffee',
                    'color' => '#d97706',
                    'products' => [
                        ['name' => 'Special Cutting Masala Chai in Clay Kulhad', 'unit' => 'cup', 'price' => 20, 'mrp' => 20, 'cost_price' => 8, 'gst_rate' => 5, 'hsn_code' => '2101', 'stock' => 200],
                        ['name' => 'Freshly Brewed Cappuccino / Cafe Latte Regular', 'unit' => 'cup', 'price' => 85, 'mrp' => 99, 'cost_price' => 35, 'gst_rate' => 5, 'hsn_code' => '2101', 'stock' => 100],
                        ['name' => 'Rich Belgian Hot Chocolate with Cocoa', 'unit' => 'cup', 'price' => 110, 'mrp' => 130, 'cost_price' => 45, 'gst_rate' => 5, 'hsn_code' => '1806', 'stock' => 50],
                    ],
                ],
                [
                    'category_name' => 'Cold Coffees & Shakes (कोल्ड कॉफी एवं शेक्स)',
                    'icon' => 'GlassWater',
                    'color' => '#06b6d4',
                    'products' => [
                        ['name' => 'Classic Cold Coffee Frappe with Vanilla Ice Cream', 'unit' => 'glass', 'price' => 110, 'mrp' => 130, 'cost_price' => 48, 'gst_rate' => 5, 'hsn_code' => '2101', 'stock' => 60],
                        ['name' => 'Virgin Mint Lime Mojito Chilled Refresher', 'unit' => 'glass', 'price' => 90, 'mrp' => 110, 'cost_price' => 32, 'gst_rate' => 5, 'hsn_code' => '2202', 'stock' => 60],
                        ['name' => 'Thick Chocolate Brownie Milkshake', 'unit' => 'glass', 'price' => 130, 'mrp' => 150, 'cost_price' => 55, 'gst_rate' => 5, 'hsn_code' => '0402', 'stock' => 40],
                    ],
                ],
                [
                    'category_name' => 'Burgers, Sandwiches & Fries (बर्गर एवं सैंडविच)',
                    'icon' => 'Utensils',
                    'color' => '#ef4444',
                    'products' => [
                        ['name' => 'Crispy Veg Herb Patty Burger with Cheese', 'unit' => 'pcs', 'price' => 89, 'mrp' => 110, 'cost_price' => 42, 'gst_rate' => 5, 'hsn_code' => '2106', 'stock' => 60],
                        ['name' => 'Grilled Bombay Masala Cheese Toast Sandwich', 'unit' => 'pcs', 'price' => 80, 'mrp' => 95, 'cost_price' => 38, 'gst_rate' => 5, 'hsn_code' => '2106', 'stock' => 50],
                        ['name' => 'Classic Salted French Fries (Large Basket)', 'unit' => 'plate', 'price' => 79, 'mrp' => 99, 'cost_price' => 28, 'gst_rate' => 5, 'hsn_code' => '2004', 'stock' => 80],
                        ['name' => 'Margherita Fresh Basil 8-inch Pizza', 'unit' => 'pcs', 'price' => 179, 'mrp' => 210, 'cost_price' => 75, 'gst_rate' => 5, 'hsn_code' => '1905', 'stock' => 40],
                    ],
                ],
            ],

            // ==========================================
            // 9. CLOTHING & GARMENTS
            // ==========================================
            'clothing' => [
                [
                    'category_name' => "Men's Wear (शर्ट एवं जींस)",
                    'icon' => 'Shirt',
                    'color' => '#3b82f6',
                    'products' => [
                        ['name' => "Men's Formal Cotton Slim Fit Shirt (Full Sleeves)", 'unit' => 'pcs', 'price' => 650, 'mrp' => 899, 'cost_price' => 420, 'gst_rate' => 5, 'hsn_code' => '6205', 'stock' => 35],
                        ['name' => "Men's Solid Cotton Casual Polo T-Shirt", 'unit' => 'pcs', 'price' => 380, 'mrp' => 599, 'cost_price' => 240, 'gst_rate' => 5, 'hsn_code' => '6109', 'stock' => 50],
                        ['name' => "Men's Stretchable Denim Jeans Regular Fit (Blue)", 'unit' => 'pcs', 'price' => 850, 'mrp' => 1299, 'cost_price' => 550, 'gst_rate' => 5, 'hsn_code' => '6203', 'stock' => 30],
                    ],
                ],
                [
                    'category_name' => "Women's Ethnic & Daily Wear (कुर्ती एवं साड़ियां)",
                    'icon' => 'Sparkles',
                    'color' => '#ec4899',
                    'products' => [
                        ['name' => "Women's Pure Cotton Printed Straight Kurti", 'unit' => 'pcs', 'price' => 450, 'mrp' => 699, 'cost_price' => 280, 'gst_rate' => 5, 'hsn_code' => '6204', 'stock' => 40],
                        ['name' => 'Banarasi Art Silk Festive Saree with Blouse Piece', 'unit' => 'pcs', 'price' => 1250, 'mrp' => 1899, 'cost_price' => 850, 'gst_rate' => 5, 'hsn_code' => '5407', 'stock' => 20],
                    ],
                ],
            ],

            // ==========================================
            // 10. PHARMACY & MEDICAL
            // ==========================================
            'medical' => [
                [
                    'category_name' => 'OTC Medicines & Pain Relief (सामान्य दवाएं)',
                    'icon' => 'Pill',
                    'color' => '#14b8a6',
                    'products' => [
                        ['name' => 'Dolo 650mg Paracetamol Tablets (Strip of 15)', 'unit' => 'strip', 'price' => 32, 'mrp' => 33.60, 'cost_price' => 26, 'gst_rate' => 12, 'hsn_code' => '3004', 'stock' => 100],
                        ['name' => 'Crocin Pain Relief Tablet (Strip of 10)', 'unit' => 'strip', 'price' => 65, 'mrp' => 70, 'cost_price' => 54, 'gst_rate' => 12, 'hsn_code' => '3004', 'stock' => 60],
                        ['name' => 'Combiflam Pain Relief Tablets (Strip of 20)', 'unit' => 'strip', 'price' => 48, 'mrp' => 52, 'cost_price' => 39, 'gst_rate' => 12, 'hsn_code' => '3004', 'stock' => 80],
                    ],
                ],
                [
                    'category_name' => 'First Aid & Health Drinks (प्राथमिक उपचार एवं पोषण)',
                    'icon' => 'Cross',
                    'color' => '#ef4444',
                    'products' => [
                        ['name' => 'Dettol Antiseptic Liquid (100ml Bottle)', 'unit' => 'bottle', 'price' => 39, 'mrp' => 42, 'cost_price' => 32, 'gst_rate' => 18, 'hsn_code' => '3808', 'stock' => 40],
                        ['name' => 'Hansaplast Adhesive Medicated Bandages (Pack of 10)', 'unit' => 'pack', 'price' => 30, 'mrp' => 35, 'cost_price' => 22, 'gst_rate' => 12, 'hsn_code' => '3005', 'stock' => 80],
                        ['name' => 'Horlicks Classic Malt Nutrition Drink (500g Jar)', 'unit' => 'jar', 'price' => 265, 'mrp' => 290, 'cost_price' => 225, 'gst_rate' => 18, 'hsn_code' => '1901', 'stock' => 30],
                    ],
                ],
            ],

            // ==========================================
            // 11. OTHER CUSTOM RETAIL STORE
            // ==========================================
            'other' => [
                [
                    'category_name' => 'General Merchandise (दुकान का मुख्य सामान)',
                    'icon' => 'Package',
                    'color' => '#3b82f6',
                    'products' => [
                        ['name' => 'Standard Retail Product A (Fast Moving Item)', 'unit' => 'pcs', 'price' => 100, 'mrp' => 120, 'cost_price' => 75, 'gst_rate' => 18, 'hsn_code' => '9999', 'stock' => 50],
                        ['name' => 'Standard Retail Product B (Regular Item)', 'unit' => 'pcs', 'price' => 250, 'mrp' => 300, 'cost_price' => 190, 'gst_rate' => 18, 'hsn_code' => '9999', 'stock' => 40],
                    ],
                ],
                [
                    'category_name' => 'Special Accessories & Add-ons (एक्सेसरीज एवं विविध)',
                    'icon' => 'Boxes',
                    'color' => '#10b981',
                    'products' => [
                        ['name' => 'Shop Premium Accessory Pack', 'unit' => 'pcs', 'price' => 75, 'mrp' => 95, 'cost_price' => 52, 'gst_rate' => 18, 'hsn_code' => '9999', 'stock' => 60],
                    ],
                ],
            ],
        ];
    }
}
