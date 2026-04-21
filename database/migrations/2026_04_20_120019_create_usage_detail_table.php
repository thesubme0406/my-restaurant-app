<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usage_detail', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('usage_id')->constrained('stock_usage')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('ing_id')->constrained('ingredients')->cascadeOnUpdate()->restrictOnDelete();
            $table->unsignedInteger('usage_qty');
            $table->unique(['usage_id', 'ing_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usage_detail');
    }
};
