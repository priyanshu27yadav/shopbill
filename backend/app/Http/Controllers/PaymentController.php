<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    /**
     * List payments for shop.
     */
    public function index(Request $request)
    {
        $shop = $request->get('current_shop');

        $query = Payment::where('shop_id', $shop->id)
            ->with(['customer:id,name,phone', 'invoice:id,invoice_number']);

        if ($request->filled('start_date')) {
            $query->whereDate('payment_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('payment_date', '<=', $request->end_date);
        }
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }
        if ($request->filled('payment_type')) {
            $query->where('payment_type', $request->payment_type);
        }

        $payments = $query->orderBy('payment_date', 'desc')
            ->paginate($request->integer('per_page', 50));

        return response()->json($payments);
    }
}
