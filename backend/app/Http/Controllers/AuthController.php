<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\InvoiceSetting;
use App\Models\Role;
use App\Models\Shop;
use App\Models\ShopSetting;
use App\Models\ShopUser;
use App\Models\Subscription;
use App\Models\User;
use App\Services\ShopCatalogueTemplateService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new shopkeeper account and set up their shop.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'shop_name' => 'required|string|max:255',
            'business_type' => 'required|string|in:electrical,hardware,grocery,general,mobile,laptop,sweets,cafe,clothing,medical,footwear,cosmetics,stationery,other',
            'gstin' => 'nullable|string|max:15',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'shopkeeper',
            'is_active' => true,
        ]);

        $shop = Shop::create([
            'user_id' => $user->id,
            'name' => $validated['shop_name'],
            'business_type' => $validated['business_type'],
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'],
            'gstin' => $validated['gstin'] ?? null,
            'is_gst_registered' => !empty($validated['gstin']),
            'currency_symbol' => '₹',
            'status' => 'active',
        ]);

        $user->update(['current_shop_id' => $shop->id]);

        $ownerRole = Role::where('name', 'shop_owner')->first();
        ShopUser::create([
            'shop_id' => $shop->id,
            'user_id' => $user->id,
            'role_id' => $ownerRole?->id,
            'role' => 'owner',
            'can_give_discount' => true,
            'can_view_reports' => true,
            'can_manage_items' => true,
            'can_cancel_bills' => true,
            'status' => 'active',
        ]);

        // Create default invoice settings
        InvoiceSetting::create([
            'shop_id' => $shop->id,
            'invoice_prefix' => 'SB-',
            'next_invoice_number' => 1,
            'template' => 'standard',
            'show_gst' => !empty($validated['gstin']),
            'show_hsn' => !empty($validated['gstin']),
            'show_shop_logo' => true,
            'terms_and_conditions' => "1. Goods once sold will not be returned without bill.\n2. All disputes subject to local jurisdiction.",
            'footer_message' => 'Thank you for your visit!',
            'show_upi_qr' => true,
        ]);

        // Default shop settings
        ShopSetting::create(['shop_id' => $shop->id, 'key' => 'print_receipt_type', 'value' => 'thermal_80mm']);
        ShopSetting::create(['shop_id' => $shop->id, 'key' => 'tax_mode', 'value' => 'inclusive']);
        ShopSetting::create(['shop_id' => $shop->id, 'key' => 'round_off_bills', 'value' => 'yes']);

        // Trial subscription
        Subscription::create([
            'shop_id' => $shop->id,
            'plan_name' => 'free_trial',
            'start_date' => Carbon::now()->toDateString(),
            'end_date' => Carbon::now()->addDays(30)->toDateString(),
            'status' => 'trial',
        ]);

        // Seed initial categories and branded products based on selected business category
        $totalItemsSeeded = ShopCatalogueTemplateService::seedCatalogueForShop($shop, $validated['business_type']);

        $token = $user->createToken('shopbill_auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'current_shop_id' => $shop->id,
            ],
            'shop' => $shop,
            'permissions' => [
                'role' => 'owner',
                'can_give_discount' => true,
                'can_view_reports' => true,
                'can_manage_items' => true,
                'can_cancel_bills' => true,
            ],
            'seeded_items_count' => $totalItemsSeeded,
        ], 201);
    }

    /**
     * Get list of supported business categories and catalog templates.
     */
    public function businessTypes()
    {
        return response()->json(ShopCatalogueTemplateService::getBusinessTypes());
    }

    /**
     * User login.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Your account has been deactivated. Please contact support.'], 403);
        }

        // Determine active shop
        $shop = null;
        $shopUser = null;

        if ($user->current_shop_id) {
            $shop = Shop::find($user->current_shop_id);
        }

        if (!$shop) {
            $shop = $user->ownedShops()->first() ?? $user->shops()->first();
            if (!$shop && $user->isSuperAdmin()) {
                $shop = Shop::first();
            }
            if ($shop) {
                $user->update(['current_shop_id' => $shop->id]);
            }
        }

        if ($shop) {
            $shopUser = $shop->shopUsers()->where('user_id', $user->id)->first();
        }

        $token = $user->createToken('shopbill_auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'current_shop_id' => $shop?->id,
            ],
            'shop' => $shop,
            'permissions' => [
                'role' => $shopUser?->role ?? ($user->isSuperAdmin() ? 'super_admin' : 'owner'),
                'can_give_discount' => $shopUser?->can_give_discount ?? true,
                'can_view_reports' => $shopUser?->can_view_reports ?? true,
                'can_manage_items' => $shopUser?->can_manage_items ?? true,
                'can_cancel_bills' => $shopUser?->can_cancel_bills ?? true,
            ],
        ]);
    }

    /**
     * User logout.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * Get current user profile and shop.
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $shop = null;
        $shopUser = null;

        if ($user->current_shop_id) {
            $shop = Shop::find($user->current_shop_id);
        }

        if (!$shop) {
            $shop = $user->ownedShops()->first() ?? $user->shops()->first();
            if (!$shop && $user->isSuperAdmin()) {
                $shop = Shop::first();
            }
            if ($shop) {
                $user->update(['current_shop_id' => $shop->id]);
            }
        }

        if ($shop) {
            $shopUser = $shop->shopUsers()->where('user_id', $user->id)->first();
        }

        // Accessible shops for dropdown switch
        $accessibleShops = $user->isSuperAdmin()
            ? Shop::get(['id', 'name', 'business_type', 'city', 'phone', 'is_gst_registered'])
            : Shop::where('user_id', $user->id)
                ->orWhereHas('shopUsers', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->get(['id', 'name', 'business_type', 'city', 'phone', 'is_gst_registered']);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'current_shop_id' => $shop?->id,
            ],
            'shop' => $shop,
            'accessible_shops' => $accessibleShops,
            'permissions' => [
                'role' => $shopUser?->role ?? ($user->isSuperAdmin() ? 'super_admin' : 'owner'),
                'can_give_discount' => $shopUser?->can_give_discount ?? true,
                'can_view_reports' => $shopUser?->can_view_reports ?? true,
                'can_manage_items' => $shopUser?->can_manage_items ?? true,
                'can_cancel_bills' => $shopUser?->can_cancel_bills ?? true,
            ],
        ]);
    }

    /**
     * Switch active shop for users with multiple shops.
     */
    public function switchShop(Request $request)
    {
        $request->validate(['shop_id' => 'required|exists:shops,id']);
        $user = $request->user();
        $targetShop = Shop::findOrFail($request->shop_id);

        $hasAccess = $targetShop->user_id === $user->id ||
            $targetShop->shopUsers()->where('user_id', $user->id)->exists() ||
            $user->isSuperAdmin();

        if (!$hasAccess) {
            return response()->json(['message' => 'Unauthorized to access this shop.'], 403);
        }

        $user->update(['current_shop_id' => $targetShop->id]);

        return response()->json([
            'message' => 'Switched shop successfully.',
            'shop' => $targetShop,
        ]);
    }
}
