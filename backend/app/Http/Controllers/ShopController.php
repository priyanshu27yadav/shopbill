<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\InvoiceSetting;
use App\Models\Role;
use App\Models\Shop;
use App\Models\ShopSetting;
use App\Models\ShopUser;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class ShopController extends Controller
{
    /**
     * Get the active shop profile.
     */
    public function show(Request $request)
    {
        $shop = $request->get('current_shop');
        return response()->json($shop);
    }

    /**
     * High-speed initial bootstrap: delivers shop, user, settings, and categories in a single cached call.
     */
    public function bootstrap(Request $request)
    {
        $shop = $request->get('current_shop');
        $user = $request->user();

        $data = Cache::remember("shop_{$shop->id}_bootstrap", 300, function () use ($shop) {
            $categories = Category::where('shop_id', $shop->id)
                ->withCount('products')
                ->orderBy('display_order', 'asc')
                ->orderBy('name', 'asc')
                ->get();

            $shopSettings = ShopSetting::where('shop_id', $shop->id)->pluck('value', 'key');
            $invoiceSettings = InvoiceSetting::firstOrCreate(['shop_id' => $shop->id], [
                'invoice_prefix' => 'SB-',
                'next_invoice_number' => 1,
                'template' => 'standard',
                'show_gst' => $shop->is_gst_registered,
                'show_hsn' => $shop->is_gst_registered,
                'show_shop_logo' => true,
                'terms_and_conditions' => "1. Goods once sold will not be returned without bill.\n2. All disputes subject to local jurisdiction.",
                'footer_message' => 'Thank you for shopping with us! Please visit again.',
                'show_upi_qr' => true,
            ]);

            return [
                'categories' => $categories,
                'shop_settings' => $shopSettings,
                'invoice_settings' => $invoiceSettings,
            ];
        });

        return response()->json([
            'shop' => $shop,
            'user' => $user,
            'categories' => $data['categories'],
            'shop_settings' => $data['shop_settings'],
            'invoice_settings' => $data['invoice_settings'],
        ]);
    }

    /**
     * Update active shop profile.
     */
    public function update(Request $request)
    {
        $shop = $request->get('current_shop');
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'business_type' => 'required|string',
            'tagline' => 'nullable|string|max:255',
            'address_line1' => 'nullable|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            'gstin' => 'nullable|string|max:20',
            'is_gst_registered' => 'boolean',
            'logo_url' => 'nullable|string',
            'currency_symbol' => 'nullable|string|max:10',
        ]);

        $shop->update($validated);

        AuditLog::create([
            'shop_id' => $shop->id,
            'user_id' => $user->id,
            'action' => 'shop.updated',
            'entity_type' => 'shop',
            'entity_id' => $shop->id,
            'ip_address' => $request->ip(),
            'details' => ['updated_fields' => array_keys($validated)],
        ]);

        return response()->json([
            'message' => 'Shop profile updated successfully.',
            'shop' => $shop,
        ]);
    }

    /**
     * List all staff members for the current shop.
     */
    public function listStaff(Request $request)
    {
        $shop = $request->get('current_shop');

        $staff = ShopUser::where('shop_id', $shop->id)
            ->with(['user:id,name,email,phone,is_active', 'roleModel'])
            ->get();

        return response()->json($staff);
    }

    /**
     * Add a staff member or cashier to the current shop.
     */
    public function addStaff(Request $request)
    {
        $shop = $request->get('current_shop');
        $creator = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:manager,cashier',
            'can_give_discount' => 'boolean',
            'can_view_reports' => 'boolean',
            'can_manage_items' => 'boolean',
            'can_cancel_bills' => 'boolean',
        ]);

        // Find or create user
        $user = User::where('email', $validated['email'])->first();
        if (!$user) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make($validated['password']),
                'role' => 'staff',
                'is_active' => true,
                'current_shop_id' => $shop->id,
            ]);
        }

        // Check if already in shop
        $existing = ShopUser::where('shop_id', $shop->id)->where('user_id', $user->id)->first();
        if ($existing) {
            return response()->json(['message' => 'This user is already part of your shop staff.'], 422);
        }

        $roleModel = Role::where('name', $validated['role'] === 'manager' ? 'shop_manager' : 'cashier')->first();

        $shopUser = ShopUser::create([
            'shop_id' => $shop->id,
            'user_id' => $user->id,
            'role_id' => $roleModel?->id,
            'role' => $validated['role'],
            'can_give_discount' => $validated['can_give_discount'] ?? ($validated['role'] === 'manager'),
            'can_view_reports' => $validated['can_view_reports'] ?? ($validated['role'] === 'manager'),
            'can_manage_items' => $validated['can_manage_items'] ?? ($validated['role'] === 'manager'),
            'can_cancel_bills' => $validated['can_cancel_bills'] ?? ($validated['role'] === 'manager'),
            'status' => 'active',
        ]);

        AuditLog::create([
            'shop_id' => $shop->id,
            'user_id' => $creator->id,
            'action' => 'staff.created',
            'entity_type' => 'shop_user',
            'entity_id' => $shopUser->id,
            'ip_address' => $request->ip(),
            'details' => ['staff_email' => $user->email, 'role' => $validated['role']],
        ]);

        return response()->json([
            'message' => 'Staff member added successfully.',
            'staff' => $shopUser->load('user', 'roleModel'),
        ], 201);
    }

    /**
     * Update staff member permissions.
     */
    public function updateStaff(Request $request, $id)
    {
        $shop = $request->get('current_shop');
        $shopUser = ShopUser::where('shop_id', $shop->id)->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'role' => 'sometimes|string|in:manager,cashier',
            'can_give_discount' => 'boolean',
            'can_view_reports' => 'boolean',
            'can_manage_items' => 'boolean',
            'can_cancel_bills' => 'boolean',
            'status' => 'sometimes|string|in:active,inactive',
        ]);

        if (isset($validated['role'])) {
            $roleModel = Role::where('name', $validated['role'] === 'manager' ? 'shop_manager' : 'cashier')->first();
            $validated['role_id'] = $roleModel?->id;
        }

        $shopUser->update($validated);

        return response()->json([
            'message' => 'Staff permissions updated successfully.',
            'staff' => $shopUser->load('user', 'roleModel'),
        ]);
    }

    /**
     * Remove staff member from shop.
     */
    public function removeStaff(Request $request, $id)
    {
        $shop = $request->get('current_shop');
        $shopUser = ShopUser::where('shop_id', $shop->id)->where('id', $id)->firstOrFail();

        if ($shopUser->role === 'owner') {
            return response()->json(['message' => 'Cannot remove the shop owner.'], 422);
        }

        $shopUser->delete();

        return response()->json(['message' => 'Staff removed successfully.']);
    }
}
