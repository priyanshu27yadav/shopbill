import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Zap,
  Wrench,
  ShoppingBag,
  Store,
  Smartphone,
  Laptop,
  Cake,
  Coffee,
  Shirt,
  Cross,
  Boxes,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  Building2,
  Check,
  ChevronDown,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';

interface BusinessCategoryOption {
  id: string;
  name: string;
  hindi_name: string;
  iconName: string;
  color: string;
  badge: string;
  placeholder: string;
  description: string;
  preview_categories: string[];
}

const BUSINESS_CATEGORIES: BusinessCategoryOption[] = [
  {
    id: 'electrical',
    name: 'Electrical Store',
    hindi_name: 'इलेक्ट्रिकल दुकान',
    iconName: 'Zap',
    color: 'from-amber-500 to-yellow-600',
    badge: 'Wires, Switches & Lighting',
    placeholder: 'e.g. Anand Electricals & Light House',
    description: 'Wires (Havells, Polycab), Switches (Anchor Roma), MCBs, LED Bulbs & Fans.',
    preview_categories: [
      'Wires & Cables (Havells, Polycab, Finolex 1.0, 1.5, 2.5 mm)',
      'Modular Switches & Sockets (Anchor Roma, Legrand, Fabio)',
      'LED Bulbs & Battens (Philips 9W/12W, Crompton 20W)',
      'MCBs & Distribution Boxes (Schneider, L&T 16A/32A)',
      'Ceiling Fans & Heaters (Orient, Crompton, Bajaj)',
      'PVC Conduit Pipes & Insulation Tapes (VIP, Steelgrip)',
    ],
  },
  {
    id: 'hardware',
    name: 'Hardware & Sanitary',
    hindi_name: 'हार्डवेयर एवं सेनेटरी',
    iconName: 'Wrench',
    color: 'from-red-500 to-rose-600',
    badge: 'Tools, Paints & Plumbing',
    placeholder: 'e.g. Kisan Hardware & Sanitary Store',
    description: 'Tools (Taparia), Paints (Asian Paints), CPVC Pipes (Astral), Locks & Adhesives.',
    preview_categories: [
      'Hand Tools & Measure (Taparia Pliers, Stanley Hammer)',
      'Paints, Primers & Brushes (Asian Paints, Berger 4L)',
      'Plumbing & CPVC Pipes (Astral, Supreme Fittings)',
      'Door Fittings & Brass Locks (Godrej Navtal)',
      'Adhesives & Waterproofing (Fevicol SH, Dr. Fixit, M-Seal)',
    ],
  },
  {
    id: 'grocery',
    name: 'Grocery & Kirana',
    hindi_name: 'किराना एवं सुपरमार्केट',
    iconName: 'ShoppingBag',
    color: 'from-emerald-500 to-teal-600',
    badge: 'Grains, Oil & FMCG',
    placeholder: 'e.g. Laxmi Kirana & Supermarket',
    description: 'Atta & Rice (Fortune, Aashirvaad), Edible Oils, Spices (MDH), Soaps & Cleaners.',
    preview_categories: [
      'Atta, Rice & Grains (Aashirvaad 10kg, Fortune Basmati)',
      'Cooking Oils & Pure Ghee (Amul Ghee, Dhara Mustard Oil)',
      'Spices & Masalas (Tata Salt, MDH Deggi Mirch, Everest)',
      'Personal Care & Soaps (Dettol 4-pack, Colgate 200g)',
      'Detergents & Cleaners (Surf Excel 1kg, Vim Gel 500ml)',
    ],
  },
  {
    id: 'general',
    name: 'General Store',
    hindi_name: 'जनरल स्टोर एवं डेली नीड्स',
    iconName: 'Store',
    color: 'from-purple-500 to-indigo-600',
    badge: 'Snacks, Stationery & Care',
    placeholder: 'e.g. City Mart & Daily Needs Store',
    description: 'Packaged Biscuits, Cold Drinks, School Stationery (Classmate) & Puja items.',
    preview_categories: [
      'Biscuits, Snacks & Chocolates (Parle-G, Dairy Milk, Aloo Bhujia)',
      'Beverages & Soft Drinks (Coca-Cola 750ml, Real Juice, Red Bull)',
      'Stationery & School Needs (Classmate Notebooks, Reynolds Pens)',
      'Toiletries & Grooming (Gillette Razor, Nivea Cream)',
      'Puja Samagri & Daily Household Goods (Cycle Agarbatti, Camphor)',
    ],
  },
  {
    id: 'mobile',
    name: 'Mobile & Accessories',
    hindi_name: 'मोबाइल एवं एक्सेसरीज',
    iconName: 'Smartphone',
    color: 'from-cyan-500 to-blue-600',
    badge: 'Cables, Earbuds & Covers',
    placeholder: 'e.g. Star Mobile & Telecom Hub',
    description: 'Fast Chargers (Boat, Portronics), Power Banks (Mi), Earbuds & 11D Glass.',
    preview_categories: [
      'Fast Cables & Adapters (Boat 65W Type-C, Apple 20W Adapter)',
      'High Capacity Power Banks (Mi 10000mAh, Ambrane 20000mAh)',
      'Wireless Earbuds & Headphones (Boat Airdopes, OnePlus Bullets)',
      '11D Tempered Glass & Matte Gaming Screen Protectors',
      'Silicone Shockproof & Leather Wallet Back Covers',
    ],
  },
  {
    id: 'laptop',
    name: 'Laptop & Computers',
    hindi_name: 'लैपटॉप एवं कंप्यूटर',
    iconName: 'Laptop',
    color: 'from-blue-600 to-indigo-700',
    badge: 'Mice, SSDs & Adapters',
    placeholder: 'e.g. Apex Infotech & Laptop Care',
    description: 'Wireless Mice (Logitech), High Speed SSDs (Crucial, Kingston) & USB Hubs.',
    preview_categories: [
      'Wireless Keyboards & Optical Mice (Logitech B170, Combo)',
      'SSDs, Pendrives & RAM (Crucial 500GB, Kingston 1TB NVMe, SanDisk)',
      'HDMI Cables, Type-C 5-in-1 Multiport Hubs & Patch Cables',
      'Laptop Backpacks & Ergonomic Aluminum Stands',
    ],
  },
  {
    id: 'sweets',
    name: 'Sweets & Bakery',
    hindi_name: 'मिठाई एवं बेकरी',
    iconName: 'Cake',
    color: 'from-pink-500 to-rose-600',
    badge: 'Mithai, Namkeen & Cakes',
    placeholder: 'e.g. Bikaner Sweets & Bakery',
    description: 'Desi Ghee Mithai (Kaju Katli, Ladoo), Hot Samosa, Pastries & Rusk.',
    preview_categories: [
      'Traditional Sweets (Special Kaju Katli, Desi Ghee Ladoo, Gulab Jamun)',
      'Fresh Hot Snacks (Crispy Samosa, Khaman Dhokla, Ratlami Sev)',
      'Bakery Cakes & Pastries (Chocolate Truffle Cake, Pineapple Pastry)',
      'Butter Elaichi Rusk & Nan Khatai Traditional Cookies',
    ],
  },
  {
    id: 'cafe',
    name: 'Cafe & Restaurant',
    hindi_name: 'कैफे एवं रेस्टोरेंट',
    iconName: 'Coffee',
    color: 'from-amber-600 to-orange-700',
    badge: 'Chai, Coffee, Burgers & Pizza',
    placeholder: 'e.g. Chai Shai Cafe & Fast Food',
    description: 'Masala Chai, Cappuccino, Cold Coffee, Burgers, Thin Crust Pizza & Fries.',
    preview_categories: [
      'Hot Kulhad Masala Chai & Fresh Cappuccino',
      'Cold Coffee Frappe with Ice Cream & Mint Mojitos',
      'Crispy Veg Cheese Burgers & Grilled Masala Sandwiches',
      'Margherita & Farmhouse Pizzas, White Sauce Pasta',
      'Classic Salted French Fries & Loaded Cheese Nachos',
    ],
  },
  {
    id: 'clothing',
    name: 'Clothing & Garments',
    hindi_name: 'कपड़ा दुकान एवं गारमेंट्स',
    iconName: 'Shirt',
    color: 'from-indigo-500 to-violet-600',
    badge: 'Shirts, Jeans & Sarees',
    placeholder: 'e.g. Royal Fashion Garments',
    description: 'Men Formal Shirts, Casual Jeans, Daily Wear Kurtis & Silk Sarees.',
    preview_categories: [
      "Men's Formal Cotton Shirts & Casual Polo T-Shirts",
      "Men's Stretchable Denim Jeans & Cotton Chinos",
      "Women's Printed Cotton Kurtis & Banarasi Silk Sarees",
      "Kids Wear Sets & Comfortable Innerwear",
    ],
  },
  {
    id: 'medical',
    name: 'Pharmacy & Medical',
    hindi_name: 'दवा दुकान एवं फार्मेसी',
    iconName: 'Cross',
    color: 'from-teal-500 to-emerald-600',
    badge: 'Medicines & Health Care',
    placeholder: 'e.g. Sanjeevani Medical & Healthcare',
    description: 'OTC Pain Relief, First Aid (Dettol, Band-Aid) & Health Supplements.',
    preview_categories: [
      'OTC Pain & Fever Relief (Dolo 650, Crocin, Combiflam)',
      'First Aid & Antiseptics (Dettol Liquid 100ml, Hansaplast)',
      'Nutrition & Health Supplements (Horlicks 500g, Revital H)',
    ],
  },
  {
    id: 'other',
    name: 'Other Retail Store',
    hindi_name: 'अन्य कोई भी व्यवसाय',
    iconName: 'Boxes',
    color: 'from-slate-600 to-slate-700',
    badge: 'Custom Retail Catalog',
    placeholder: 'e.g. Shree Balaji Retail Store',
    description: 'Customizable categories and starter template items for any custom retail trade.',
    preview_categories: [
      'General Merchandise & Fast Moving Retail Goods',
      'Special Accessories, Bundles & Store Add-ons',
    ],
  },
];

