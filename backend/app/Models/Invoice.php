<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'user_id',
        'customer_id',
        'customer_name',
        'customer_phone',
        'customer_gstin',
        'customer_address',
        'invoice_number',
        'invoice_date',
        'billing_mode',
        'invoice_type',
        'subtotal',
        'item_discount_total',
        'overall_discount_type',
        'overall_discount_value',
        'overall_discount_amount',
        'total_discount',
        'taxable_amount',
        'cgst_amount',
        'sgst_amount',
        'igst_amount',
        'total_tax',
        'round_off',
        'final_amount',
        'amount_paid',
        'balance_due',
        'payment_status',
        'payment_method',
        'notes',
        'status',
        'cancellation_reason',
        'cancelled_at',
        'sync_id',
    ];

    protected $casts = [
        'invoice_date' => 'datetime',
        'cancelled_at' => 'datetime',
        'subtotal' => 'decimal:2',
        'item_discount_total' => 'decimal:2',
        'overall_discount_value' => 'decimal:2',
        'overall_discount_amount' => 'decimal:2',
        'total_discount' => 'decimal:2',
        'taxable_amount' => 'decimal:2',
        'cgst_amount' => 'decimal:2',
        'sgst_amount' => 'decimal:2',
        'igst_amount' => 'decimal:2',
        'total_tax' => 'decimal:2',
        'round_off' => 'decimal:2',
        'final_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'balance_due' => 'decimal:2',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
