<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    /**
     * List customers with balances.
     */
    public function index(Request $request)
    {
        $shop = $request->get('current_shop');

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
            ->paginate($request->integer('per_page', 50));

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
        $last10 = substr($cleanPhone, -10);

        $customer = Customer::where('shop_id', $shop->id)
            ->where(function ($q) use ($phone, $cleanPhone, $last10) {
                $q->where('phone', $phone)
                    ->orWhere('phone', $cleanPhone);
                if (!empty($last10)) {
                    $q->orWhere('phone', 'like', "%{$last10}%");
                }
            })
            ->first();

        if (!$customer) {
            return response()->json([
                'found' => false,
                'phone' => $phone,
            ]);
        }

        // Summary calculations
        $invoicesQuery = $customer->invoices()->where('status', '!=', 'cancelled');
        $totalShopping = floatval($invoicesQuery->sum('final_amount'));
        $totalBills = $invoicesQuery->count();
        $currentBalance = floatval($customer->current_balance);
        $totalPaid = max(0, $totalShopping - $currentBalance);

        $recentBills = $customer->invoices()
            ->with(['items'])
            ->orderBy('invoice_date', 'desc')
            ->take(8)
            ->get();

        return response()->json([
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
        ]);
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
            ->orderBy('invoice_date', 'desc')
            ->take(50)
            ->get();

        $payments = Payment::where('customer_id', $customer->id)
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

        return response()->json([
            'message' => 'Customer updated successfully.',
            'customer' => $customer,
        ]);
    }

    /**
     * Record payment collection against customer's outstanding Udhaar / credit balance.
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
        ]);

        return DB::transaction(function () use ($shop, $user, $customer, $validated, $request) {
            $amount = floatval($validated['amount']);

            $payNumber = 'PAY-CUST-' . date('Ymd') . '-' . str_pad(Payment::where('shop_id', $shop->id)->count() + 1, 4, '0', STR_PAD_LEFT);

            $payment = Payment::create([
                'shop_id' => $shop->id,
                'customer_id' => $customer->id,
                'invoice_id' => null,
                'payment_number' => $payNumber,
                'payment_date' => Carbon::now(),
                'amount' => $amount,
                'payment_method' => $validated['payment_method'],
                'reference_number' => $validated['reference_number'] ?? null,
                'payment_type' => 'customer_credit_settlement',
                'notes' => $validated['notes'] ?? 'Settlement towards outstanding balance',
            ]);

            // Deduct from customer current_balance
            $customer->decrement('current_balance', $amount);

            AuditLog::create([
                'shop_id' => $shop->id,
                'user_id' => $user->id,
                'action' => 'customer.payment_collected',
                'entity_type' => 'payment',
                'entity_id' => $payment->id,
                'ip_address' => $request->ip(),
                'details' => ['customer_name' => $customer->name, 'amount' => $amount],
            ]);

            return response()->json([
                'message' => 'Payment recorded and customer balance updated successfully.',
                'payment' => $payment,
                'updated_balance' => $customer->fresh()->current_balance,
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

        $customer->delete();

        return response()->json(['message' => 'Customer deleted successfully.']);
    }
}
