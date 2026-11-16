<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Daily Sales Report.
     */
    public function dailySales(Request $request)
    {
        $shop = $request->get('current_shop');
        $date = $request->filled('date') ? Carbon::parse($request->date) : Carbon::today();
        $dateStr = $date->toDateString();

        $data = Cache::remember("shop_{$shop->id}_report_daily_{$dateStr}", 60, function () use ($shop, $date, $dateStr) {
            $invoices = Invoice::where('shop_id', $shop->id)
                ->where('status', 'completed')
                ->whereDate('invoice_date', $date)
                ->with(['customer:id,name,phone'])
                ->orderBy('invoice_date', 'asc')
                ->get();

            $summary = [
                'date' => $dateStr,
                'total_bills' => $invoices->count(),
                'total_sales' => $invoices->sum('final_amount'),
                'total_discounts' => $invoices->sum('total_discount'),
                'total_tax' => $invoices->sum('total_tax'),
                'cash_sales' => $invoices->where('payment_method', 'cash')->sum('amount_paid'),
                'upi_sales' => $invoices->where('payment_method', 'upi')->sum('amount_paid'),
                'card_sales' => $invoices->where('payment_method', 'card')->sum('amount_paid'),
                'credit_sales' => $invoices->sum('balance_due'),
            ];

            return [
                'summary' => $summary,
                'invoices' => $invoices,
            ];
        });

        return response()->json($data);
    }

    /**
     * Monthly Sales Report.
     */
    public function monthlySales(Request $request)
    {
        $shop = $request->get('current_shop');
        $year = $request->integer('year', Carbon::now()->year);
        $month = $request->integer('month', Carbon::now()->month);

        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        $dailyBreakdown = Invoice::where('shop_id', $shop->id)
            ->where('status', 'completed')
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->select(
                DB::raw('DATE(invoice_date) as date'),
                DB::raw('COUNT(*) as bills_count'),
                DB::raw('SUM(subtotal) as gross_sales'),
                DB::raw('SUM(total_discount) as total_discounts'),
                DB::raw('SUM(total_tax) as total_tax'),
                DB::raw('SUM(final_amount) as total_sales'),
                DB::raw('SUM(amount_paid) as collected'),
                DB::raw('SUM(balance_due) as credit')
            )
            ->groupBy(DB::raw('DATE(invoice_date)'))
            ->orderBy('date', 'asc')
            ->get();

        $monthSummary = [
            'month' => $startDate->format('F Y'),
            'total_bills' => $dailyBreakdown->sum('bills_count'),
            'total_sales' => $dailyBreakdown->sum('total_sales'),
            'total_discounts' => $dailyBreakdown->sum('total_discounts'),
            'total_tax' => $dailyBreakdown->sum('total_tax'),
            'total_collected' => $dailyBreakdown->sum('collected'),
            'total_credit' => $dailyBreakdown->sum('credit'),
        ];

        return response()->json([
            'summary' => $monthSummary,
            'daily_breakdown' => $dailyBreakdown,
        ]);
    }

    /**
     * Item-wise Sales Report.
     */
    public function itemWiseSales(Request $request)
    {
        $shop = $request->get('current_shop');
        $startDate = $request->filled('start_date') ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->startOfMonth();
        $endDate = $request->filled('end_date') ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfDay();

        $items = InvoiceItem::whereHas('invoice', function ($q) use ($shop, $startDate, $endDate) {
                $q->where('shop_id', $shop->id)
                    ->where('status', 'completed')
                    ->whereBetween('invoice_date', [$startDate, $endDate]);
            })
            ->select(
                'item_name',
                'category_name',
                'unit',
                DB::raw('COUNT(*) as times_billed'),
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('SUM(subtotal) as gross_amount'),
                DB::raw('SUM(discount_amount) as discount_amount'),
                DB::raw('SUM(total_amount) as net_amount')
            )
            ->groupBy('item_name', 'category_name', 'unit')
            ->orderBy('total_quantity', 'desc')
            ->get();

        return response()->json([
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'items' => $items,
        ]);
    }

    /**
     * Category-wise Sales Report.
     */
    public function categoryWiseSales(Request $request)
    {
        $shop = $request->get('current_shop');
        $startDate = $request->filled('start_date') ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->startOfMonth();
        $endDate = $request->filled('end_date') ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfDay();

        $categories = InvoiceItem::whereHas('invoice', function ($q) use ($shop, $startDate, $endDate) {
                $q->where('shop_id', $shop->id)
                    ->where('status', 'completed')
                    ->whereBetween('invoice_date', [$startDate, $endDate]);
            })
            ->select(
                DB::raw("COALESCE(category_name, 'General') as category_name"),
                DB::raw('SUM(quantity) as total_items_sold'),
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('COUNT(DISTINCT invoice_id) as invoice_count')
            )
            ->groupBy(DB::raw("COALESCE(category_name, 'General')"))
            ->orderByDesc(DB::raw('SUM(total_amount)'))
            ->get();

        return response()->json([
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'total_categories' => $categories->count(),
            'total_revenue' => $categories->sum('total_revenue'),
            'total_items_sold' => $categories->sum('total_items_sold'),
            'categories' => $categories,
        ]);
    }

    /**
     * Discount Report.
     */
    public function discounts(Request $request)
    {
        $shop = $request->get('current_shop');
        $startDate = $request->filled('start_date') ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->startOfMonth();
        $endDate = $request->filled('end_date') ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfDay();

        $invoicesWithDiscounts = Invoice::where('shop_id', $shop->id)
            ->where('status', 'completed')
            ->where('total_discount', '>', 0)
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->with(['customer:id,name,phone'])
            ->orderBy('invoice_date', 'desc')
            ->get(['id', 'customer_id', 'invoice_number', 'invoice_date', 'customer_name', 'subtotal', 'item_discount_total', 'overall_discount_amount', 'total_discount', 'final_amount', 'payment_method']);

        return response()->json([
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'total_discount_given' => $invoicesWithDiscounts->sum('total_discount'),
            'bills_with_discounts' => $invoicesWithDiscounts->count(),
            'invoices' => $invoicesWithDiscounts,
        ]);
    }

    /**
     * Payment Method Report.
     */
    public function paymentMethods(Request $request)
    {
        $shop = $request->get('current_shop');
        $startDate = $request->filled('start_date') ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->startOfMonth();
        $endDate = $request->filled('end_date') ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfDay();

        $methods = Payment::where('shop_id', $shop->id)
            ->whereBetween('payment_date', [$startDate, $endDate])
            ->select('payment_method', DB::raw('COUNT(*) as total_transactions'), DB::raw('SUM(amount) as total_collected'))
            ->groupBy('payment_method')
            ->get();

        return response()->json([
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'methods' => $methods,
            'total_collected' => $methods->sum('total_collected'),
            'total_transactions' => $methods->sum('total_transactions'),
        ]);
    }

    /**
     * Customer Credit / Udhaar Report.
     */
    public function customerCredit(Request $request)
    {
        $shop = $request->get('current_shop');

        $debtors = Customer::where('shop_id', $shop->id)
            ->where('current_balance', '>', 0)
            ->orderBy('current_balance', 'desc')
            ->get();

        return response()->json([
            'total_outstanding' => $debtors->sum('current_balance'),
            'total_credit_customers' => $debtors->count(),
            'total_credit_limit' => $debtors->sum('credit_limit'),
            'customers' => $debtors,
        ]);
    }

    /**
     * GST Sales Summary Report (GSTR-1 Ready).
     */
    public function gstSummary(Request $request)
    {
        $shop = $request->get('current_shop');
        $startDate = $request->filled('start_date') ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->startOfMonth();
        $endDate = $request->filled('end_date') ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfDay();

        // Group by GST rate
        $rateBreakdown = InvoiceItem::whereHas('invoice', function ($q) use ($shop, $startDate, $endDate) {
                $q->where('shop_id', $shop->id)
                    ->where('status', 'completed')
                    ->where('invoice_type', 'gst')
                    ->whereBetween('invoice_date', [$startDate, $endDate]);
            })
            ->select(
                'gst_rate',
                DB::raw('SUM(subtotal) as taxable_value'),
                DB::raw('SUM(cgst_amount) as cgst_amount'),
                DB::raw('SUM(sgst_amount) as sgst_amount'),
                DB::raw('SUM(igst_amount) as igst_amount'),
                DB::raw('SUM(tax_amount) as total_tax')
            )
            ->groupBy('gst_rate')
            ->orderBy('gst_rate', 'asc')
            ->get();

        $invoices = Invoice::where('shop_id', $shop->id)
            ->where('status', 'completed')
            ->where('invoice_type', 'gst')
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->select('id', 'invoice_number', 'invoice_date', 'customer_name', 'customer_gstin', 'taxable_amount', 'cgst_amount', 'sgst_amount', 'igst_amount', 'total_tax', 'final_amount')
            ->get();

        return response()->json([
            'shop_gstin' => $shop->gstin,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'rate_breakdown' => $rateBreakdown,
            'total_taxable' => $rateBreakdown->sum('taxable_value'),
            'total_tax' => $rateBreakdown->sum('total_tax'),
            'invoices' => $invoices,
        ]);
    }
}
