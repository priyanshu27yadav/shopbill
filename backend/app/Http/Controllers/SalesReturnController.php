<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Product;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesReturnController extends Controller
{
    /**
     * List sales returns / credit notes.
     */
    public function index(Request $request)
    {
        $shop = $request->get('current_shop');

        $query = SalesReturn::where('shop_id', $shop->id)
            ->with(['customer:id,name,phone', 'user:id,name', 'items']);

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('return_number', 'like', "%{$s}%")
                    ->orWhere('original_invoice_number', 'like', "%{$s}%")
                    ->orWhere('customer_name', 'like', "%{$s}%")
                    ->orWhere('customer_phone', 'like', "%{$s}%");
            });
        }

        if ($request->filled('start_date')) {
            $query->whereDate('return_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('return_date', '<=', $request->end_date);
        }

        $returns = $query->orderBy('return_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($request->integer('per_page', 25));

        return response()->json($returns);
    }

    /**
     * Get single return detail with items and shop info for printing Credit Note.
     */
    public function show(Request $request, $id)
    {
        $shop = $request->get('current_shop');

        $return = SalesReturn::where('shop_id', $shop->id)
            ->where('id', $id)
            ->with([
                'items',
                'customer',
                'invoice',
                'user:id,name',
                'shop:id,name,tagline,address_line1,address_line2,city,state,pincode,phone,email,gstin,logo_url,currency_symbol,is_gst_registered',
            ])
            ->firstOrFail();

        return response()->json([
            'sales_return' => $return,
        ]);
    }

    /**
     * Search original completed invoices by Invoice Number or Customer Phone.
     */
    public function searchInvoice(Request $request)
    {
        $shop = $request->get('current_shop');
        $query = trim($request->get('query', ''));

        if (empty($query)) {
            return response()->json([]);
        }

        $invoices = Invoice::where('shop_id', $shop->id)
            ->where('status', 'completed')
            ->where(function ($q) use ($query) {
                $q->where('invoice_number', 'like', "%{$query}%")
                    ->orWhere('customer_phone', 'like', "%{$query}%")
                    ->orWhere('customer_name', 'like', "%{$query}%");
            })
            ->with(['items.product', 'customer'])
            ->orderBy('invoice_date', 'desc')
            ->take(10)
            ->get();

        return response()->json($invoices);
    }

    /**
     * Process sales return / create Credit Note.
     */
    public function store(Request $request)
    {
        $shop = $request->get('current_shop');
        $user = $request->user();

        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'refund_method' => 'required|string|in:cash,upi,khata_adjustment,store_credit',
            'reason' => 'nullable|string|max:500',
            'restock_inventory' => 'boolean',
            'items' => 'required|array|min:1',
            'items.*.invoice_item_id' => 'required|exists:invoice_items,id',
            'items.*.quantity_returned' => 'required|numeric|gt:0',
        ]);

        $invoice = Invoice::where('shop_id', $shop->id)
            ->where('id', $validated['invoice_id'])
            ->with('items')
            ->firstOrFail();

        return DB::transaction(function () use ($shop, $user, $invoice, $validated, $request) {
            $restock = $validated['restock_inventory'] ?? true;

            // Generate unique Credit Note / Return Number
            $count = SalesReturn::where('shop_id', $shop->id)->count() + 1;
            $returnNumber = 'CN-' . date('Ymd') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

            $salesReturn = SalesReturn::create([
                'shop_id' => $shop->id,
                'user_id' => $user->id,
                'invoice_id' => $invoice->id,
                'customer_id' => $invoice->customer_id,
                'return_number' => $returnNumber,
                'return_date' => Carbon::now(),
                'original_invoice_number' => $invoice->invoice_number,
                'customer_name' => $invoice->customer_name,
                'customer_phone' => $invoice->customer_phone,
                'subtotal' => 0,
                'tax_amount' => 0,
                'refund_amount' => 0,
                'refund_method' => $validated['refund_method'],
                'reason' => $validated['reason'] ?? 'Customer Item Return',
                'restock_inventory' => $restock,
            ]);

            $totalSubtotal = 0;
            $totalTax = 0;
            $totalRefund = 0;

            foreach ($validated['items'] as $itemData) {
                $invoiceItem = $invoice->items->firstWhere('id', $itemData['invoice_item_id']);
                if (!$invoiceItem) {
                    continue;
                }

                $qtyReturned = floatval($itemData['quantity_returned']);
                $unitPrice = floatval($invoiceItem->unit_price);
                $gstRate = floatval($invoiceItem->gst_rate);

                $refundSubtotal = round($qtyReturned * $unitPrice, 2);
                $taxAmount = round($refundSubtotal * ($gstRate / 100), 2);
                $refundTotal = $refundSubtotal + $taxAmount;

                $totalSubtotal += $refundSubtotal;
                $totalTax += $taxAmount;
                $totalRefund += $refundTotal;

                SalesReturnItem::create([
                    'sales_return_id' => $salesReturn->id,
                    'invoice_item_id' => $invoiceItem->id,
                    'product_id' => $invoiceItem->product_id,
                    'item_name' => $invoiceItem->item_name,
                    'unit' => $invoiceItem->unit,
                    'unit_price' => $unitPrice,
                    'gst_rate' => $gstRate,
                    'tax_amount' => $taxAmount,
                    'quantity_returned' => $qtyReturned,
                    'refund_subtotal' => $refundSubtotal,
                    'refund_total' => $refundTotal,
                ]);

                // Restock inventory if product linked and restock selected
                if ($restock && $invoiceItem->product_id) {
                    Product::where('id', $invoiceItem->product_id)->increment('current_stock', $qtyReturned);
                }
            }

            // Update header totals
            $salesReturn->update([
                'subtotal' => $totalSubtotal,
                'tax_amount' => $totalTax,
                'refund_amount' => $totalRefund,
            ]);

            // Adjust Customer Balance and Purchases
            if ($invoice->customer_id) {
                $customer = Customer::find($invoice->customer_id);
                if ($customer) {
                    $customer->decrement('total_purchases', min($totalRefund, $customer->total_purchases));

                    // If refund method is khata_adjustment, deduct from pending udhaar
                    if ($validated['refund_method'] === 'khata_adjustment') {
                        $customer->decrement('current_balance', $totalRefund);
                    }
                }
            }

            AuditLog::create([
                'shop_id' => $shop->id,
                'user_id' => $user->id,
                'action' => 'sales_return.created',
                'entity_type' => 'sales_return',
                'entity_id' => $salesReturn->id,
                'ip_address' => $request->ip(),
                'details' => [
                    'return_number' => $returnNumber,
                    'original_invoice' => $invoice->invoice_number,
                    'refund_amount' => $totalRefund,
                    'refund_method' => $validated['refund_method'],
                ],
            ]);

            return response()->json([
                'message' => 'Sales return processed successfully.',
                'sales_return' => $salesReturn->load(['items', 'customer', 'invoice']),
            ], 201);
        });
    }
}
