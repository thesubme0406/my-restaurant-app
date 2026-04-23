<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('menus', 'buffet_tier_id')) {
            Schema::table('menus', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('buffet_tier_id');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('menus', 'buffet_tier_id')) {
            Schema::table('menus', function (Blueprint $table): void {
                $table->foreignId('buffet_tier_id')->nullable()->constrained('buffet_tiers')->cascadeOnUpdate()->nullOnDelete();
            });
        }
    }
};

