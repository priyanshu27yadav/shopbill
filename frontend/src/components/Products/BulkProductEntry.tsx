import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Category, ProductUnit } from '../../types';
import { productApi } from '../../api';

interface BulkProductEntryProps {
  categories: Category[];
  units: ProductUnit[];
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkProductEntry: React.FC<BulkProductEntryProps> = ({
  categories,
  units,
  onClose,
  onSuccess,
}) => {
  const [rows, setRows] = useState([
    { name: '', category_id: categories[0]?.id || 1, unit: 'pcs', default_price: '', gst_rate: '0', hsn_code: '' },
    { name: '', category_id: categories[0]?.id || 1, unit: 'pcs', default_price: '', gst_rate: '0', hsn_code: '' },
    { name: '', category_id: categories[0]?.id || 1, unit: 'pcs', default_price: '', gst_rate: '0', hsn_code: '' },
    { name: '', category_id: categories[0]?.id || 1, unit: 'pcs', default_price: '', gst_rate: '0', hsn_code: '' },
    { name: '', category_id: categories[0]?.id || 1, unit: 'pcs', default_price: '', gst_rate: '0', hsn_code: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addRow = () => {
    setRows([
      ...rows,
      { name: '', category_id: categories[0]?.id || 1, unit: 'pcs', default_price: '', gst_rate: '0', hsn_code: '' },
    ]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: string, value: any) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const handleSubmit = async () => {
    const validRows = rows.filter((r) => r.name.trim() !== '' && parseFloat(r.default_price) > 0);
    if (validRows.length === 0) {
      alert('Please fill at least one row with a valid item name and price.');
      return;
    }

    setSubmitting(true);
    try {
      await productApi.bulkCreate(
        validRows.map((r) => ({
          category_id: Number(r.category_id),
          name: r.name.trim(),
          unit: r.unit,
          default_price: parseFloat(r.default_price),
          gst_rate: parseFloat(r.gst_rate) || 0,
          hsn_code: r.hsn_code ? r.hsn_code.trim() : null,
        }))
      );
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving items.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Bulk Item Entry Grid
            </h3>
            <p className="text-xs text-slate-400">
              Rapidly type in multiple items and save them to your catalogue in one click.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500">
                <th className="p-2">#</th>
                <th className="p-2">Item Name *</th>
                <th className="p-2">Category</th>
                <th className="p-2">Unit</th>
                <th className="p-2">Price (₹) *</th>
                <th className="p-2">GST Rate</th>
                <th className="p-2">HSN Code</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="p-2 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Item name..."
                      value={row.name}
                      onChange={(e) => updateRow(idx, 'name', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={row.category_id}
                      onChange={(e) => updateRow(idx, 'category_id', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={row.unit}
                      onChange={(e) => updateRow(idx, 'unit', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.short_code}>
                          {u.short_code}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={row.default_price}
                      onChange={(e) => updateRow(idx, 'default_price', e.target.value)}
                      className="w-24 px-2 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={row.gst_rate}
                      onChange={(e) => updateRow(idx, 'gst_rate', e.target.value)}
                      className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="HSN"
                      value={row.hsn_code}
                      onChange={(e) => updateRow(idx, 'hsn_code', e.target.value)}
                      className="w-20 px-2 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => removeRow(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={addRow}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs text-slate-400">
            {rows.filter((r) => r.name.trim() !== '' && parseFloat(r.default_price) > 0).length} valid item(s) ready to import
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save All to Catalogue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
