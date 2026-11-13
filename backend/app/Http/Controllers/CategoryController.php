<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * List all categories for current shop.
     */
    public function index(Request $request)
    {
        $shop = $request->get('current_shop');

        $categories = Category::where('shop_id', $shop->id)
            ->withCount('products')
            ->orderBy('display_order', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($categories);
    }

    /**
     * Create a new category.
     */
    public function store(Request $request)
    {
        $shop = $request->get('current_shop');

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'display_order' => 'nullable|integer',
        ]);

        $category = Category::create([
            'shop_id' => $shop->id,
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? 'Folder',
            'color' => $validated['color'] ?? '#3b82f6',
            'display_order' => $validated['display_order'] ?? (Category::where('shop_id', $shop->id)->max('display_order') + 1),
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Category created successfully.',
            'category' => $category,
        ], 201);
    }

    /**
     * Update an existing category.
     */
    public function update(Request $request, $id)
    {
        $shop = $request->get('current_shop');
        $category = Category::where('shop_id', $shop->id)->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'display_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        if ($validated['name'] !== $category->name) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);

        return response()->json([
            'message' => 'Category updated successfully.',
            'category' => $category,
        ]);
    }

    /**
     * Delete category.
     */
    public function destroy(Request $request, $id)
    {
        $shop = $request->get('current_shop');
        $category = Category::where('shop_id', $shop->id)->where('id', $id)->firstOrFail();

        // Check if has products
        $hasProducts = $category->products()->count() > 0;
        if ($hasProducts) {
            return response()->json([
                'message' => 'Cannot delete category that contains items. Please reassign or delete items first.',
            ], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully.']);
    }

    /**
     * Bulk reorder categories.
     */
    public function reorder(Request $request)
    {
        $shop = $request->get('current_shop');
        $request->validate(['order' => 'required|array']);

        foreach ($request->order as $item) {
            Category::where('shop_id', $shop->id)
                ->where('id', $item['id'])
                ->update(['display_order' => $item['display_order']]);
        }

        return response()->json(['message' => 'Categories reordered successfully.']);
    }
}
