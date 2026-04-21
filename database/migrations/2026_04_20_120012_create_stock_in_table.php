<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_in', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('po_id')->constrained('purchase_orders')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('staff_id')->constrained('staffs')->cascadeOnUpdate()->restrictOnDelete();
            $table->decimal('total_price', 10, 0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_in');
    }
};
