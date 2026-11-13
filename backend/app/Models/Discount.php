<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Discount extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'name',
        'code',
        'type',
        'value',
        'min_bill_amount',
        'is_active',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'min_bill_amount' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}
