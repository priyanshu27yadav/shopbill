<?php

namespace App\Http\Middleware;

use App\Models\Shop;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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
            $shop = Cache::remember("cache_shop_{$shopId}", 300, fn () => Shop::find($shopId));

            if ($shop) {
                // Check if user is owner or staff
                $isOwner = $shop->user_id === $user->id;
                $shopUser = Cache::remember("cache_shopuser_{$shopId}_{$user->id}", 300, function () use ($shop, $user) {
                    return $shop->shopUsers()->where('user_id', $user->id)->first();
                });

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
        $firstShop = Cache::remember("cache_user_first_shop_{$user->id}", 300, function () use ($user) {
            return $user->ownedShops()->first() ?? $user->shops()->first();
        });

        if ($firstShop) {
            if ($user->current_shop_id !== $firstShop->id) {
                $user->update(['current_shop_id' => $firstShop->id]);
            }
            $shopUser = Cache::remember("cache_shopuser_{$firstShop->id}_{$user->id}", 300, function () use ($firstShop, $user) {
                return $firstShop->shopUsers()->where('user_id', $user->id)->first();
            });
            $request->merge([
                'current_shop' => $firstShop,
                'current_shop_user' => $shopUser,
            ]);
            $request->attributes->set('shop', $firstShop);
            $request->attributes->set('shopUser', $shopUser);
            return $next($request);
        }

        if ($user->isSuperAdmin()) {
            $defaultShop = Cache::remember('cache_default_shop', 300, fn () => Shop::first());
            if ($defaultShop) {
                if ($user->current_shop_id !== $defaultShop->id) {
                    $user->update(['current_shop_id' => $defaultShop->id]);
                }
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
