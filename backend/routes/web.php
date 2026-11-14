<?php

use Illuminate\Support\Facades\Route;

// Dedicated lightweight health endpoint
Route::get('/healthz', fn () => response('OK', 200)->header('Content-Type', 'text/plain'));

// Production SPA Fallback Route
Route::get('/{any?}', function () {
    $spa = public_path('index.html');
    if (file_exists($spa)) {
        return response()->file($spa);
    }
    return response()->json([
        'app' => 'SHOPBILL - Complete Retail Billing Software',
        'version' => '1.0.0',
        'status' => 'API Online',
    ]);
})->where('any', '^(?!api|healthz|up).*$');
