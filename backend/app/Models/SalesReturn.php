<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesReturn extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'user_id',
        'invoice_id',
        'customer_id',
        'return_number',
        'return_date',
        'original_invoice_number',
        'customer_name',
        'customer_phone',
        'subtotal',
        'tax_amount',
        'refund_amount',
        'refund_method',
        'reason',
        'restock_inventory',
    ];

    protected $casts = [
        'return_date' => 'datetime',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'restock_inventory' => 'boolean',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(SalesReturnItem::class);
    }
}
