<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_in_detail', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('imp_id')->constrained('stock_in')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('ing_id')->constrained('ingredients')->cascadeOnUpdate()->restrictOnDelete();
            $table->unsignedInteger('quantity');
            $table->decimal('cost_price', 10, 0);
            $table->unique(['imp_id', 'ing_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_in_detail');
    }
};
