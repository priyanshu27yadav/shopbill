import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  Sparkles,
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
  Search,
  Package,
  Layers,
  Loader2,
  Tag,
  Percent,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { categoryApi, productApi } from '../../api';
import { Category, Product } from '../../types';
import { useAuth } from '../../context/AuthContext';

const TEMPLATES = [
  { id: 'electrical', name: 'Electrical Store', hindi: 'इलेक्ट्रिकल (वायर, स्विच, इनवर्टर, बल्ब)', icon: Zap, color: 'text-amber-500' },
  { id: 'hardware', name: 'Hardware & Sanitary', hindi: 'हार्डवेयर (टूल्स, पेंट, पाइप, फिटिंग्स)', icon: Wrench, color: 'text-rose-500' },
  { id: 'grocery', name: 'Grocery & Kirana', hindi: 'किराना (अनाज, तेल, मसाले, आटा)', icon: ShoppingBag, color: 'text-emerald-500' },
  { id: 'general', name: 'General Store', hindi: 'जनरल स्टोर (बिस्कुट, स्टेशनरी, स्नैक्स)', icon: Store, color: 'text-purple-500' },
  { id: 'mobile', name: 'Mobile & Accessories', hindi: 'मोबाइल (चार्जर, इयरबड्स, ग्लास, कवर)', icon: Smartphone, color: 'text-cyan-500' },
  { id: 'laptop', name: 'Laptop & Computers', hindi: 'कंप्यूटर (माउस, SSD, केबल्स, वाई-फाई)', icon: Laptop, color: 'text-blue-500' },
  { id: 'sweets', name: 'Sweets & Bakery', hindi: 'मिठाई एवं बेकरी (काजू कतली, समोसा, केक)', icon: Cake, color: 'text-pink-500' },
  { id: 'cafe', name: 'Cafe & Restaurant', hindi: 'कैफे (चाय, कॉफी, बर्गर, पिज़्ज़ा)', icon: Coffee, color: 'text-amber-600' },
  { id: 'clothing', name: 'Clothing & Garments', hindi: 'कपड़ा दुकान (शर्ट, जींस, कुर्ती, साड़ी)', icon: Shirt, color: 'text-indigo-500' },
  { id: 'medical', name: 'Pharmacy & Medical', hindi: 'दवा दुकान (पेन रिलीफ, फर्स्ट एड, बेबी केयर)', icon: Cross, color: 'text-teal-500' },
  { id: 'other', name: 'Custom Retail', hindi: 'अन्य कोई भी खुदरा व्यापार', icon: Boxes, color: 'text-slate-500' },
];

const COMMON_UNITS = ['pcs', 'mtr', 'box', 'roll', 'set', 'pack', 'pair', 'kg', 'gm', 'ltr', 'ml'];
const GST_RATES = [0, 5, 12, 18, 28];

