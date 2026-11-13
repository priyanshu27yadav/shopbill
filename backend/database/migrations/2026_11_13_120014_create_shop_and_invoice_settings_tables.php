<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->onDelete('cascade');
            $table->string('key');
            $table->longText('value')->nullable();
            $table->timestamps();

            $table->unique(['shop_id', 'key']);
        });

        Schema::create('invoice_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->onDelete('cascade');
            $table->string('invoice_prefix')->default('INV-');
            $table->unsignedInteger('next_invoice_number')->default(1);
            $table->string('template')->default('standard'); // standard, thermal_58mm, thermal_80mm, modern_a4
            $table->boolean('show_gst')->default(false);
            $table->boolean('show_hsn')->default(false);
            $table->boolean('show_shop_logo')->default(true);
            $table->text('terms_and_conditions')->nullable();
            $table->text('footer_message')->nullable();
            $table->boolean('show_upi_qr')->default(true);
            $table->string('upi_id')->nullable();
            $table->timestamps();

            $table->unique('shop_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_settings');
        Schema::dropIfExists('shop_settings');
    }
};