export const RegisterScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('electrical');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    shop_name: '',
    business_type: 'electrical',
    city: '',
    state: '',
    gstin: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const activeCategoryObj =
    BUSINESS_CATEGORIES.find((c) => c.id === selectedCategory) || BUSINESS_CATEGORIES[0];

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    const cat = BUSINESS_CATEGORIES.find((c) => c.id === catId);
    setFormData((prev) => ({
      ...prev,
      business_type: catId,
      shop_name: prev.shop_name ? prev.shop_name : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register({
        ...formData,
        business_type: selectedCategory,
      });
      // Redirect straight to Fast Billing POS where categories and items are pre-loaded
      navigate('/billing');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to render category icon
  const renderCategoryIcon = (iconName: string, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'Zap':
        return <Zap className={className} />;
      case 'Wrench':
        return <Wrench className={className} />;
      case 'ShoppingBag':
        return <ShoppingBag className={className} />;
      case 'Store':
        return <Store className={className} />;
      case 'Smartphone':
        return <Smartphone className={className} />;
      case 'Laptop':
        return <Laptop className={className} />;
      case 'Cake':
        return <Cake className={className} />;
      case 'Coffee':
        return <Coffee className={className} />;
      case 'Shirt':
        return <Shirt className={className} />;
      case 'Cross':
        return <Cross className={className} />;
      default:
        return <Boxes className={className} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between py-6 px-3 sm:py-10 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="w-full max-w-4xl mx-auto text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Instant Business Setup & Auto-Catalogue</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Create Your Shop Account
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Apni dukaan ki category chunein. Portal me automatically branded items, categories aur prices pre-load ho jayenge!
        </p>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-4xl mx-auto bg-slate-800/90 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 backdrop-blur-md">
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: BUSINESS CATEGORY SELECTION */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-xs font-black flex items-center justify-center">
                  1
                </span>
                <span>Select Your Shop Category (दुकान की श्रेणी चुनें) *</span>
              </label>
              <span className="text-[11px] text-emerald-400 font-semibold hidden sm:inline-block">
                Auto-generates relevant items & brands
              </span>
            </div>

            {/* Responsive Grid of Category Cards (2 cols on mobile, 4 cols on desktop) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {BUSINESS_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`relative p-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-900/60 border-slate-700/70 hover:border-slate-600 hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Top Icon & Badge */}
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${cat.color} shadow-sm`}
                      >
                        {renderCategoryIcon(cat.iconName, 'w-4 h-4 sm:w-5 sm:h-5')}
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    {/* Titles */}
                    <div>
                      <div className="text-xs sm:text-sm font-extrabold text-white leading-tight">
                        {cat.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {cat.hindi_name}
                      </div>
                    </div>

                    {/* Mini pill */}
                    <div className="mt-2 text-[10px] text-emerald-400/90 font-medium truncate bg-slate-950/40 px-2 py-0.5 rounded-md border border-slate-800">
                      {cat.badge}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* PREVIEW OF WHAT ITEMS WILL BE GENERATED */}
            <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>
                  Portal me auto-generate hone wale categories aur branded items ({activeCategoryObj.name}):
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {activeCategoryObj.preview_categories.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-200"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 2: SHOP & OWNER CREDENTIALS */}
          <div className="pt-4 border-t border-slate-700/70 space-y-4">
            <label className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-xs font-black flex items-center justify-center">
                2
              </span>
              <span>Shop & Owner Details (दुकान एवं संचालक विवरण)</span>
            </label>

            {/* Shop Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Shop / Store Name * (दुकान का नाम)
              </label>
              <input
                type="text"
                required
                value={formData.shop_name}
                onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                placeholder={activeCategoryObj.placeholder}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-semibold"
              />
            </div>

            {/* Owner Name & Mobile Number (Responsive 2 cols or 1 col on mobile) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Owner Full Name * (संचालक का नाम)
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rajesh Kumar Sharma"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mobile Number * (मोबाइल नंबर)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                      })
                    }
                    placeholder="9876543210"
                    className="w-full pl-11 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono tracking-wider font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Email & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address * (लॉगिन ईमेल)
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rajesh@store.com"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Create Password * (पासवर्ड)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* City & Optional GSTIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  City / Town (शहर)
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Jaipur, Patna, Varanasi"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>GSTIN Number (Optional)</span>
                  <span className="text-[10px] text-slate-500">Non-GST if empty</span>
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={formData.gstin}
                  onChange={(e) =>
                    setFormData({ ...formData, gstin: e.target.value.toUpperCase() })
                  }
                  placeholder="29AAAAA0000A1Z5"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 uppercase font-mono"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON - Big, touch-friendly, high contrast for mobile */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Setting up {activeCategoryObj.name} & Items...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Launch {activeCategoryObj.name} POS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              ✓ Free 30-Day Trial Included • Pre-stocked Items • Instant Billing
            </p>
          </div>
        </form>

        {/* Bottom Login Link */}
        <div className="mt-6 pt-4 border-t border-slate-700/70 text-center text-xs text-slate-400">
          Already registered your shop?{' '}
          <Link
            to="/login"
            className="font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
          >
            Sign In to Store →
          </Link>
        </div>
      </div>
    </div>
  );
};
