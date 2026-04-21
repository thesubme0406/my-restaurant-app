<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('stock_in') && ! Schema::hasTable('stock_ins')) {
            Schema::rename('stock_in', 'stock_ins');
        }

        if (Schema::hasTable('stock_in_detail') && ! Schema::hasTable('stock_in_details')) {
            Schema::rename('stock_in_detail', 'stock_in_details');
        }

        Schema::table('stock_ins', function (Blueprint $table): void {
            if (! Schema::hasColumn('stock_ins', 'import_date')) {
                $table->dateTime('import_date')->nullable()->after('total_price');
            }
            $table->decimal('total_price', 10, 2)->change();
        });

        Schema::table('stock_in_details', function (Blueprint $table): void {
            $table->decimal('quantity', 10, 2)->change();
            $table->decimal('cost_price', 10, 2)->change();
        });
    }

    public function down(): void
    {
        Schema::table('stock_in_details', function (Blueprint $table): void {
            $table->unsignedInteger('quantity')->change();
            $table->decimal('cost_price', 10, 0)->change();
        });

        Schema::table('stock_ins', function (Blueprint $table): void {
            if (Schema::hasColumn('stock_ins', 'import_date')) {
                $table->dropColumn('import_date');
            }
            $table->decimal('total_price', 10, 0)->change();
        });

        if (Schema::hasTable('stock_in_details') && ! Schema::hasTable('stock_in_detail')) {
            Schema::rename('stock_in_details', 'stock_in_detail');
        }

        if (Schema::hasTable('stock_ins') && ! Schema::hasTable('stock_in')) {
            Schema::rename('stock_ins', 'stock_in');
        }
    }
};

