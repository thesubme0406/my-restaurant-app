<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ingredients', function (Blueprint $table): void {
            if (! Schema::hasColumn('ingredients', 'ing_category')) {
                $table->string('ing_category', 50)->default('Other')->after('ing_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ingredients', function (Blueprint $table): void {
            if (Schema::hasColumn('ingredients', 'ing_category')) {
                $table->dropColumn('ing_category');
            }
        });
    }
};

