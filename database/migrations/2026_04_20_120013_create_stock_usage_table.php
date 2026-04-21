<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_usage', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('staff_id')->constrained('staffs')->cascadeOnUpdate()->restrictOnDelete();
            $table->dateTime('usage_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_usage');
    }
};
