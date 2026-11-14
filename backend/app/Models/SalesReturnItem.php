<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesReturnItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_return_id',
        'invoice_item_id',
        'product_id',
        'item_name',
        'unit',
        'unit_price',
        'gst_rate',
        'tax_amount',
        'quantity_returned',
        'refund_subtotal',
        'refund_total',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'gst_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'quantity_returned' => 'decimal:3',
        'refund_subtotal' => 'decimal:2',
        'refund_total' => 'decimal:2',
    ];

    public function salesReturn()
    {
        return $this->belongsTo(SalesReturn::class);
    }

    public function invoiceItem()
    {
        return $this->belongsTo(InvoiceItem::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
