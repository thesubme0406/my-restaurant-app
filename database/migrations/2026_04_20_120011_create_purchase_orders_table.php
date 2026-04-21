<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('staff_id')->constrained('staffs')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('sup_id')->constrained('suppliers')->cascadeOnUpdate()->restrictOnDelete();
            $table->dateTime('po_date');
            $table->string('po_status', 10);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
