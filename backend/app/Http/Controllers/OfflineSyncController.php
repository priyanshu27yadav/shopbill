<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\InvoiceSetting;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\TaxRate;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OfflineSyncController extends Controller
{
    /**
     * Download the latest snapshot of categories, products, customers, and settings
     * to populate the desktop local SQLite database.
     */
    public function pullCatalogue(Request $request)
    {
        $shop = $request->get('current_shop');

        $categories = Category::where('shop_id', $shop->id)->where('is_active', true)->get();
        $products = Product::where('shop_id', $shop->id)->where('is_active', true)->get();
        $customers = Customer::where('shop_id', $shop->id)->get();
        $units = ProductUnit::where(function ($q) use ($shop) {
            $q->whereNull('shop_id')->orWhere('shop_id', $shop->id);
        })->get();
        $taxRates = TaxRate::where(function ($q) use ($shop) {
            $q->whereNull('shop_id')->orWhere('shop_id', $shop->id);
        })->where('is_active', true)->get();
        $invoiceSetting = InvoiceSetting::where('shop_id', $shop->id)->first();

        return response()->json([
            'synced_at' => Carbon::now()->toIso8601String(),
            'shop' => $shop,
            'categories' => $categories,
            'products' => $products,
            'customers' => $customers,
            'units' => $units,
            'tax_rates' => $taxRates,
            'invoice_setting' => $invoiceSetting,
        ]);
    }

    /**
     * Upload offline-created bills from the desktop SQLite store with deduplication.
     */
    public function pushBills(Request $request)
    {
        $shop = $request->get('current_shop');
        $user = $request->user();

        $validated = $request->validate([
            'invoices' => 'required|array|min:1',
            'invoices.*.sync_id' => 'required|string',
            'invoices.*.billing_mode' => 'required|string',
            'invoices.*.invoice_type' => 'required|string',
            'invoices.*.invoice_date' => 'required',
            'invoices.*.customer_name' => 'nullable|string',
            'invoices.*.customer_phone' => 'nullable|string',
            'invoices.*.subtotal' => 'required|numeric',
            'invoices.*.total_discount' => 'required|numeric',
            'invoices.*.total_tax' => 'required|numeric',
            'invoices.*.final_amount' => 'required|numeric',
            'invoices.*.amount_paid' => 'required|numeric',
            'invoices.*.payment_method' => 'required|string',
            'invoices.*.items' => 'required|array|min:1',
        ]);

        $synced = [];
        $skipped = [];

        DB::transaction(function () use ($shop, $user, $validated, &$synced, &$skipped) {
            $invoiceSetting = InvoiceSetting::firstOrCreate(['shop_id' => $shop->id]);
            $prefix = $invoiceSetting->invoice_prefix ?: 'SB-';

            foreach ($validated['invoices'] as $invData) {
                $syncId = $invData['sync_id'];

                // Deduplication check
                $existing = Invoice::where('shop_id', $shop->id)->where('sync_id', $syncId)->first();
                if ($existing) {
                    $skipped[] = [
                        'sync_id' => $syncId,
                        'invoice_number' => $existing->invoice_number,
                        'reason' => 'Already synced previously',
                    ];
                    continue;
                }

                // Resolve customer if phone is present
                $customer = null;
                if (!empty($invData['customer_phone'])) {
                    $customer = Customer::where('shop_id', $shop->id)->where('phone', $invData['customer_phone'])->first();
                    if (!$customer && !empty($invData['customer_name'])) {
                        $customer = Customer::create([
                            'shop_id' => $shop->id,
                            'name' => $invData['customer_name'],
                            'phone' => $invData['customer_phone'],
                        ]);
                    }
                }

                // Generate server sequential invoice number
                $nextNum = $invoiceSetting->next_invoice_number ?: 1;
                $invNum = $prefix . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
                while (Invoice::where('shop_id', $shop->id)->where('invoice_number', $invNum)->exists()) {
                    $nextNum++;
                    $invNum = $prefix . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
                }
                $invoiceSetting->update(['next_invoice_number' => $nextNum + 1]);

                $finalAmount = floatval($invData['final_amount']);
                $amountPaid = floatval($invData['amount_paid']);
                $balanceDue = max(0.00, $finalAmount - $amountPaid);

                $paymentStatus = 'paid';
                if ($balanceDue > 0) {
                    $paymentStatus = ($amountPaid > 0) ? 'partial' : 'credit';
                }

                $invoice = Invoice::create([
                    'shop_id' => $shop->id,
                    'user_id' => $user->id,
                    'customer_id' => $customer?->id,
                    'customer_name' => $invData['customer_name'] ?? null,
                    'customer_phone' => $invData['customer_phone'] ?? null,
                    'invoice_number' => $invNum,
                    'invoice_date' => Carbon::parse($invData['invoice_date']),
                    'billing_mode' => $invData['billing_mode'],
                    'invoice_type' => $invData['invoice_type'],
                    'subtotal' => $invData['subtotal'],
                    'item_discount_total' => $invData['item_discount_total'] ?? 0,
                    'overall_discount_amount' => $invData['overall_discount_amount'] ?? 0,
                    'total_discount' => $invData['total_discount'],
                    'taxable_amount' => $invData['taxable_amount'] ?? ($invData['subtotal'] - $invData['total_discount']),
                    'cgst_amount' => $invData['cgst_amount'] ?? 0,
                    'sgst_amount' => $invData['sgst_amount'] ?? 0,
                    'igst_amount' => $invData['igst_amount'] ?? 0,
                    'total_tax' => $invData['total_tax'],
                    'round_off' => $invData['round_off'] ?? 0,
                    'final_amount' => $finalAmount,
                    'amount_paid' => $amountPaid,
                    'balance_due' => $balanceDue,
                    'payment_status' => $paymentStatus,
                    'payment_method' => $invData['payment_method'],
                    'notes' => $invData['notes'] ?? 'Created offline and synced.',
                    'status' => 'completed',
                    'sync_id' => $syncId,
                ]);

                foreach ($invData['items'] as $item) {
                    $qty = floatval($item['quantity'] ?? 1);
                    $unitPrice = floatval($item['unit_price'] ?? 0);
                    $itemSubtotal = floatval($item['subtotal'] ?? ($qty * $unitPrice));
                    $itemDiscount = floatval($item['discount_amount'] ?? 0);
                    $taxRate = floatval($item['gst_rate'] ?? 0);
                    $taxAmt = floatval($item['tax_amount'] ?? (($itemSubtotal - $itemDiscount) * ($taxRate / 100)));
                    $itemTotal = floatval($item['total_amount'] ?? ($itemSubtotal - $itemDiscount + $taxAmt));

                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'product_id' => $item['product_id'] ?? null,
                        'item_name' => $item['item_name'] ?? 'Item',
                        'category_name' => $item['category_name'] ?? null,
                        'is_custom_item' => !empty($item['is_custom_item']),
                        'hsn_code' => $item['hsn_code'] ?? null,
                        'unit' => $item['unit'] ?? 'pcs',
                        'quantity' => $qty,
                        'unit_price' => $unitPrice,
                        'discount_amount' => $itemDiscount,
                        'subtotal' => $itemSubtotal,
                        'gst_rate' => $taxRate,
                        'cgst_amount' => $item['cgst_amount'] ?? ($taxRate > 0 ? $taxAmt / 2 : 0),
                        'sgst_amount' => $item['sgst_amount'] ?? ($taxRate > 0 ? $taxAmt / 2 : 0),
                        'igst_amount' => $item['igst_amount'] ?? 0,
                        'tax_amount' => $taxAmt,
                        'total_amount' => $itemTotal,
                    ]);
                }

                if ($amountPaid > 0) {
                    $payNumber = 'PAY-SYNC-' . date('Ymd') . '-' . str_pad(Payment::where('shop_id', $shop->id)->count() + 1, 4, '0', STR_PAD_LEFT);
                    Payment::create([
                        'shop_id' => $shop->id,
                        'invoice_id' => $invoice->id,
                        'customer_id' => $customer?->id,
                        'payment_number' => $payNumber,
                        'payment_date' => $invoice->invoice_date,
                        'amount' => $amountPaid,
                        'payment_method' => $invData['payment_method'],
                        'payment_type' => 'invoice_payment',
                        'notes' => 'Synced from offline client',
                    ]);
                }

                if ($customer) {
                    $customer->increment('total_purchases', $finalAmount);
                    if ($balanceDue > 0) {
                        $customer->increment('current_balance', $balanceDue);
                    }
                }

                $synced[] = [
                    'sync_id' => $syncId,
                    'invoice_id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                ];
            }
        });

        return response()->json([
            'message' => 'Offline sync completed.',
            'synced_count' => count($synced),
            'skipped_count' => count($skipped),
            'synced' => $synced,
            'skipped' => $skipped,
        ]);
    }
}
