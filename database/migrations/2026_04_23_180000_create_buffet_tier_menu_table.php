<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('buffet_tier_menu', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('buffet_tier_id')->constrained('buffet_tiers')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('menu_id')->constrained('menus')->cascadeOnUpdate()->cascadeOnDelete();
            $table->unique(['buffet_tier_id', 'menu_id'], 'buffet_tier_menu_unique_pair');
        });

        // Backfill from legacy pivot if it exists.
        if (Schema::hasTable('menu_detail')) {
            DB::statement('
                INSERT INTO buffet_tier_menu (buffet_tier_id, menu_id)
                SELECT DISTINCT buffet_tier_id, menu_id
                FROM menu_detail
            ');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('buffet_tier_menu');
    }
};

