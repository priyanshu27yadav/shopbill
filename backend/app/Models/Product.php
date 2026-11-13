<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'category_id',
        'name',
        'barcode',
        'sku',
        'unit_id',
        'unit',
        'default_price',
        'mrp',
        'gst_rate',
        'hsn_code',
        'is_tax_inclusive',
        'description',
        'is_active',
        'source',
    ];

    protected $casts = [
        'default_price' => 'decimal:2',
        'mrp' => 'decimal:2',
        'gst_rate' => 'decimal:2',
        'is_tax_inclusive' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function productUnit()
    {
        return $this->belongsTo(ProductUnit::class, 'unit_id');
    }

    public function invoiceItems()
    {
        return $this->hasMany(InvoiceItem::class);
    }
}
