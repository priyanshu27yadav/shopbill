<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_list_uploads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('original_filename');
            $table->string('file_path');
            $table->unsignedBigInteger('file_size');
            $table->unsignedInteger('extracted_items_count')->default(0);
            $table->longText('parsed_data')->nullable(); // JSON array of staged extracted items
            $table->string('status')->default('pending'); // pending, confirmed, rejected
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_list_uploads');
    }
};
