<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shop extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'business_type',
        'tagline',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'pincode',
        'phone',
        'email',
        'gstin',
        'is_gst_registered',
        'logo_url',
        'currency_symbol',
        'status',
    ];

    protected $casts = [
        'is_gst_registered' => 'boolean',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function shopUsers()
    {
        return $this->hasMany(ShopUser::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'shop_users')->withPivot([
            'role',
            'can_give_discount',
            'can_view_reports',
            'can_manage_items',
            'can_cancel_bills',
            'status',
        ]);
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function productUnits()
    {
        return $this->hasMany(ProductUnit::class);
    }

    public function taxRates()
    {
        return $this->hasMany(TaxRate::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function discounts()
    {
        return $this->hasMany(Discount::class);
    }

    public function settings()
    {
        return $this->hasMany(ShopSetting::class);
    }

    public function invoiceSetting()
    {
        return $this->hasOne(InvoiceSetting::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }
}
