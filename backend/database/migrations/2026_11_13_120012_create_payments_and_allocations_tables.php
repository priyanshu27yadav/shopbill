<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->onDelete('cascade');
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('payment_number');
            $table->dateTime('payment_date');
            $table->decimal('amount', 12, 2);
            $table->string('payment_method'); // cash, upi, card, bank_transfer, credit, mixed
            $table->string('reference_number')->nullable();
            $table->string('payment_type')->default('invoice_payment'); // invoice_payment, credit_settlement, partial
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['shop_id', 'payment_date']);
            $table->index(['shop_id', 'customer_id']);
        });

        Schema::create('payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments')->onDelete('cascade');
            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->decimal('amount', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_allocations');
        Schema::dropIfExists('payments');
    }
};
