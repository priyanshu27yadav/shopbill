<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\PriceListUpload;
use App\Models\Product;
use App\Services\PdfPriceListExtractor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PriceListController extends Controller
{
    protected PdfPriceListExtractor $extractor;

    public function __construct(PdfPriceListExtractor $extractor)
    {
        $this->extractor = $extractor;
    }

    /**
     * List past price list uploads for the shop.
     */
    public function index(Request $request)
    {
        $shop = $request->get('current_shop');

        $uploads = PriceListUpload::where('shop_id', $shop->id)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($uploads);
    }

    /**
     * Upload a PDF price list and extract items for preview.
     */
    public function upload(Request $request)
    {
        $shop = $request->get('current_shop');
        $user = $request->user();

        $request->validate([
            'file' => 'required|file|mimes:pdf|max:10240', // 10MB max
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $fileSize = $file->getSize();

        // Store file locally
        $filename = 'pricelist_' . time() . '_' . Str::random(8) . '.pdf';
        $path = $file->storeAs('uploads/pricelists', $filename, 'public');
        $fullPath = storage_path('app/public/' . $path);

        // Fetch existing shop categories for heuristic matching
        $existingCategories = Category::where('shop_id', $shop->id)->pluck('name')->toArray();

        // Extract items
        $extractedItems = $this->extractor->extract($fullPath, $existingCategories);

        // Save staged upload
        $uploadRecord = PriceListUpload::create([
            'shop_id' => $shop->id,
            'user_id' => $user->id,
            'original_filename' => $originalName,
            'file_path' => $path,
            'file_size' => $fileSize,
            'extracted_items_count' => count($extractedItems),
            'parsed_data' => $extractedItems,
            'status' => 'pending',
        ]);

        AuditLog::create([
            'shop_id' => $shop->id,
            'user_id' => $user->id,
            'action' => 'pricelist.uploaded',
            'entity_type' => 'price_list_upload',
            'entity_id' => $uploadRecord->id,
            'ip_address' => $request->ip(),
            'details' => ['filename' => $originalName, 'extracted_count' => count($extractedItems)],
        ]);

        return response()->json([
            'message' => 'PDF uploaded and parsed successfully.',
            'upload_id' => $uploadRecord->id,
            'filename' => $originalName,
            'total_extracted' => count($extractedItems),
            'items' => $extractedItems,
            'categories' => Category::where('shop_id', $shop->id)->get(['id', 'name']),
        ], 201);
    }

    /**
     * Get preview of a staged upload.
     */
    public function preview(Request $request, $id)
    {
        $shop = $request->get('current_shop');
        $upload = PriceListUpload::where('shop_id', $shop->id)->where('id', $id)->firstOrFail();

        return response()->json([
            'upload' => $upload,
            'items' => $upload->parsed_data ?? [],
            'categories' => Category::where('shop_id', $shop->id)->get(['id', 'name']),
        ]);
    }

    /**
     * Confirm and commit extracted items into the shop product catalogue.
     */
    public function confirm(Request $request, $id)
    {
        $shop = $request->get('current_shop');
        $user = $request->user();

        $upload = PriceListUpload::where('shop_id', $shop->id)->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.category' => 'required|string|max:100',
            'items.*.unit' => 'required|string|max:20',
            'items.*.default_price' => 'required|numeric|min:0',
            'items.*.mrp' => 'nullable|numeric|min:0',
            'items.*.gst_rate' => 'nullable|numeric|min:0',
            'items.*.hsn_code' => 'nullable|string|max:20',
        ]);

        $importedCount = 0;
        $categoryCache = [];

        foreach ($validated['items'] as $item) {
            $catName = trim($item['category']);

            if (!isset($categoryCache[$catName])) {
                $cat = Category::firstOrCreate(
                    ['shop_id' => $shop->id, 'name' => $catName],
                    ['slug' => Str::slug($catName), 'display_order' => 99, 'is_active' => true]
                );
                $categoryCache[$catName] = $cat->id;
            }

            $catId = $categoryCache[$catName];

            Product::create([
                'shop_id' => $shop->id,
                'category_id' => $catId,
                'name' => $item['name'],
                'unit' => $item['unit'] ?? 'pcs',
                'default_price' => $item['default_price'],
                'mrp' => $item['mrp'] ?? $item['default_price'],
                'gst_rate' => $item['gst_rate'] ?? 0.00,
                'hsn_code' => $item['hsn_code'] ?? null,
                'is_tax_inclusive' => true,
                'is_active' => true,
                'source' => 'pdf_import',
            ]);

            $importedCount++;
        }

        $upload->update([
            'status' => 'confirmed',
            'notes' => "Confirmed and imported {$importedCount} products into catalogue.",
        ]);

        AuditLog::create([
            'shop_id' => $shop->id,
            'user_id' => $user->id,
            'action' => 'pricelist.confirmed',
            'entity_type' => 'price_list_upload',
            'entity_id' => $upload->id,
            'ip_address' => $request->ip(),
            'details' => ['imported_count' => $importedCount],
        ]);

        return response()->json([
            'message' => "Successfully imported {$importedCount} items into your product catalogue.",
            'imported_count' => $importedCount,
        ]);
    }

    /**
     * Delete an upload draft.
     */
    public function destroy(Request $request, $id)
    {
        $shop = $request->get('current_shop');
        $upload = PriceListUpload::where('shop_id', $shop->id)->where('id', $id)->firstOrFail();

        if ($upload->file_path && Storage::disk('public')->exists($upload->file_path)) {
            Storage::disk('public')->delete($upload->file_path);
        }

        $upload->delete();

        return response()->json(['message' => 'Upload record deleted successfully.']);
    }
}
