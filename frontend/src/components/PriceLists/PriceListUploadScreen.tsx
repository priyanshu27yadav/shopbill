import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  Edit,
  ArrowRight,
  FileText,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { priceListApi, categoryApi } from '../../api';
import { ExtractedPdfItem, Category } from '../../types';

export const PriceListUploadScreen: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadId, setUploadId] = useState<number | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [extractedItems, setExtractedItems] = useState<ExtractedPdfItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load existing shop categories
  useEffect(() => {
    categoryApi.list().then((res) => setCategories(res.data)).catch(console.error);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf') {
        alert('Please select a valid PDF file.');
        return;
      }
      setFile(selected);
      setSuccessMessage('');
    }
  };

  const handleUploadAndExtract = async () => {
    if (!file) {
      alert('Please choose a PDF file first.');
      return;
    }

    setUploading(true);
    setSuccessMessage('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await priceListApi.upload(formData);
      setUploadId(res.data.upload_id);
      setFilename(res.data.filename);
      setExtractedItems(res.data.items);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload and extract PDF.');
    } finally {
      setUploading(false);
    }
  };

  const updateItem = (index: number, field: keyof ExtractedPdfItem, value: any) => {
    const updated = [...extractedItems];
    updated[index] = { ...updated[index], [field]: value };
    // If shopkeeper manually edits the price, mark it certain
    if (field === 'default_price') {
      updated[index].uncertain_price = false;
      updated[index].confidence = Math.max(0.9, updated[index].confidence);
    }
    setExtractedItems(updated);
  };

  const removeItem = (index: number) => {
    setExtractedItems(extractedItems.filter((_, i) => i !== index));
  };

  const addNewRow = () => {
    const newRow: ExtractedPdfItem = {
      temp_id: 'tmp_' + Date.now(),
      line_number: extractedItems.length + 1,
      name: 'New Product',
      category: categories[0]?.name || 'General',
      unit: 'pcs',
      default_price: '100.00',
      mrp: '100.00',
      gst_rate: 0,
      confidence: 1.0,
      uncertain_price: false,
    };
    setExtractedItems([...extractedItems, newRow]);
  };

  const handleConfirmImport = async () => {
    if (!uploadId || extractedItems.length === 0) return;

    setConfirming(true);
    try {
      const res = await priceListApi.confirm(
        uploadId,
        extractedItems.map((it) => ({
          name: it.name,
          category: it.category,
          unit: it.unit,
          default_price: parseFloat(it.default_price),
          mrp: parseFloat(it.mrp) || parseFloat(it.default_price),
          gst_rate: it.gst_rate,
          hsn_code: it.hsn_code,
        }))
      );

      setSuccessMessage(res.data.message);
      setExtractedItems([]);
      setFile(null);
      setUploadId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm import.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Introduction */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <span>Upload PDF Price List (Option A)</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Upload your existing supplier or wholesaler PDF price list. The OCR & AI parser extracts item names, categories, units, and prices with confidence scoring for your review.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-emerald-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
          <Upload className="w-10 h-10 mx-auto text-emerald-600 mb-3" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {file ? file.name : 'Choose a PDF Price List to Upload'}
          </p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Supports both computer-generated and scanned price list PDFs (Max 10MB)
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <label className="cursor-pointer px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all">
              <span>Select PDF File</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {file && (
              <button
                disabled={uploading}
                onClick={handleUploadAndExtract}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{uploading ? 'Extracting Text & OCR...' : 'Start Extraction & Preview'}</span>
              </button>
            )}
          </div>
        </div>

        {successMessage && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Extracted Items Staging Preview Screen */}
      {extractedItems.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/60">
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <span>Staged Items Preview ({extractedItems.length} items)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Ready for Review
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review and edit extracted items. High-confidence prices are green; uncertain or low-confidence prices are highlighted in yellow/orange.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={addNewRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Missing Item</span>
              </button>

              <button
                disabled={confirming}
                onClick={handleConfirmImport}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{confirming ? 'Importing...' : 'Confirm & Save All to Catalogue'}</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Extracted Item Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">Unit</th>
                  <th className="py-2.5 px-3 text-right">Extracted Price (₹)</th>
                  <th className="py-2.5 px-3 text-center">GST Rate</th>
                  <th className="py-2.5 px-3 text-center">HSN</th>
                  <th className="py-2.5 px-3 text-center">Confidence</th>
                  <th className="py-2.5 px-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {extractedItems.map((item, idx) => {
                  const isUncertain = item.uncertain_price || item.confidence < 0.8;
                  return (
                    <tr
                      key={item.temp_id || idx}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isUncertain ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => updateItem(idx, 'category', e.target.value)}
                          className="w-32 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                          className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        >
                          <option value="pcs">pcs</option>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="L">L</option>
                          <option value="ml">ml</option>
                          <option value="m">m</option>
                          <option value="pkt">pkt</option>
                          <option value="box">box</option>
                          <option value="dz">dz</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {isUncertain && (
                            <span title="Uncertain price, please verify before confirming">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                            </span>
                          )}
                          <input
                            type="number"
                            step="0.01"
                            value={item.default_price}
                            onChange={(e) => updateItem(idx, 'default_price', e.target.value)}
                            className={`w-24 px-2 py-1 text-right text-xs font-mono font-bold rounded-lg border ${
                              isUncertain
                                ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                            }`}
                          />
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <select
                          value={item.gst_rate}
                          onChange={(e) => updateItem(idx, 'gst_rate', parseFloat(e.target.value))}
                          className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="text"
                          value={item.hsn_code || ''}
                          placeholder="HSN"
                          onChange={(e) => updateItem(idx, 'hsn_code', e.target.value)}
                          className="w-20 px-2 py-1 text-xs text-center font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.confidence >= 0.85
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => removeItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
