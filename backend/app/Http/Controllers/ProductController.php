<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\TaxRate;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * List products for the shop with filters.
     */
    public function index(Request $request)
    {
        $shop = $request->get('current_shop');

        $query = Product::where('shop_id', $shop->id)
            ->with(['category:id,name,color', 'productUnit:id,name,short_code']);

        // Filter by category
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Search by name, barcode, or HSN
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('barcode', 'like', "%{$s}%")
                    ->orWhere('hsn_code', 'like', "%{$s}%");
            });
        }

        if ($request->boolean('active_only', true)) {
            $query->where('is_active', true);
        }

        // Return all if requested (for billing catalog cache)
        if ($request->boolean('all', false)) {
            $products = $query->orderBy('name', 'asc')->get();
            return response()->json($products);
        }

        $perPage = $request->integer('per_page', 50);
        $products = $query->orderBy('name', 'asc')->paginate($perPage);

        return response()->json($products);
    }

    /**
     * Create a single product.
     */
    public function store(Request $request)
    {
        $shop = $request->get('current_shop');
        $user = $request->user();

        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'barcode' => 'nullable|string|max:100',
            'sku' => 'nullable|string|max:100',
            'unit' => 'required|string|max:20',
            'unit_id' => 'nullable|exists:product_units,id',
            'default_price' => 'required|numeric|min:0',
            'mrp' => 'nullable|numeric|min:0',
            'gst_rate' => 'nullable|numeric|min:0|max:100',
            'hsn_code' => 'nullable|string|max:20',
            'is_tax_inclusive' => 'boolean',
            'description' => 'nullable|string',
            'source' => 'nullable|string',
        ]);

        // Verify category belongs to this shop
        Category::where('shop_id', $shop->id)->where('id', $validated['category_id'])->firstOrFail();

        $product = Product::create([
            'shop_id' => $shop->id,
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'barcode' => $validated['barcode'] ?? null,
            'sku' => $validated['sku'] ?? null,
            'unit' => $validated['unit'],
            'unit_id' => $validated['unit_id'] ?? null,
            'default_price' => $validated['default_price'],
            'mrp' => $validated['mrp'] ?? $validated['default_price'],
            'gst_rate' => $validated['gst_rate'] ?? 0.00,
            'hsn_code' => $validated['hsn_code'] ?? null,
            'is_tax_inclusive' => $validated['is_tax_inclusive'] ?? true,
            'description' => $validated['description'] ?? null,
            'is_active' => true,
            'source' => $validated['source'] ?? 'manual',
        ]);

        AuditLog::create([
            'shop_id' => $shop->id,
            'user_id' => $user->id,
            'action' => 'product.created',
            'entity_type' => 'product',
            'entity_id' => $product->id,
            'ip_address' => $request->ip(),
            'details' => ['name' => $product->name, 'price' => $product->default_price],
        ]);

        return response()->json([
            'message' => 'Product created successfully.',
            'product' => $product->load(['category', 'productUnit']),
        ], 201);
    }

    /**
     * Bulk create products (Fast item entry grid).
     */
    public function bulkStore(Request $request)
    {
        $shop = $request->get('current_shop');
        $user = $request->user();

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.category_id' => 'required|exists:categories,id',
            'items.*.name' => 'required|string|max:255',
            'items.*.unit' => 'required|string|max:20',
            'items.*.default_price' => 'required|numeric|min:0',
            'items.*.mrp' => 'nullable|numeric|min:0',
            'items.*.gst_rate' => 'nullable|numeric|min:0',
            'items.*.hsn_code' => 'nullable|string|max:20',
        ]);

        $created = [];
        foreach ($validated['items'] as $item) {
            $p = Product::create([
                'shop_id' => $shop->id,
                'category_id' => $item['category_id'],
                'name' => $item['name'],
                'unit' => $item['unit'] ?? 'pcs',
                'default_price' => $item['default_price'],
                'mrp' => $item['mrp'] ?? $item['default_price'],
                'gst_rate' => $item['gst_rate'] ?? 0.00,
                'hsn_code' => $item['hsn_code'] ?? null,
                'is_tax_inclusive' => true,
                'is_active' => true,
                'source' => 'bulk_entry',
            ]);
            $created[] = $p;
        }

        AuditLog::create([
            'shop_id' => $shop->id,
            'user_id' => $user->id,
            'action' => 'product.bulk_created',
            'entity_type' => 'product',
            'ip_address' => $request->ip(),
            'details' => ['count' => count($created)],
        ]);

        return response()->json([
            'message' => count($created) . ' products added successfully.',
            'count' => count($created),
        ], 201);
    }

    /**
     * Update product.
     */
    public function update(Request $request, $id)
    {
        $shop = $request->get('current_shop');
        $product = Product::where('shop_id', $shop->id)->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'name' => 'sometimes|string|max:255',
            'barcode' => 'nullable|string|max:100',
            'sku' => 'nullable|string|max:100',
            'unit' => 'sometimes|string|max:20',
            'unit_id' => 'nullable|exists:product_units,id',
            'default_price' => 'sometimes|numeric|min:0',
            'mrp' => 'nullable|numeric|min:0',
            'gst_rate' => 'nullable|numeric|min:0',
            'hsn_code' => 'nullable|string|max:20',
            'is_tax_inclusive' => 'boolean',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if (isset($validated['category_id'])) {
            Category::where('shop_id', $shop->id)->where('id', $validated['category_id'])->firstOrFail();
        }

        $product->update($validated);

        return response()->json([
            'message' => 'Product updated successfully.',
            'product' => $product->load(['category', 'productUnit']),
        ]);
    }

    /**
     * Delete product.
     */
    public function destroy(Request $request, $id)
    {
        $shop = $request->get('current_shop');
        $product = Product::where('shop_id', $shop->id)->where('id', $id)->firstOrFail();

        $product->delete();

        return response()->json(['message' => 'Product deleted successfully.']);
    }

    /**
     * Get units and tax rates metadata for dropdowns.
     */
    public function metadata(Request $request)
    {
        $shop = $request->get('current_shop');

        $units = ProductUnit::where(function ($q) use ($shop) {
            $q->whereNull('shop_id')->orWhere('shop_id', $shop->id);
        })->get();

        $taxRates = TaxRate::where(function ($q) use ($shop) {
            $q->whereNull('shop_id')->orWhere('shop_id', $shop->id);
        })->where('is_active', true)->get();

        $categories = Category::where('shop_id', $shop->id)
            ->where('is_active', true)
            ->orderBy('display_order', 'asc')
            ->get();

        return response()->json([
            'units' => $units,
            'tax_rates' => $taxRates,
            'categories' => $categories,
        ]);
    }
}
