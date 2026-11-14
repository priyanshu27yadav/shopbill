<?php

namespace App\Http\Middleware;

use App\Models\Shop;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentifyShop
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Allow super admin to pass or specify X-Shop-Id
        $shopId = $request->header('X-Shop-Id') ?? $user->current_shop_id;

        if ($shopId) {
            $shop = Shop::find($shopId);

            if ($shop) {
                // Check if user is owner or staff
                $isOwner = $shop->user_id === $user->id;
                $shopUser = $shop->shopUsers()->where('user_id', $user->id)->first();

                if ($isOwner || $shopUser || $user->isSuperAdmin()) {
                    $request->merge([
                        'current_shop' => $shop,
                        'current_shop_user' => $shopUser,
                    ]);
                    $request->attributes->set('shop', $shop);
                    $request->attributes->set('shopUser', $shopUser);
                    return $next($request);
                }
            }
        }

        // Fallback: Check if user owns any shop or belongs to any shop
        $firstShop = $user->ownedShops()->first() ?? $user->shops()->first();
        if ($firstShop) {
            $user->update(['current_shop_id' => $firstShop->id]);
            $shopUser = $firstShop->shopUsers()->where('user_id', $user->id)->first();
            $request->merge([
                'current_shop' => $firstShop,
                'current_shop_user' => $shopUser,
            ]);
            $request->attributes->set('shop', $firstShop);
            $request->attributes->set('shopUser', $shopUser);
            return $next($request);
        }

        if ($user->isSuperAdmin()) {
            $defaultShop = Shop::first();
            if ($defaultShop) {
                $user->update(['current_shop_id' => $defaultShop->id]);
                $request->merge([
                    'current_shop' => $defaultShop,
                    'current_shop_user' => null,
                ]);
                $request->attributes->set('shop', $defaultShop);
                $request->attributes->set('shopUser', null);
            }
            return $next($request);
        }

        return response()->json([
            'message' => 'No active shop associated with your account. Please create or join a shop.',
            'code' => 'NO_ACTIVE_SHOP',
        ], 403);
    }
}
