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
} from 'lucide-react';
import { categoryApi } from '../../api';
import { Category } from '../../types';

const TEMPLATES = [
  { id: 'electrical', name: 'Electrical Store', hindi: 'इलेक्ट्रिकल (वायर, स्विच, बल्ब)', icon: Zap, color: 'text-amber-500' },
  { id: 'hardware', name: 'Hardware & Sanitary', hindi: 'हार्डवेयर (टूल्स, पेंट, पाइप)', icon: Wrench, color: 'text-rose-500' },
  { id: 'grocery', name: 'Grocery & Kirana', hindi: 'किराना (अनाज, तेल, मसाले)', icon: ShoppingBag, color: 'text-emerald-500' },
  { id: 'general', name: 'General Store', hindi: 'जनरल स्टोर (बिस्कुट, स्टेशनरी)', icon: Store, color: 'text-purple-500' },
  { id: 'mobile', name: 'Mobile & Accessories', hindi: 'मोबाइल (चार्जर, इयरबड्स, ग्लास)', icon: Smartphone, color: 'text-cyan-500' },
  { id: 'laptop', name: 'Laptop & Computers', hindi: 'कंप्यूटर (माउस, SSD, केबल्स)', icon: Laptop, color: 'text-blue-500' },
  { id: 'sweets', name: 'Sweets & Bakery', hindi: 'मिठाई एवं बेकरी (काजू कतली, समोसा, केक)', icon: Cake, color: 'text-pink-500' },
  { id: 'cafe', name: 'Cafe & Restaurant', hindi: 'कैफे (चाय, कॉफी, बर्गर, पिज़्ज़ा)', icon: Coffee, color: 'text-amber-600' },
  { id: 'clothing', name: 'Clothing & Garments', hindi: 'कपड़ा दुकान (शर्ट, जींस, कुर्ती)', icon: Shirt, color: 'text-indigo-500' },
  { id: 'medical', name: 'Pharmacy & Medical', hindi: 'दवा दुकान (पेन रिलीफ, फर्स्ट एड)', icon: Cross, color: 'text-teal-500' },
  { id: 'other', name: 'Custom Retail', hindi: 'अन्य कोई भी व्यवसाय', icon: Boxes, color: 'text-slate-500' },
];

export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Industry Template Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('electrical');
  const [seedingLoading, setSeedingLoading] = useState(false);

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

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setShowModal(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setDescription(c.description || '');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await categoryApi.delete(id);
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete category.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingCategory) {
        const res = await categoryApi.update(editingCategory.id, {
          name: name.trim(),
          description: description.trim() || null,
        });
        setCategories(categories.map((c) => (c.id === editingCategory.id ? res.data.category : c)));
      } else {
        const res = await categoryApi.create({
          name: name.trim(),
          description: description.trim() || null,
        });
        setCategories([...categories, res.data.category]);
      }
      setShowModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving category.');
    }
  };

  const handleApplyTemplate = async () => {
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

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-emerald-600" />
            <span>Product Categories (सामान की श्रेणियां)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize products by trade categories (Electrical, Hardware, Grocery, Mobile, etc.)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load Industry Template</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-800 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {cat.name}
                </h3>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {cat.products_count ?? 0} items
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">
                {cat.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleOpenEdit(cat)}
                className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Wires & Cables"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of items in this category"
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
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
                Ye aapke store me standard Indian market brands, prices & GST rates add karega.
              </p>
              <button
                type="button"
                disabled={seedingLoading}
                onClick={handleApplyTemplate}
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
