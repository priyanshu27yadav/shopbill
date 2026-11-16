<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    /**
     * Clear cached customer listings and lookup caches for this shop.
     */
    private function clearCustomerCache($shopId, $phone = null)
    {
        Cache::forget("shop_{$shopId}_customers_p1_per50_b0");
        Cache::forget("shop_{$shopId}_customers_p1_per100_b0");
        Cache::forget("shop_{$shopId}_customers_p1_per50_b1");
        Cache::forget("shop_{$shopId}_customers_p1_per100_b1");

        if ($phone) {
            $cleanPhone = preg_replace('/[^\d]/', '', $phone);
            $last10 = strlen($cleanPhone) >= 10 ? substr($cleanPhone, -10) : $cleanPhone;
            Cache::forget("shop_{$shopId}_lookup_phone_" . ($last10 ?: $cleanPhone ?: md5($phone)));
        }
    }

    /**
     * List customers with balances.
     */
    public function index(Request $request)
    {
        $shop = $request->get('current_shop');
        $page = $request->integer('page', 1);
        $perPage = $request->integer('per_page', 50);
        $hasBal = $request->boolean('has_balance', false) ? '1' : '0';
        $cacheKey = "shop_{$shop->id}_customers_p{$page}_per{$perPage}_b{$hasBal}";

        // Fast cache hit if not searching (0ms)
        if (!$request->filled('search')) {
            $cached = Cache::get($cacheKey);
            if ($cached !== null) {
                return response()->json($cached);
            }
        }

        $query = Customer::where('shop_id', $shop->id);

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%")
                    ->orWhere('gstin', 'like', "%{$s}%");
            });
        }

        if ($request->boolean('has_balance', false)) {
            $query->where('current_balance', '>', 0);
        }

        $customers = $query->orderBy('name', 'asc')
            ->paginate($perPage);

        // Cache unfiltered pages for 60 seconds
        if (!$request->filled('search')) {
            Cache::put($cacheKey, $customers, 60);
        }

        return response()->json($customers);
    }

    /**
     * Fast lookup of customer by phone number with ledger & shopping summary.
     */
    public function lookupByPhone(Request $request)
    {
        $shop = $request->get('current_shop');
        $phone = trim($request->get('phone', ''));

        if (empty($phone)) {
            return response()->json(['found' => false, 'phone' => '']);
        }

        $cleanPhone = preg_replace('/[^\d]/', '', $phone);
        $last10 = strlen($cleanPhone) >= 10 ? substr($cleanPhone, -10) : $cleanPhone;
        $cacheKey = "shop_{$shop->id}_lookup_phone_" . ($last10 ?: $cleanPhone ?: md5($phone));

        // In-memory cache for ultra-fast lookup (0ms)
        $cached = \Illuminate\Support\Facades\Cache::get($cacheKey);
        if ($cached !== null) {
            return response()->json($cached);
        }

        // 1. Fast Index-based lookup with candidate list
        $candidates = array_values(array_unique(array_filter([
            $phone,
            $cleanPhone,
            $last10,
            !empty($last10) ? '+91' . $last10 : null,
            !empty($last10) ? '+91 ' . $last10 : null,
            !empty($last10) ? '0' . $last10 : null,
        ])));

        $customer = Customer::where('shop_id', $shop->id)
            ->whereIn('phone', $candidates)
            ->first();

        // 2. Fallback to suffix search if not found by exact candidate
        if (!$customer && !empty($last10) && strlen($last10) >= 6) {
            $customer = Customer::where('shop_id', $shop->id)
                ->where('phone', 'like', "%{$last10}")
                ->first();
        }

        if (!$customer) {
            $response = [
                'found' => false,
                'phone' => $phone,
            ];
            // Cache negative lookup for 60 seconds to avoid hammering DB while typing
            \Illuminate\Support\Facades\Cache::put($cacheKey, $response, 60);
            return response()->json($response);
        }

        // Summary calculations in single fast query
        $stats = DB::table('invoices')
            ->where('customer_id', $customer->id)
            ->where('status', '!=', 'cancelled')
            ->selectRaw('COALESCE(SUM(final_amount), 0) as total_shopping, COUNT(*) as total_bills')
            ->first();

        $totalShopping = floatval($stats->total_shopping ?? $customer->total_purchases ?? 0);
        $totalBills = intval($stats->total_bills ?? 0);
        $currentBalance = floatval($customer->current_balance);
        $totalPaid = max(0, $totalShopping - $currentBalance);

        $recentBills = $customer->invoices()
            ->with(['items:id,invoice_id,item_name,quantity,unit_price,total_amount'])
            ->select(['id', 'shop_id', 'customer_id', 'invoice_number', 'invoice_date', 'final_amount', 'amount_paid', 'balance_due', 'payment_status', 'payment_method'])
            ->orderBy('invoice_date', 'desc')
            ->take(6)
            ->get();

        $response = [
            'found' => true,
            'customer' => $customer,
            'summary' => [
                'total_shopping' => $totalShopping,
                'total_bills' => $totalBills,
                'current_balance' => $currentBalance,
                'total_paid' => $totalPaid,
                'credit_limit' => floatval($customer->credit_limit),
            ],
            'recent_bills' => $recentBills,
        ];

        // Cache customer lookup for 2 minutes
        \Illuminate\Support\Facades\Cache::put($cacheKey, $response, 120);

        return response()->json($response);
    }

    /**
     * Create customer.
     */
    public function store(Request $request)
    {
        $shop = $request->get('current_shop');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string',
            'gstin' => 'nullable|string|max:20',
            'credit_limit' => 'nullable|numeric|min:0',
            'opening_balance' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $customer = Customer::create([
            'shop_id' => $shop->id,
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'] ?? null,
            'gstin' => $validated['gstin'] ?? null,
            'credit_limit' => $validated['credit_limit'] ?? 0.00,
            'current_balance' => $validated['opening_balance'] ?? 0.00,
            'notes' => $validated['notes'] ?? null,
        ]);

        $this->clearCustomerCache($shop->id, $customer->phone);

        return response()->json([
            'message' => 'Customer created successfully.',
            'customer' => $customer,
        ], 201);
    }

    /**
     * Show customer profile and purchase history.
     */
    public function show(Request $request, $id)
    {
        $shop = $request->get('current_shop');
        $customer = Customer::where('shop_id', $shop->id)->where('id', $id)->firstOrFail();

        $invoices = $customer->invoices()
            ->with([
                'items:id,invoice_id,item_name,quantity,unit,unit_price,total_amount',
                'payments' => function ($q) {
                    $q->orderBy('payment_date', 'asc');
                },
            ])
            ->orderBy('invoice_date', 'desc')
            ->take(50)
            ->get();

        $payments = Payment::where('customer_id', $customer->id)
            ->with(['invoice:id,invoice_number'])
            ->orderBy('payment_date', 'desc')
            ->take(50)
            ->get();

        return response()->json([
            'customer' => $customer,
            'invoices' => $invoices,
            'payments' => $payments,
        ]);
    }

    /**
     * Update customer.
     */
    public function update(Request $request, $id)
    {
        $shop = $request->get('current_shop');
        $customer = Customer::where('shop_id', $shop->id)->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string',
            'gstin' => 'nullable|string|max:20',
            'credit_limit' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $customer->update($validated);
        $this->clearCustomerCache($shop->id, $customer->phone);

        return response()->json([
            'message' => 'Customer updated successfully.',
            'customer' => $customer,
        ]);
    }

    /**
     * Record payment collection against customer's outstanding Udhaar / credit balance.
     * Automatically clears unpaid invoice dues and creates linked payment records.
     */
    public function collectPayment(Request $request, $id)
    {
        $shop = $request->get('current_shop');
        $user = $request->user();
        $customer = Customer::where('shop_id', $shop->id)->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'amount' => 'required|numeric|gt:0',
            'payment_method' => 'required|string|in:cash,upi,card,bank_transfer,cheque',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'invoice_id' => 'nullable|exists:invoices,id',
        ]);

        return DB::transaction(function () use ($shop, $user, $customer, $validated, $request) {
            $totalAmount = floatval($validated['amount']);
            $remaining = $totalAmount;
            $payMethod = $validated['payment_method'];
            $refNumber = $validated['reference_number'] ?? null;
            $userNotes = $validated['notes'] ?? 'Settlement towards outstanding balance';

            $allocatedPayments = [];
            $now = Carbon::now();
            $paySeq = Payment::where('shop_id', $shop->id)->count() + 1;

            // 1. If a specific invoice is targeted by ID
            if (!empty($validated['invoice_id'])) {
                $targetInv = Invoice::where('shop_id', $shop->id)
                    ->where('customer_id', $customer->id)
                    ->where('id', $validated['invoice_id'])
                    ->first();

                if ($targetInv && $targetInv->balance_due > 0) {
                    $alloc = min($remaining, floatval($targetInv->balance_due));
                    $newPaid = round(floatval($targetInv->amount_paid) + $alloc, 2);
                    $newDue = max(0.00, round(floatval($targetInv->final_amount) - $newPaid, 2));
                    $newStatus = ($newDue <= 0.00) ? 'paid' : 'partial';

                    $targetInv->update([
                        'amount_paid' => $newPaid,
                        'balance_due' => $newDue,
                        'payment_status' => $newStatus,
                    ]);

                    $payNumber = 'PAY-DUE-' . date('Ymd') . '-' . str_pad($paySeq++, 4, '0', STR_PAD_LEFT);
                    $payment = Payment::create([
                        'shop_id' => $shop->id,
                        'customer_id' => $customer->id,
                        'invoice_id' => $targetInv->id,
                        'payment_number' => $payNumber,
                        'payment_date' => $now,
                        'amount' => $alloc,
                        'payment_method' => $payMethod,
                        'reference_number' => $refNumber,
                        'payment_type' => 'due_clearance',
                        'notes' => "Due cleared for Bill #{$targetInv->invoice_number}. " . $userNotes,
                    ]);

                    PaymentAllocation::create([
                        'payment_id' => $payment->id,
                        'invoice_id' => $targetInv->id,
                        'amount' => $alloc,
                    ]);

                    $allocatedPayments[] = $payment;
                    $remaining = round($remaining - $alloc, 2);
                }
            }

            // 2. Auto-allocate across unpaid/partial invoices (FIFO - oldest debt cleared first)
            if ($remaining > 0) {
                $unpaidInvoices = Invoice::where('shop_id', $shop->id)
                    ->where('customer_id', $customer->id)
                    ->where('status', 'completed')
                    ->where('balance_due', '>', 0)
                    ->orderBy('invoice_date', 'asc')
                    ->orderBy('id', 'asc')
                    ->get();

                foreach ($unpaidInvoices as $inv) {
                    if ($remaining <= 0) break;

                    $alloc = min($remaining, floatval($inv->balance_due));
                    $newPaid = round(floatval($inv->amount_paid) + $alloc, 2);
                    $newDue = max(0.00, round(floatval($inv->final_amount) - $newPaid, 2));
                    $newStatus = ($newDue <= 0.00) ? 'paid' : 'partial';

                    $inv->update([
                        'amount_paid' => $newPaid,
                        'balance_due' => $newDue,
                        'payment_status' => $newStatus,
                    ]);

                    $payNumber = 'PAY-DUE-' . date('Ymd') . '-' . str_pad($paySeq++, 4, '0', STR_PAD_LEFT);
                    $payment = Payment::create([
                        'shop_id' => $shop->id,
                        'customer_id' => $customer->id,
                        'invoice_id' => $inv->id,
                        'payment_number' => $payNumber,
                        'payment_date' => $now,
                        'amount' => $alloc,
                        'payment_method' => $payMethod,
                        'reference_number' => $refNumber,
                        'payment_type' => 'due_clearance',
                        'notes' => "Due cleared for Bill #{$inv->invoice_number}. " . $userNotes,
                    ]);

                    PaymentAllocation::create([
                        'payment_id' => $payment->id,
                        'invoice_id' => $inv->id,
                        'amount' => $alloc,
                    ]);

                    $allocatedPayments[] = $payment;
                    $remaining = round($remaining - $alloc, 2);
                }
            }

            // 3. If any leftover advance payment beyond invoice dues
            if ($remaining > 0) {
                $payNumber = 'PAY-CUST-' . date('Ymd') . '-' . str_pad($paySeq++, 4, '0', STR_PAD_LEFT);
                $payment = Payment::create([
                    'shop_id' => $shop->id,
                    'customer_id' => $customer->id,
                    'invoice_id' => null,
                    'payment_number' => $payNumber,
                    'payment_date' => $now,
                    'amount' => $remaining,
                    'payment_method' => $payMethod,
                    'reference_number' => $refNumber,
                    'payment_type' => 'customer_credit_settlement',
                    'notes' => $userNotes,
                ]);
                $allocatedPayments[] = $payment;
            }

            // 4. Synchronize customer outstanding balance accurately
            $remainingDue = Invoice::where('shop_id', $shop->id)
                ->where('customer_id', $customer->id)
                ->where('status', 'completed')
                ->sum('balance_due');

            $customer->current_balance = max(0.00, round(floatval($remainingDue), 2));
            $customer->save();

            // 5. Invalidate caches so Invoice History, Customer List and Dashboard reflect immediate update
            Cache::forget("shop_{$shop->id}_dashboard_cache");
            Cache::forget("shop_{$shop->id}_invoices_page_1");
            Cache::forget("shop_{$shop->id}_invoices_p1_per_25");
            Cache::forget("shop_{$shop->id}_invoices_p1_per_50");
            Cache::forget("shop_{$shop->id}_invoices_p1_per_100");
            $this->clearCustomerCache($shop->id, $customer->phone);

            AuditLog::create([
                'shop_id' => $shop->id,
                'user_id' => $user->id,
                'action' => 'customer.payment_collected',
                'entity_type' => 'payment',
                'entity_id' => $allocatedPayments[0]->id ?? null,
                'ip_address' => $request->ip(),
                'details' => ['customer_name' => $customer->name, 'amount' => $totalAmount],
            ]);

            return response()->json([
                'message' => 'Payment recorded, bill dues cleared, and customer ledger updated successfully.',
                'payments' => $allocatedPayments,
                'updated_balance' => $customer->current_balance,
            ]);
        });
    }

    /**
     * Delete customer.
     */
    public function destroy(Request $request, $id)
    {
        $shop = $request->get('current_shop');
        $customer = Customer::where('shop_id', $shop->id)->where('id', $id)->firstOrFail();

        if ($customer->invoices()->exists()) {
            return response()->json(['message' => 'Cannot delete customer with existing invoices.'], 422);
        }

        $phone = $customer->phone;
        $customer->delete();
        $this->clearCustomerCache($shop->id, $phone);

        return response()->json(['message' => 'Customer deleted successfully.']);
    }
}