export const CategoryManager: React.FC = () => {
  const { shop } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Category Edit/Add Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');

  // Selected Category Drill-down
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Product Add / Edit Modal inside Category
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    default_price: '',
    mrp: '',
    unit: 'pcs',
    gst_rate: '18',
    hsn_code: '',
    barcode: '',
    description: '',
  });
  const [productSaving, setProductSaving] = useState(false);

  // Industry Template Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('electrical');
  const [seedingLoading, setSeedingLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryApi.list();
      setCategories(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Load items for the selected category
  const handleSelectCategory = async (cat: Category) => {
    if (selectedCategory?.id === cat.id) {
      // Toggle off if already selected
      setSelectedCategory(null);
      setCategoryProducts([]);
      return;
    }

    setSelectedCategory(cat);
    setProductsLoading(true);
    setProductSearch('');
    try {
      const res = await productApi.list({ category_id: cat.id, all: true });
      setCategoryProducts(Array.isArray(res.data) ? res.data : (res.data?.data || []));
      // Smooth scroll to items section
      setTimeout(() => {
        const el = document.getElementById('category-items-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err) {
      console.error('Error fetching products for category:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDescription('');
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (c: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(c);
    setCatName(c.name);
    setCatDescription(c.description || '');
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this category? All items must be removed first.')) return;
    try {
      await categoryApi.delete(id);
      setCategories(categories.filter((c) => c.id !== id));
      if (selectedCategory?.id === id) {
        setSelectedCategory(null);
        setCategoryProducts([]);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete category.');
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      if (editingCategory) {
        const res = await categoryApi.update(editingCategory.id, {
          name: catName.trim(),
          description: catDescription.trim() || null,
        });
        setCategories(categories.map((c) => (c.id === editingCategory.id ? res.data.category : c)));
        if (selectedCategory?.id === editingCategory.id) {
          setSelectedCategory(res.data.category);
        }
      } else {
        const res = await categoryApi.create({
          name: catName.trim(),
          description: catDescription.trim() || null,
        });
        setCategories([...categories, res.data.category]);
      }
      setShowCategoryModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving category.');
    }
  };

  // Quick sync all trade categories for this shop
  const handleQuickSyncTradeCategories = async () => {
    const trade = shop?.business_type || 'electrical';
    setSyncLoading(true);
    try {
      const res = await categoryApi.applyTemplate(trade);
      alert(res.data.message || 'Trade categories and items synced successfully!');
      await loadCategories();
      if (selectedCategory) {
        const updatedCat = categories.find((c) => c.id === selectedCategory.id);
        if (updatedCat) {
          handleSelectCategory(updatedCat);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to sync categories.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleApplyTemplateModal = async () => {
    setSeedingLoading(true);
    try {
      const res = await categoryApi.applyTemplate(selectedTemplate);
      alert(res.data.message || 'Template applied successfully!');
      setShowTemplateModal(false);
      await loadCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to apply category template.');
    } finally {
      setSeedingLoading(false);
    }
  };

  // Product inside category handlers
  const handleOpenAddProduct = () => {
    if (!selectedCategory) return;
    setEditingProduct(null);
    setProductFormData({
      name: '',
      default_price: '',
      mrp: '',
      unit: 'pcs',
      gst_rate: '18',
      hsn_code: '',
      barcode: '',
      description: '',
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(prod);
    setProductFormData({
      name: prod.name,
      default_price: String(prod.default_price || ''),
      mrp: String(prod.mrp || prod.default_price || ''),
      unit: prod.unit || 'pcs',
      gst_rate: String(prod.gst_rate ?? '18'),
      hsn_code: prod.hsn_code || '',
      barcode: prod.barcode || '',
      description: prod.description || '',
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await productApi.delete(id);
      setCategoryProducts(categoryProducts.filter((p) => p.id !== id));
      // update category count
      setCategories((prev) =>
        prev.map((c) => (c.id === selectedCategory?.id ? { ...c, products_count: Math.max(0, (c.products_count || 1) - 1) } : c))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete item.');
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !productFormData.name.trim() || !productFormData.default_price) {
      alert('Please enter Item Name and Price.');
      return;
    }

    setProductSaving(true);
    try {
      const payload = {
        category_id: selectedCategory.id,
        name: productFormData.name.trim(),
        default_price: parseFloat(productFormData.default_price),
        mrp: productFormData.mrp ? parseFloat(productFormData.mrp) : parseFloat(productFormData.default_price),
        unit: productFormData.unit,
        gst_rate: parseFloat(productFormData.gst_rate || '0'),
        hsn_code: productFormData.hsn_code.trim() || null,
        barcode: productFormData.barcode.trim() || null,
        description: productFormData.description.trim() || null,
        is_tax_inclusive: true,
      };

      if (editingProduct) {
        const res = await productApi.update(editingProduct.id, payload);
        const updated = res.data.product || res.data;
        setCategoryProducts(categoryProducts.map((p) => (p.id === editingProduct.id ? updated : p)));
      } else {
        const res = await productApi.create(payload);
        const created = res.data.product || res.data;
        setCategoryProducts([created, ...categoryProducts]);
        // increment category count
        setCategories((prev) =>
          prev.map((c) => (c.id === selectedCategory.id ? { ...c, products_count: (c.products_count || 0) + 1 } : c))
        );
      }
      setShowProductModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving item.');
    } finally {
      setProductSaving(false);
    }
  };

  // Filtered products within selected category
  const filteredCategoryProducts = categoryProducts.filter((p) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.hsn_code && p.hsn_code.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      String(p.default_price).includes(q)
    );
  });

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-emerald-600" />
            <span>Product Categories (सामान की श्रेणियां)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kisi bhi category par click karein uske sabhi items dekhne, naye items add karne ya edit karne ke liye.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick sync trade categories */}
          <button
            onClick={handleQuickSyncTradeCategories}
            disabled={syncLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition-all disabled:opacity-50"
            title="Dukaan ke trade category ke sabhi naye categories aur branded items auto-sync karein"
          >
            {syncLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-500" />
            )}
            <span>⚡ Add More Trade Categories</span>
          </button>

          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all"
          >
            <Layers className="w-4 h-4" />
            <span>Industry Templates</span>
          </button>

          <button
            onClick={handleOpenAddCategory}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Category</span>
          </button>
        </div>
      </div>

      {/* Loading categories state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-xs font-medium">Loading shop categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <FolderTree className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">No categories found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Aapki shop me abhi koi category nahi hai. "⚡ Add More Trade Categories" button click karein instant 14+ categories aur 70+ branded items load karne ke liye!
          </p>
          <button
            onClick={handleQuickSyncTradeCategories}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load Trade Categories Now</span>
          </button>
        </div>
      ) : (
        /* Categories Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {categories.map((cat) => {
            const isSelected = selectedCategory?.id === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => handleSelectCategory(cat)}
                className={`group cursor-pointer rounded-2xl p-4 border transition-all duration-150 flex flex-col justify-between relative select-none ${
                  isSelected
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/25 border-emerald-500 ring-2 ring-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5 leading-snug">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || '#10b981' }}
                      />
                      <span>{cat.name}</span>
                    </h3>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 group-hover:text-emerald-700'
                      }`}
                    >
                      {cat.products_count ?? 0} items
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {cat.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    {isSelected ? (
                      <span className="flex items-center gap-1 font-black">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Viewing Items ↓
                      </span>
                    ) : (
                      <span className="group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        Click to view items ({cat.products_count ?? 0}) →
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Edit Category"
                      onClick={(e) => handleOpenEditCategory(cat, e)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete Category"
                      onClick={(e) => handleDeleteCategory(cat.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Category Drill-down / Items Inspector */}
      {selectedCategory && (
        <div
          id="category-items-section"
          className="bg-white dark:bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 animate-in fade-in duration-200"
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                style={{ backgroundColor: selectedCategory.color || '#10b981' }}
              >
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {selectedCategory.name}
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {categoryProducts.length} items listed
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedCategory.description || 'Category items management'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Item to this Category</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setCategoryProducts([]);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Close Category Items View"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search within this category */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder={`Search in ${selectedCategory.name} (name, price, HSN)...`}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              {productSearch && (
                <button
                  onClick={() => setProductSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing {filteredCategoryProducts.length} of {categoryProducts.length} items
            </div>
          </div>

          {/* Items Content */}
          {productsLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
              <p className="text-xs">Loading items for {selectedCategory.name}...</p>
            </div>
          ) : filteredCategoryProducts.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {productSearch ? 'No items match your search.' : 'No products in this category yet.'}
              </p>
              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Item</span>
              </button>
            </div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Item Name & Brand</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Selling Price (₹)</th>
                      <th className="py-3 px-4">MRP (₹)</th>
                      <th className="py-3 px-4">GST Rate</th>
                      <th className="py-3 px-4">HSN / Barcode</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900 font-medium">
                    {filteredCategoryProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {prod.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono">
                            {prod.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400">
                          ₹{Number(prod.default_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-slate-400 line-through">
                          {prod.mrp ? `₹${Number(prod.mrp).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                            {prod.gst_rate}% GST
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {prod.hsn_code || prod.barcode || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditProduct(prod, e)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Item"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteProduct(prod.id, e)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden space-y-2.5">
                {filteredCategoryProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                        {prod.name}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditProduct(prod, e)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-white dark:hover:bg-slate-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteProduct(prod.id, e)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-white dark:hover:bg-slate-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          ₹{Number(prod.default_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        {prod.mrp && Number(prod.mrp) > Number(prod.default_price) && (
                          <span className="text-[10px] text-slate-400 line-through">
                            ₹{Number(prod.mrp).toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                          /{prod.unit}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                        {prod.gst_rate}% GST
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {showProductModal && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  <span>{editingProduct ? 'Edit Item' : 'Add New Item to Category'}</span>
                </h3>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                  Category: {selectedCategory.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Item Name & Brand *
                </label>
                <input
                  type="text"
                  required
                  value={productFormData.name}
                  onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                  placeholder="e.g. Havells Life Line Wire 1.5 sq mm Red (90m Box)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={productFormData.default_price}
                    onChange={(e) => setProductFormData({ ...productFormData, default_price: e.target.value })}
                    placeholder="e.g. 1450"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productFormData.mrp}
                    onChange={(e) => setProductFormData({ ...productFormData, mrp: e.target.value })}
                    placeholder="e.g. 1750"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unit *
                  </label>
                  <select
                    value={productFormData.unit}
                    onChange={(e) => setProductFormData({ ...productFormData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    GST Rate (%)
                  </label>
                  <select
                    value={productFormData.gst_rate}
                    onChange={(e) => setProductFormData({ ...productFormData, gst_rate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {GST_RATES.map((r) => (
                      <option key={r} value={r}>
                        {r}% GST
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={productFormData.hsn_code}
                    onChange={(e) => setProductFormData({ ...productFormData, hsn_code: e.target.value })}
                    placeholder="e.g. 8544"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Barcode / SKU
                  </label>
                  <input
                    type="text"
                    value={productFormData.barcode}
                    onChange={(e) => setProductFormData({ ...productFormData, barcode: e.target.value })}
                    placeholder="Optional barcode"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Specification
                </label>
                <textarea
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  placeholder="Optional details, dimensions, warranty, etc."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={productSaving}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {productSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Update Item' : 'Save Item to Category'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Category Add / Edit Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Inverters, Batteries & Solar"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Brief description of items in this category"
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Industry Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-xl w-full p-4 sm:p-6 text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    Import Industry Catalogue Template
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Chuniye aur apni dukaan me instant pre-stocked categories & items load kijiye!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TEMPLATES.map((tmpl) => {
                const IconComponent = tmpl.icon;
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/30'
                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${tmpl.color}`} />
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-white truncate">{tmpl.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{tmpl.hindi}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <p className="text-[11px] text-slate-400">
                Standard Indian retail brands, prices & GST rates pre-stocked.
              </p>
              <button
                type="button"
                disabled={seedingLoading}
                onClick={handleApplyTemplateModal}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20 disabled:opacity-50 shrink-0 flex items-center gap-1.5"
              >
                {seedingLoading ? 'Importing Items...' : 'Add Items to Shop →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
