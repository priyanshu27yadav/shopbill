<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\InvoiceSetting;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    /**
     * List invoices with filters, search, and pagination.
     */
    public function index(Request $request)
    {
        $shop = $request->get('current_shop');

        $query = Invoice::where('shop_id', $shop->id)
            ->withCount('items')
            ->with([
                'customer:id,name,phone,address,gstin',
                'user:id,name',
                'payments:id,shop_id,invoice_id,customer_id,payment_number,payment_date,amount,payment_method,payment_type,notes',
            ]);

        // Filter by date range
        if ($request->filled('start_date')) {
            $query->whereDate('invoice_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('invoice_date', '<=', $request->end_date);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by payment status
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        // Filter by billing mode
        if ($request->filled('billing_mode')) {
            $query->where('billing_mode', $request->billing_mode);
        }

        // Search invoice number, customer name, or phone
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('invoice_number', 'like', "%{$s}%")
                    ->orWhere('customer_name', 'like', "%{$s}%")
                    ->orWhere('customer_phone', 'like', "%{$s}%");
            });
        }

        $perPage = $request->integer('per_page', 50);

        if (!$request->filled('start_date') && !$request->filled('end_date') && !$request->filled('status') && !$request->filled('payment_status') && !$request->filled('billing_mode') && !$request->filled('search') && $request->integer('page', 1) === 1) {
            $cacheKey = "shop_{$shop->id}_invoices_p1_per_{$perPage}";
            $invoices = Cache::remember($cacheKey, 30, function () use ($query, $perPage) {
                return $query->orderBy('invoice_date', 'desc')
                    ->orderBy('id', 'desc')
                    ->paginate($perPage);
            });
            return response()->json($invoices);
        }

        $invoices = $query->orderBy('invoice_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        return response()->json($invoices);
    }

    /**
     * Get single invoice with full details.
     */
    public function show(Request $request, $id)
    {
        $shop = $request->get('current_shop');

        $invoice = Invoice::where('shop_id', $shop->id)
            ->where('id', $id)
            ->with([
                'items',
                'customer',
                'user:id,name',
                'payments' => function ($q) {
                    $q->orderBy('payment_date', 'asc')->orderBy('id', 'asc');
                },
                'shop:id,name,tagline,address_line1,address_line2,city,state,pincode,phone,email,gstin,logo_url,currency_symbol,is_gst_registered',
            ])
            ->firstOrFail();

        $invoiceSettings = InvoiceSetting::where('shop_id', $shop->id)->first();

        return response()->json([
            'invoice' => $invoice,
            'settings' => $invoiceSettings,
        ]);
    }

    /**
     * Create a new invoice (Catalogue-Based or Custom/Personal Billing Mode).
     */
    public function store(Request $request)
    {
        $shop = $request->get('current_shop');
        $user = $request->user();

        $validated = $request->validate([
            'billing_mode' => 'required|string|in:catalogue,custom,mixed',
            'invoice_type' => 'required|string|in:retail,gst',
            'invoice_date' => 'nullable|date',
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'customer_gstin' => 'nullable|string|max:20',
            'customer_address' => 'nullable|string|max:255',
            'overall_discount_type' => 'nullable|string|in:fixed,percentage',
            'overall_discount_value' => 'nullable|numeric|min:0',
            'payment_method' => 'required|string|in:cash,upi,card,bank_transfer,credit,mixed',
            'amount_paid' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'sync_id' => 'nullable|string|max:100',
            'is_interstate' => 'nullable|boolean',

            // Line items
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.category_name' => 'nullable|string|max:100',
            'items.*.is_custom_item' => 'boolean',
            'items.*.save_to_catalogue' => 'nullable|boolean',
            'items.*.unit' => 'required|string|max:20',
            'items.*.quantity' => 'required|numeric|gt:0',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_type' => 'nullable|string|in:fixed,percentage',
            'items.*.discount_value' => 'nullable|numeric|min:0',
            'items.*.gst_rate' => 'nullable|numeric|min:0',
            'items.*.hsn_code' => 'nullable|string|max:20',
        ]);

        // Check for idempotency if sync_id provided (from offline desktop app)
        if (!empty($validated['sync_id'])) {
            $existing = Invoice::where('shop_id', $shop->id)
                ->where('sync_id', $validated['sync_id'])
                ->first();
            if ($existing) {
                return response()->json([
                    'message' => 'Invoice already synced.',
                    'invoice' => $existing->load('items', 'customer'),
                ]);
            }
        }

        return DB::transaction(function () use ($shop, $user, $validated, $request) {
            // Customer resolution or creation if phone provided
            $customer = null;
            if (!empty($validated['customer_id'])) {
                $customer = Customer::where('shop_id', $shop->id)->where('id', $validated['customer_id'])->first();
            } elseif (!empty($validated['customer_phone'])) {
                $customer = Customer::where('shop_id', $shop->id)->where('phone', $validated['customer_phone'])->first();
                if (!$customer && !empty($validated['customer_name'])) {
                    $customer = Customer::create([
                        'shop_id' => $shop->id,
                        'name' => $validated['customer_name'],
                        'phone' => $validated['customer_phone'],
                        'address' => $validated['customer_address'] ?? null,
                        'gstin' => $validated['customer_gstin'] ?? null,
                    ]);
                }
            }

            // Generate unique invoice number
            $invoiceSetting = InvoiceSetting::firstOrCreate(
                ['shop_id' => $shop->id],
                ['invoice_prefix' => 'SB-', 'next_invoice_number' => 1]
            );

            $prefix = $invoiceSetting->invoice_prefix ?: 'SB-';
            $nextNum = $invoiceSetting->next_invoice_number ?: 1;
            $invoiceNumber = $prefix . str_pad($nextNum, 4, '0', STR_PAD_LEFT);

            // Ensure uniqueness
            while (Invoice::where('shop_id', $shop->id)->where('invoice_number', $invoiceNumber)->exists()) {
                $nextNum++;
                $invoiceNumber = $prefix . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
            }
            $invoiceSetting->update(['next_invoice_number' => $nextNum + 1]);

            $isGst = $validated['invoice_type'] === 'gst' && $shop->is_gst_registered;
            $isInterstate = !empty($validated['is_interstate']);

            // Calculate item lines
            $subtotal = 0.00;
            $itemDiscountTotal = 0.00;
            $totalTaxable = 0.00;
            $totalCgst = 0.00;
            $totalSgst = 0.00;
            $totalIgst = 0.00;
            $totalTax = 0.00;
            $processedItems = [];

            foreach ($validated['items'] as $itemData) {
                $qty = floatval($itemData['quantity']);
                $unitPrice = floatval($itemData['unit_price']);
                $grossLine = $qty * $unitPrice;

                // Item discount
                $discType = $itemData['discount_type'] ?? 'fixed';
                $discVal = floatval($itemData['discount_value'] ?? 0);
                $itemDiscount = 0.00;
                if ($discVal > 0) {
                    if ($discType === 'percentage') {
                        $itemDiscount = ($grossLine * $discVal) / 100.0;
                    } else {
                        $itemDiscount = $discVal;
                    }
                }
                $itemDiscount = min($itemDiscount, $grossLine);
                $netLine = $grossLine - $itemDiscount;

                // GST calculations
                $gstRate = $isGst ? floatval($itemData['gst_rate'] ?? 0) : 0.00;
                $cgst = 0.00;
                $sgst = 0.00;
                $igst = 0.00;
                $taxAmount = 0.00;

                if ($isGst && $gstRate > 0) {
                    // Standard inclusive tax computation: Taxable = Net / (1 + Rate/100)
                    $taxable = $netLine / (1.0 + ($gstRate / 100.0));
                    $taxAmount = $netLine - $taxable;

                    if ($isInterstate) {
                        $igst = $taxAmount;
                    } else {
                        $cgst = round($taxAmount / 2.0, 2);
                        $sgst = $taxAmount - $cgst;
                    }
                } else {
                    $taxable = $netLine;
                }

                $subtotal += $grossLine;
                $itemDiscountTotal += $itemDiscount;
                $totalTaxable += $taxable;
                $totalCgst += $cgst;
                $totalSgst += $sgst;
                $totalIgst += $igst;
                $totalTax += $taxAmount;

                // Check if user requested saving manual item to catalogue
                $productId = $itemData['product_id'] ?? null;
                if (!empty($itemData['is_custom_item']) && !empty($itemData['save_to_catalogue']) && empty($productId)) {
                    $cat = Category::firstOrCreate(
                        ['shop_id' => $shop->id, 'name' => $itemData['category_name'] ?: 'General'],
                        ['slug' => Str::slug($itemData['category_name'] ?: 'General')]
                    );
                    $newProd = Product::create([
                        'shop_id' => $shop->id,
                        'category_id' => $cat->id,
                        'name' => $itemData['item_name'],
                        'unit' => $itemData['unit'],
                        'default_price' => $unitPrice,
                        'mrp' => $unitPrice,
                        'gst_rate' => $gstRate,
                        'hsn_code' => $itemData['hsn_code'] ?? null,
                        'source' => 'quick_add',
                    ]);
                    $productId = $newProd->id;
                }

                $processedItems[] = [
                    'product_id' => $productId,
                    'item_name' => $itemData['item_name'],
                    'category_name' => $itemData['category_name'] ?? null,
                    'is_custom_item' => !empty($itemData['is_custom_item']),
                    'hsn_code' => $itemData['hsn_code'] ?? null,
                    'unit' => $itemData['unit'],
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'discount_type' => $discType,
                    'discount_value' => $discVal,
                    'discount_amount' => round($itemDiscount, 2),
                    'subtotal' => round($netLine, 2),
                    'gst_rate' => $gstRate,
                    'cgst_amount' => round($cgst, 2),
                    'sgst_amount' => round($sgst, 2),
                    'igst_amount' => round($igst, 2),
                    'tax_amount' => round($taxAmount, 2),
                    'total_amount' => round($netLine, 2),
                ];
            }

            // Overall bill discount
            $overallDiscType = $validated['overall_discount_type'] ?? 'fixed';
            $overallDiscVal = floatval($validated['overall_discount_value'] ?? 0);
            $billNetBeforeOverall = $subtotal - $itemDiscountTotal;
            $overallDiscAmount = 0.00;

            if ($overallDiscVal > 0) {
                if ($overallDiscType === 'percentage') {
                    $overallDiscAmount = ($billNetBeforeOverall * $overallDiscVal) / 100.0;
                } else {
                    $overallDiscAmount = $overallDiscVal;
                }
            }
            $overallDiscAmount = min($overallDiscAmount, $billNetBeforeOverall);
            $totalDiscount = $itemDiscountTotal + $overallDiscAmount;

            $netPayableBeforeRound = max(0, $subtotal - $totalDiscount);
            $finalAmount = round($netPayableBeforeRound);
            $roundOff = round($finalAmount - $netPayableBeforeRound, 2);

            $amountPaid = floatval($validated['amount_paid']);
            $balanceDue = max(0.00, $finalAmount - $amountPaid);

            // Determine payment status
            $paymentStatus = 'paid';
            if ($balanceDue > 0) {
                $paymentStatus = ($amountPaid > 0) ? 'partial' : ($validated['payment_method'] === 'credit' ? 'credit' : 'unpaid');
            }

            // Create Invoice
            $invoice = Invoice::create([
                'shop_id' => $shop->id,
                'user_id' => $user->id,
                'customer_id' => $customer?->id,
                'customer_name' => $customer?->name ?? ($validated['customer_name'] ?? null),
                'customer_phone' => $customer?->phone ?? ($validated['customer_phone'] ?? null),
                'customer_gstin' => $customer?->gstin ?? ($validated['customer_gstin'] ?? null),
                'customer_address' => $customer?->address ?? ($validated['customer_address'] ?? null),
                'invoice_number' => $invoiceNumber,
                'invoice_date' => !empty($validated['invoice_date']) ? Carbon::parse($validated['invoice_date']) : Carbon::now(),
                'billing_mode' => $validated['billing_mode'],
                'invoice_type' => $validated['invoice_type'],
                'subtotal' => round($subtotal, 2),
                'item_discount_total' => round($itemDiscountTotal, 2),
                'overall_discount_type' => $overallDiscType,
                'overall_discount_value' => $overallDiscVal,
                'overall_discount_amount' => round($overallDiscAmount, 2),
                'total_discount' => round($totalDiscount, 2),
                'taxable_amount' => round($totalTaxable, 2),
                'cgst_amount' => round($totalCgst, 2),
                'sgst_amount' => round($totalSgst, 2),
                'igst_amount' => round($totalIgst, 2),
                'total_tax' => round($totalTax, 2),
                'round_off' => $roundOff,
                'final_amount' => round($finalAmount, 2),
                'amount_paid' => round($amountPaid, 2),
                'balance_due' => round($balanceDue, 2),
                'payment_status' => $paymentStatus,
                'payment_method' => $validated['payment_method'],
                'notes' => $validated['notes'] ?? null,
                'status' => 'completed',
                'sync_id' => $validated['sync_id'] ?? null,
            ]);

            // Save items
            foreach ($processedItems as $item) {
                $item['invoice_id'] = $invoice->id;
                InvoiceItem::create($item);
            }

            // Record Payment if paid
            if ($amountPaid > 0) {
                $payNumber = 'PAY-' . date('Ymd') . '-' . str_pad(Payment::where('shop_id', $shop->id)->count() + 1, 4, '0', STR_PAD_LEFT);
                $payment = Payment::create([
                    'shop_id' => $shop->id,
                    'invoice_id' => $invoice->id,
                    'customer_id' => $customer?->id,
                    'payment_number' => $payNumber,
                    'payment_date' => $invoice->invoice_date,
                    'amount' => $amountPaid,
                    'payment_method' => $validated['payment_method'] === 'credit' ? 'cash' : $validated['payment_method'],
                    'payment_type' => 'invoice_payment',
                ]);
                PaymentAllocation::create([
                    'payment_id' => $payment->id,
                    'invoice_id' => $invoice->id,
                    'amount' => $amountPaid,
                ]);
            }

            // Update customer balance & total purchases if customer attached
            if ($customer) {
                $customer->increment('total_purchases', $finalAmount);
                if ($balanceDue > 0) {
                    $customer->increment('current_balance', $balanceDue);
                }
            }

            AuditLog::create([
                'shop_id' => $shop->id,
                'user_id' => $user->id,
                'action' => 'invoice.created',
                'entity_type' => 'invoice',
                'entity_id' => $invoice->id,
                'ip_address' => $request->ip(),
                'details' => [
                    'invoice_number' => $invoice->invoice_number,
                    'final_amount' => $invoice->final_amount,
                    'billing_mode' => $invoice->billing_mode,
                ],
            ]);

            Cache::forget("shop_{$shop->id}_dashboard_cache");
            Cache::forget("shop_{$shop->id}_products_all");
            Cache::forget("shop_{$shop->id}_invoices_page_1");
            Cache::forget("shop_{$shop->id}_invoices_p1_per_25");
            Cache::forget("shop_{$shop->id}_invoices_p1_per_50");
            Cache::forget("shop_{$shop->id}_invoices_p1_per_100");

            return response()->json([
                'message' => 'Invoice generated successfully.',
                'invoice' => $invoice->load(['items', 'customer', 'payments']),
            ], 201);
        });
    }

    /**
     * Cancel an issued invoice (Historical accuracy preserved: does not delete records).
     */
    public function cancel(Request $request, $id)
    {
        $shop = $request->get('current_shop');
        $user = $request->user();

        $invoice = Invoice::where('shop_id', $shop->id)->where('id', $id)->firstOrFail();

        if ($invoice->status === 'cancelled') {
            return response()->json(['message' => 'Invoice is already cancelled.'], 422);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        return DB::transaction(function () use ($shop, $user, $invoice, $validated, $request) {
            $invoice->update([
                'status' => 'cancelled',
                'cancellation_reason' => $validated['reason'],
                'cancelled_at' => Carbon::now(),
            ]);

            // Revert customer credit balance if invoice had balance due
            if ($invoice->customer_id && $invoice->balance_due > 0) {
                $customer = Customer::find($invoice->customer_id);
                if ($customer) {
                    $customer->decrement('current_balance', $invoice->balance_due);
                    $customer->decrement('total_purchases', $invoice->final_amount);
                }
            }

            AuditLog::create([
                'shop_id' => $shop->id,
                'user_id' => $user->id,
                'action' => 'invoice.cancelled',
                'entity_type' => 'invoice',
                'entity_id' => $invoice->id,
                'ip_address' => $request->ip(),
                'details' => [
                    'invoice_number' => $invoice->invoice_number,
                    'reason' => $validated['reason'],
                ],
            ]);

            Cache::forget("shop_{$shop->id}_dashboard_cache");
            Cache::forget("shop_{$shop->id}_invoices_page_1");
            Cache::forget("shop_{$shop->id}_invoices_p1_per_25");
            Cache::forget("shop_{$shop->id}_invoices_p1_per_50");
            Cache::forget("shop_{$shop->id}_invoices_p1_per_100");

            return response()->json([
                'message' => 'Invoice cancelled successfully.',
                'invoice' => $invoice->fresh(['items', 'customer']),
            ]);
        });
    }
}
