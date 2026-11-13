<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShopUser extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'user_id',
        'role_id',
        'role',
        'can_give_discount',
        'can_view_reports',
        'can_manage_items',
        'can_cancel_bills',
        'status',
    ];

    protected $casts = [
        'can_give_discount' => 'boolean',
        'can_view_reports' => 'boolean',
        'can_manage_items' => 'boolean',
        'can_cancel_bills' => 'boolean',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function roleModel()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }
}
