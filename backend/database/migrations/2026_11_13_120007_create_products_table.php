<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            $table->string('name');
            $table->string('barcode')->nullable();
            $table->string('sku')->nullable();
            $table->foreignId('unit_id')->nullable()->constrained('product_units')->nullOnDelete();
            $table->string('unit')->default('pcs');
            $table->decimal('default_price', 12, 2);
            $table->decimal('mrp', 12, 2)->nullable();
            $table->decimal('gst_rate', 5, 2)->default(0.00);
            $table->string('hsn_code')->nullable();
            $table->boolean('is_tax_inclusive')->default(true);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('source')->default('manual'); // manual, pdf_import, quick_add
            $table->timestamps();

            $table->index(['shop_id', 'name']);
            $table->index(['shop_id', 'category_id']);
            $table->index(['shop_id', 'barcode']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
