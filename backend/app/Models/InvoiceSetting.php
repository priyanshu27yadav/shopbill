<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'invoice_prefix',
        'next_invoice_number',
        'template',
        'show_gst',
        'show_hsn',
        'show_shop_logo',
        'terms_and_conditions',
        'footer_message',
        'show_upi_qr',
        'upi_id',
        'custom_qr_url',
    ];

    protected $casts = [
        'next_invoice_number' => 'integer',
        'show_gst' => 'boolean',
        'show_hsn' => 'boolean',
        'show_shop_logo' => 'boolean',
        'show_upi_qr' => 'boolean',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}
