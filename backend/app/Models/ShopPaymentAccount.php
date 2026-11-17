<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class ShopPaymentAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'provider',
        'connection_type',
        'environment',
        'status',
        'is_primary',
        'merchant_id',
        'account_id',
        'app_id',
        'secret_key',
        'webhook_secret',
        'business_name',
        'business_type',
        'business_category',
        'shop_address',
        'state',
        'district',
        'city',
        'pincode',
        'owner_name',
        'owner_mobile',
        'owner_email',
        'owner_pan_masked',
        'bank_account_holder',
        'bank_account_number_masked',
        'bank_ifsc',
        'bank_name',
        'application_reference',
        'kyc_status',
        'onboarding_url',
        'verified_at',
        'meta',
    ];

    protected $hidden = [
        'secret_key',
        'webhook_secret',
    ];

    protected $appends = [
        'has_secret',
        'masked_app_id',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'verified_at' => 'datetime',
        'meta' => 'array',
    ];

    public function setSecretKeyAttribute($value)
    {
        $this->attributes['secret_key'] = !empty($value) ? Crypt::encryptString($value) : null;
    }

    public function getSecretKeyAttribute($value)
    {
        if (empty($value)) return null;
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return $value;
        }
    }

    public function setWebhookSecretAttribute($value)
    {
        $this->attributes['webhook_secret'] = !empty($value) ? Crypt::encryptString($value) : null;
    }

    public function getWebhookSecretAttribute($value)
    {
        if (empty($value)) return null;
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return $value;
        }
    }

    public function getHasSecretAttribute(): bool
    {
        return !empty($this->attributes['secret_key']);
    }

    public function getMaskedAppIdAttribute(): ?string
    {
        if (empty($this->app_id)) return null;
        if (strlen($this->app_id) <= 8) return $this->app_id;
        return substr($this->app_id, 0, 4) . '••••' . substr($this->app_id, -4);
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}
