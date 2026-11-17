<?php

namespace App\Models;

use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    /**
     * Find the token instance for the given token with high-speed local caching.
     */
    public static function findToken($token)
    {
        if (empty($token)) {
            return null;
        }

        $cacheKey = 'sanctum_token_' . hash('sha256', $token);

        return Cache::remember($cacheKey, 300, function () use ($token) {
            $instance = parent::findToken($token);
            if ($instance) {
                // Pre-load the user relation so no extra DB query is needed
                $instance->load('tokenable');
            }
            return $instance;
        });
    }

    /**
     * Skip remote network DB write if only last_used_at changed within the last hour.
     */
    public function save(array $options = [])
    {
        $dirty = $this->getDirty();
        if (count($dirty) === 1 && isset($dirty['last_used_at'])) {
            $original = $this->getOriginal('last_used_at');
            if ($original && now()->diffInMinutes($original) < 60) {
                return true;
            }
        }

        return parent::save($options);
    }
}
