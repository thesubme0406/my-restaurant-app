<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_usage', function (Blueprint $table): void {
            if (! Schema::hasColumn('stock_usage', 'usage_detail')) {
                $table->text('usage_detail')->nullable()->after('usage_date');
            }
        });

        Schema::table('usage_detail', function (Blueprint $table): void {
            $table->decimal('usage_qty', 10, 2)->change();
        });
    }

    public function down(): void
    {
        Schema::table('usage_detail', function (Blueprint $table): void {
            $table->unsignedInteger('usage_qty')->change();
        });

        Schema::table('stock_usage', function (Blueprint $table): void {
            if (Schema::hasColumn('stock_usage', 'usage_detail')) {
                $table->dropColumn('usage_detail');
            }
        });
    }
};

