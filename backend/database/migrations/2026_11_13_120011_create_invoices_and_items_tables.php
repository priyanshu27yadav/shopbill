<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('customer_name')->nullable();
            $table->string('customer_phone')->nullable();
            $table->string('customer_gstin')->nullable();
            $table->string('customer_address')->nullable();
            $table->string('invoice_number');
            $table->dateTime('invoice_date');
            $table->string('billing_mode')->default('catalogue'); // catalogue, custom, mixed
            $table->string('invoice_type')->default('retail'); // retail (non-GST), gst
            $table->decimal('subtotal', 12, 2)->default(0.00);
            $table->decimal('item_discount_total', 12, 2)->default(0.00);
            $table->string('overall_discount_type')->default('fixed'); // fixed, percentage
            $table->decimal('overall_discount_value', 12, 2)->default(0.00);
            $table->decimal('overall_discount_amount', 12, 2)->default(0.00);
            $table->decimal('total_discount', 12, 2)->default(0.00);
            $table->decimal('taxable_amount', 12, 2)->default(0.00);
            $table->decimal('cgst_amount', 12, 2)->default(0.00);
            $table->decimal('sgst_amount', 12, 2)->default(0.00);
            $table->decimal('igst_amount', 12, 2)->default(0.00);
            $table->decimal('total_tax', 12, 2)->default(0.00);
            $table->decimal('round_off', 8, 2)->default(0.00);
            $table->decimal('final_amount', 12, 2)->default(0.00);
            $table->decimal('amount_paid', 12, 2)->default(0.00);
            $table->decimal('balance_due', 12, 2)->default(0.00);
            $table->string('payment_status')->default('paid'); // paid, partial, unpaid, credit
            $table->string('payment_method')->default('cash'); // cash, upi, card, bank_transfer, credit, mixed
            $table->text('notes')->nullable();
            $table->string('status')->default('completed'); // completed, cancelled
            $table->text('cancellation_reason')->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->string('sync_id')->nullable(); // UUID for offline sync de-duplication
            $table->timestamps();

            $table->unique(['shop_id', 'invoice_number']);
            $table->index(['shop_id', 'invoice_date']);
            $table->index(['shop_id', 'status']);
            $table->index(['shop_id', 'sync_id']);
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('item_name');
            $table->string('category_name')->nullable();
            $table->boolean('is_custom_item')->default(false);
            $table->string('hsn_code')->nullable();
            $table->string('unit')->default('pcs');
            $table->decimal('quantity', 10, 3);
            $table->decimal('unit_price', 12, 2);
            $table->string('discount_type')->default('fixed'); // fixed, percentage
            $table->decimal('discount_value', 12, 2)->default(0.00);
            $table->decimal('discount_amount', 12, 2)->default(0.00);
            $table->decimal('subtotal', 12, 2);
            $table->decimal('gst_rate', 5, 2)->default(0.00);
            $table->decimal('cgst_amount', 12, 2)->default(0.00);
            $table->decimal('sgst_amount', 12, 2)->default(0.00);
            $table->decimal('igst_amount', 12, 2)->default(0.00);
            $table->decimal('tax_amount', 12, 2)->default(0.00);
            $table->decimal('total_amount', 12, 2);
            $table->timestamps();

            $table->index(['invoice_id']);
            $table->index(['product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
    }
};
