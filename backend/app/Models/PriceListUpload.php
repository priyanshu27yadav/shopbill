<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PriceListUpload extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'user_id',
        'original_filename',
        'file_path',
        'file_size',
        'extracted_items_count',
        'parsed_data',
        'status',
        'notes',
    ];

    protected $casts = [
        'parsed_data' => 'array',
        'extracted_items_count' => 'integer',
        'file_size' => 'integer',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
