<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->onDelete('cascade');
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->string('gstin')->nullable();
            $table->decimal('credit_limit', 12, 2)->default(0.00);
            $table->decimal('current_balance', 12, 2)->default(0.00); // positive: owed to shop (Udhaar)
            $table->decimal('total_purchases', 12, 2)->default(0.00);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['shop_id', 'phone']);
            $table->index(['shop_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
