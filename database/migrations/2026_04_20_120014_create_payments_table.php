<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('staff_id')->constrained('staffs')->cascadeOnUpdate()->restrictOnDelete();
            $table->decimal('total_amount', 10, 2);
            $table->enum('method', ['cash', 'transfer', 'credit_card']);
            $table->dateTime('payment_time')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
