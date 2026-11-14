<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\InvoiceSetting;
use App\Models\Shop;
use App\Models\ShopSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SettingsController extends Controller
{
    /**
     * Get combined shop settings and invoice settings.
     */
    public function index(Request $request)
    {
        $shop = $request->get('current_shop');

        $data = Cache::remember("shop_{$shop->id}_settings_data", 300, function () use ($shop) {
            $shopSettings = ShopSetting::where('shop_id', $shop->id)->pluck('value', 'key');
            $invoiceSettings = InvoiceSetting::firstOrCreate(
                ['shop_id' => $shop->id],
                [
                    'invoice_prefix' => 'SB-',
                    'next_invoice_number' => 1,
                    'template' => 'standard',
                    'show_gst' => $shop->is_gst_registered,
                    'show_hsn' => $shop->is_gst_registered,
                    'show_shop_logo' => true,
                    'terms_and_conditions' => "1. Goods once sold will not be returned without bill.\n2. All disputes subject to local jurisdiction.",
                    'footer_message' => 'Thank you for shopping with us! Please visit again.',
                    'show_upi_qr' => true,
                ]
            );

            return [
                'shop' => $shop,
                'shop_settings' => $shopSettings,
                'invoice_settings' => $invoiceSettings,
            ];
        });

        return response()->json($data);
    }

    /**
     * Update invoice settings.
     */
    public function updateInvoiceSettings(Request $request)
    {
        $shop = $request->get('current_shop');
        $user = $request->user();

        $validated = $request->validate([
            'invoice_prefix' => 'required|string|max:20',
            'next_invoice_number' => 'required|integer|min:1',
            'template' => 'required|string|in:standard,thermal_58mm,thermal_80mm,modern_a4',
            'show_gst' => 'boolean',
            'show_hsn' => 'boolean',
            'show_shop_logo' => 'boolean',
            'terms_and_conditions' => 'nullable|string',
            'footer_message' => 'nullable|string',
            'show_upi_qr' => 'boolean',
            'upi_id' => 'nullable|string|max:100',
            'custom_qr_url' => 'nullable|string',
        ]);

        $settings = InvoiceSetting::where('shop_id', $shop->id)->firstOrFail();
        $settings->update($validated);
        Cache::forget("shop_{$shop->id}_settings_data");

        AuditLog::create([
            'shop_id' => $shop->id,
            'user_id' => $user->id,
            'action' => 'settings.invoice_updated',
            'entity_type' => 'invoice_settings',
            'entity_id' => $settings->id,
            'ip_address' => $request->ip(),
            'details' => $validated,
        ]);

        return response()->json([
            'message' => 'Invoice settings updated successfully.',
            'invoice_settings' => $settings,
        ]);
    }

    /**
     * Upload custom UPI QR code image for the shop.
     */
    public function uploadQrImage(Request $request)
    {
        $shop = $request->get('current_shop');
        $user = $request->user();

        $request->validate([
            'qr_image' => 'required|file|image|max:5120',
        ]);

        $file = $request->file('qr_image');
        $fileName = 'shop_' . $shop->id . '_qr_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('qr_codes', $fileName, 'public');
        $url = '/storage/' . $path;

        $settings = InvoiceSetting::where('shop_id', $shop->id)->firstOrFail();
        $settings->update(['custom_qr_url' => $url]);
        Cache::forget("shop_{$shop->id}_settings_data");

        AuditLog::create([
            'shop_id' => $shop->id,
            'user_id' => $user->id,
            'action' => 'settings.qr_uploaded',
            'entity_type' => 'invoice_settings',
            'entity_id' => $settings->id,
            'ip_address' => $request->ip(),
            'details' => ['url' => $url],
        ]);

        return response()->json([
            'message' => 'Shop QR code image uploaded successfully.',
            'custom_qr_url' => $url,
            'invoice_settings' => $settings,
        ]);
    }

    /**
     * Update key-value shop settings.
     */
    public function updateShopSettings(Request $request)
    {
        $shop = $request->get('current_shop');
        $user = $request->user();

        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            ShopSetting::updateOrCreate(
                ['shop_id' => $shop->id, 'key' => $key],
                ['value' => is_bool($value) ? ($value ? '1' : '0') : (string)$value]
            );
        }

        AuditLog::create([
            'shop_id' => $shop->id,
            'user_id' => $user->id,
            'action' => 'settings.shop_updated',
            'entity_type' => 'shop_settings',
            'ip_address' => $request->ip(),
            'details' => ['updated_keys' => array_keys($validated['settings'])],
        ]);

        Cache::forget("shop_{$shop->id}_settings_data");

        return response()->json([
            'message' => 'Shop settings saved successfully.',
            'shop_settings' => ShopSetting::where('shop_id', $shop->id)->pluck('value', 'key'),
        ]);
    }
}
