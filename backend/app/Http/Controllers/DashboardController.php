<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get aggregated metrics for shopkeeper dashboard.
     */
    public function index(Request $request)
    {
        $shop = $request->get('current_shop');
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();

        // 1. Today's stats
        $todayInvoices = Invoice::where('shop_id', $shop->id)
            ->where('status', 'completed')
            ->whereDate('invoice_date', $today)
            ->get();

        $todayBillsCount = $todayInvoices->count();
        $todaySales = $todayInvoices->sum('final_amount');
        $todayDiscounts = $todayInvoices->sum('total_discount');

        // 2. Month sales & discounts
        $monthInvoices = Invoice::where('shop_id', $shop->id)
            ->where('status', 'completed')
            ->where('invoice_date', '>=', $startOfMonth)
            ->get();

        $monthSales = $monthInvoices->sum('final_amount');
        $monthBillsCount = $monthInvoices->count();
        $monthDiscounts = $monthInvoices->sum('total_discount');

        // 3. GST collected summary (All-time or Month)
        $gstSummary = [
            'total_tax' => $monthInvoices->sum('total_tax'),
            'cgst' => $monthInvoices->sum('cgst_amount'),
            'sgst' => $monthInvoices->sum('sgst_amount'),
            'igst' => $monthInvoices->sum('igst_amount'),
            'taxable_amount' => $monthInvoices->sum('taxable_amount'),
        ];

        // 4. Payment method breakdown for the month
        $paymentMethods = Invoice::where('shop_id', $shop->id)
            ->where('status', 'completed')
            ->where('invoice_date', '>=', $startOfMonth)
            ->select('payment_method', DB::raw('SUM(amount_paid) as total_amount'), DB::raw('COUNT(*) as count'))
            ->groupBy('payment_method')
            ->get();

        // 5. Total outstanding Udhaar / customer balances
        $totalCustomerOutstanding = Customer::where('shop_id', $shop->id)
            ->where('current_balance', '>', 0)
            ->sum('current_balance');

        $topDebtors = Customer::where('shop_id', $shop->id)
            ->where('current_balance', '>', 0)
            ->orderBy('current_balance', 'desc')
            ->take(5)
            ->get(['id', 'name', 'phone', 'current_balance', 'credit_limit']);

        // 6. Most frequently billed items
        $topItems = InvoiceItem::whereHas('invoice', function ($q) use ($shop) {
                $q->where('shop_id', $shop->id)->where('status', 'completed');
            })
            ->select('item_name', 'unit', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(total_amount) as total_revenue'), DB::raw('COUNT(*) as bill_count'))
            ->groupBy('item_name', 'unit')
            ->orderBy('total_qty', 'desc')
            ->take(6)
            ->get();

        // 7. Recent bills
        $recentBills = Invoice::where('shop_id', $shop->id)
            ->with(['customer:id,name,phone'])
            ->orderBy('invoice_date', 'desc')
            ->orderBy('id', 'desc')
            ->take(8)
            ->get();

        // 8. 7-day sales trend for chart
        $salesTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $daySum = Invoice::where('shop_id', $shop->id)
                ->where('status', 'completed')
                ->whereDate('invoice_date', $date)
                ->sum('final_amount');

            $salesTrend[] = [
                'date' => $date->format('M d'),
                'day' => $date->format('D'),
                'sales' => (float)$daySum,
            ];
        }

        return response()->json([
            'today' => [
                'bills_count' => $todayBillsCount,
                'sales' => (float)$todaySales,
                'discounts' => (float)$todayDiscounts,
            ],
            'month' => [
                'bills_count' => $monthBillsCount,
                'sales' => (float)$monthSales,
                'discounts' => (float)$monthDiscounts,
            ],
            'gst_summary' => $gstSummary,
            'payment_methods' => $paymentMethods,
            'customer_outstanding' => (float)$totalCustomerOutstanding,
            'top_debtors' => $topDebtors,
            'top_items' => $topItems,
            'recent_bills' => $recentBills,
            'sales_trend' => $salesTrend,
        ]);
    }
}
