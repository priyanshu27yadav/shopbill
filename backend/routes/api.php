<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\OfflineSyncController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PriceListController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SalesReturnController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\SuperAdminController;
use Illuminate\Support\Facades\Route;

// Health check
Route::get('/health', fn () => response()->json(['status' => 'ok', 'app' => 'ShopBill'], 200));

// Public authentication routes
Route::get('/business-types', [AuthController::class, 'businessTypes']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/switch-shop', [AuthController::class, 'switchShop']);
    Route::post('/settings/change-password', [AuthController::class, 'changePassword']);

    // Shop-isolated routes
    Route::middleware('shop')->group(function () {
        // Shop profile & staff
        Route::get('/bootstrap', [ShopController::class, 'bootstrap']);
        Route::get('/shop', [ShopController::class, 'show']);
        Route::put('/shop', [ShopController::class, 'update']);
        Route::get('/shop/staff', [ShopController::class, 'listStaff']);
        Route::post('/shop/staff', [ShopController::class, 'addStaff']);
        Route::put('/shop/staff/{id}', [ShopController::class, 'updateStaff']);
        Route::delete('/shop/staff/{id}', [ShopController::class, 'removeStaff']);

        // Categories
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::post('/categories/apply-template', [CategoryController::class, 'applyTemplate']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
        Route::post('/categories/reorder', [CategoryController::class, 'reorder']);

        // Products & Price Lists
        Route::get('/products', [ProductController::class, 'index']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::post('/products/bulk', [ProductController::class, 'bulkStore']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);
        Route::get('/products/metadata', [ProductController::class, 'metadata']);

        // Option A: PDF Price list extraction & preview
        Route::get('/pricelists', [PriceListController::class, 'index']);
        Route::post('/pricelists/upload', [PriceListController::class, 'upload']);
        Route::get('/pricelists/{id}/preview', [PriceListController::class, 'preview']);
        Route::post('/pricelists/{id}/confirm', [PriceListController::class, 'confirm']);
        Route::delete('/pricelists/{id}', [PriceListController::class, 'destroy']);

        // Billing System (Invoices)
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::post('/invoices', [InvoiceController::class, 'store']);
        Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
        Route::post('/invoices/{id}/cancel', [InvoiceController::class, 'cancel']);

        // Sales Returns / Item Return / Credit Notes
        Route::get('/sales-returns/search-invoice', [SalesReturnController::class, 'searchInvoice']);
        Route::get('/sales-returns', [SalesReturnController::class, 'index']);
        Route::post('/sales-returns', [SalesReturnController::class, 'store']);
        Route::get('/sales-returns/{id}', [SalesReturnController::class, 'show']);

        // Customers & Udhaar Khata
        Route::get('/customers/lookup', [CustomerController::class, 'lookupByPhone']);
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::get('/customers/{id}', [CustomerController::class, 'show']);
        Route::put('/customers/{id}', [CustomerController::class, 'update']);
        Route::post('/customers/{id}/collect-payment', [CustomerController::class, 'collectPayment']);
        Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);

        // Payments
        Route::get('/payments', [PaymentController::class, 'index']);

        // Dashboard Analytics
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // Reports
        Route::get('/reports/daily-sales', [ReportController::class, 'dailySales']);
        Route::get('/reports/monthly-sales', [ReportController::class, 'monthlySales']);
        Route::get('/reports/item-wise-sales', [ReportController::class, 'itemWiseSales']);
        Route::get('/reports/category-wise-sales', [ReportController::class, 'categoryWiseSales']);
        Route::get('/reports/discounts', [ReportController::class, 'discounts']);
        Route::get('/reports/payment-methods', [ReportController::class, 'paymentMethods']);
        Route::get('/reports/customer-credit', [ReportController::class, 'customerCredit']);
        Route::get('/reports/gst-summary', [ReportController::class, 'gstSummary']);

        // Settings
        Route::get('/settings', [SettingsController::class, 'index']);
        Route::put('/settings/invoice', [SettingsController::class, 'updateInvoiceSettings']);
        Route::post('/settings/upload-qr', [SettingsController::class, 'uploadQrImage']);
        Route::put('/settings/shop', [SettingsController::class, 'updateShopSettings']);

        // Offline Desktop Sync
        Route::get('/sync/pull-catalogue', [OfflineSyncController::class, 'pullCatalogue']);
        Route::post('/sync/push-bills', [OfflineSyncController::class, 'pushBills']);
    });

    // Super Admin Routes
    Route::prefix('admin')->group(function () {
        Route::get('/dashboard', [SuperAdminController::class, 'dashboard']);
        Route::get('/shops', [SuperAdminController::class, 'listShops']);
        Route::post('/shops/{id}/toggle-status', [SuperAdminController::class, 'toggleShopStatus']);
    });
});
