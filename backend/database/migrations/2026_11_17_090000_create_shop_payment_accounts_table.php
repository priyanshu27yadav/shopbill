<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_payment_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->onDelete('cascade');
            $table->string('provider'); // 'cashfree' | 'razorpay'
            $table->string('connection_type')->default('existing'); // 'existing' | 'new_onboarding'
            $table->string('environment')->default('sandbox'); // 'sandbox' | 'production'
            $table->string('status')->default('pending_verification'); // 'active', 'pending_verification', 'under_review', 'action_required', 'disconnected'
            $table->boolean('is_primary')->default(true);

            // Merchant Identifiers
            $table->string('merchant_id')->nullable();
            $table->string('account_id')->nullable();
            $table->string('app_id')->nullable(); // Cashfree App ID or Razorpay Key ID
            $table->text('secret_key')->nullable(); // Encrypted via Crypt
            $table->text('webhook_secret')->nullable(); // Encrypted via Crypt

            // Business Profile for Onboarding
            $table->string('business_name')->nullable();
            $table->string('business_type')->nullable(); // proprietorship, partnership, pvt_ltd, individual
            $table->string('business_category')->nullable(); // retail, grocery, restaurant, apparel, etc.
            $table->text('shop_address')->nullable();
            $table->string('state')->nullable();
            $table->string('district')->nullable();
            $table->string('city')->nullable();
            $table->string('pincode', 10)->nullable();

            // Owner Details
            $table->string('owner_name')->nullable();
            $table->string('owner_mobile')->nullable();
            $table->string('owner_email')->nullable();
            $table->string('owner_pan_masked')->nullable();

            // Bank Details (Masked for safety - raw passwords/PINs strictly forbidden)
            $table->string('bank_account_holder')->nullable();
            $table->string('bank_account_number_masked')->nullable();
            $table->string('bank_ifsc', 20)->nullable();
            $table->string('bank_name')->nullable();

            // KYC & Application Progress
            $table->string('application_reference')->nullable();
            $table->string('kyc_status')->default('not_started'); // not_started, in_progress, verified, needs_clarification
            $table->text('onboarding_url')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->json('meta')->nullable();

            $table->timestamps();

            $table->unique(['shop_id', 'provider']);
            $table->index(['shop_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_payment_accounts');
    }
};
