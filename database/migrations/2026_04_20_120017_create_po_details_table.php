<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('po_detail', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('po_id')->constrained('purchase_orders')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('ing_id')->constrained('ingredients')->cascadeOnUpdate()->restrictOnDelete();
            $table->unsignedInteger('quantity');
            $table->unique(['po_id', 'ing_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('po_detail');
    }
};
