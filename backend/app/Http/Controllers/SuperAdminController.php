<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Invoice;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Http\Request;

class SuperAdminController extends Controller
{
    /**
     * Ensure current user is Super Admin.
     */
    protected function checkSuperAdmin(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            abort(403, 'Unauthorized. Super Admin access required.');
        }
    }

    /**
     * Super Admin Dashboard overview.
     */
    public function dashboard(Request $request)
    {
        $this->checkSuperAdmin($request);

        $totalShops = Shop::count();
        $totalUsers = User::count();
        $totalInvoices = Invoice::count();
        $totalGmv = Invoice::where('status', 'completed')->sum('final_amount');

        $recentShops = Shop::with('owner:id,name,email,phone')
            ->withCount(['invoices', 'products', 'customers'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        $businessTypeBreakdown = Shop::select('business_type', \DB::raw('count(*) as count'))
            ->groupBy('business_type')
            ->get();

        return response()->json([
            'overview' => [
                'total_shops' => $totalShops,
                'total_users' => $totalUsers,
                'total_invoices' => $totalInvoices,
                'total_gmv' => (float)$totalGmv,
            ],
            'recent_shops' => $recentShops,
            'business_type_breakdown' => $businessTypeBreakdown,
        ]);
    }

    /**
     * List all registered shops with pagination & search.
     */
    public function listShops(Request $request)
    {
        $this->checkSuperAdmin($request);

        $query = Shop::with('owner:id,name,email,phone')
            ->withCount(['invoices', 'products', 'customers']);

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('city', 'like', "%{$s}%")
                    ->orWhere('gstin', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $shops = $query->orderBy('created_at', 'desc')->paginate($request->integer('per_page', 25));

        return response()->json($shops);
    }

    /**
     * Toggle shop status (activate or suspend).
     */
    public function toggleShopStatus(Request $request, $id)
    {
        $this->checkSuperAdmin($request);

        $shop = Shop::findOrFail($id);
        $newStatus = $shop->status === 'active' ? 'suspended' : 'active';
        $shop->update(['status' => $newStatus]);

        AuditLog::create([
            'shop_id' => $shop->id,
            'user_id' => $request->user()->id,
            'action' => 'superadmin.shop_status_toggled',
            'entity_type' => 'shop',
            'entity_id' => $shop->id,
            'ip_address' => $request->ip(),
            'details' => ['new_status' => $newStatus],
        ]);

        return response()->json([
            'message' => "Shop has been {$newStatus}.",
            'shop' => $shop,
        ]);
    }
}
