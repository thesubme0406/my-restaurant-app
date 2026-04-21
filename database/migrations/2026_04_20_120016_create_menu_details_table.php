<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_detail', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('buffet_tier_id')->constrained('buffet_tiers')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('menu_id')->constrained('menus')->cascadeOnUpdate()->restrictOnDelete();
            $table->unique(['buffet_tier_id', 'menu_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_detail');
    }
};
