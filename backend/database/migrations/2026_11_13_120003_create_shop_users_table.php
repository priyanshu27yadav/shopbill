<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('role_id')->nullable()->constrained('roles')->nullOnDelete();
            $table->string('role')->default('staff'); // owner, manager, cashier
            $table->boolean('can_give_discount')->default(true);
            $table->boolean('can_view_reports')->default(false);
            $table->boolean('can_manage_items')->default(false);
            $table->boolean('can_cancel_bills')->default(false);
            $table->string('status')->default('active'); // active, inactive
            $table->timestamps();

            $table->unique(['shop_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_users');
    }
};
