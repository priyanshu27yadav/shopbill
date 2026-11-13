<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'is_active',
        'current_shop_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function ownedShops()
    {
        return $this->hasMany(Shop::class, 'user_id');
    }

    public function shopUsers()
    {
        return $this->hasMany(ShopUser::class, 'user_id');
    }

    public function shops()
    {
        return $this->belongsToMany(Shop::class, 'shop_users')->withPivot([
            'role',
            'can_give_discount',
            'can_view_reports',
            'can_manage_items',
            'can_cancel_bills',
            'status',
        ]);
    }

    public function currentShop()
    {
        return $this->belongsTo(Shop::class, 'current_shop_id');
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }
}
