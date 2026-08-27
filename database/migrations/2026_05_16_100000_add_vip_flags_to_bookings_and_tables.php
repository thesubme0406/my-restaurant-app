<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('bookings') && ! Schema::hasColumn('bookings', 'is_vip')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->boolean('is_vip')->default(false)->after('queue_no');
            });
        }

        if (Schema::hasTable('tables') && ! Schema::hasColumn('tables', 'is_vip_zone')) {
            Schema::table('tables', function (Blueprint $table): void {
                $table->boolean('is_vip_zone')->default(false)->after('zone');
            });
        }

        if (Schema::hasTable('tables') && Schema::hasColumn('tables', 'is_vip_zone')) {
            DB::table('tables')->where('zone', 'vip')->update(['is_vip_zone' => true]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('bookings') && Schema::hasColumn('bookings', 'is_vip')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->dropColumn('is_vip');
            });
        }

        if (Schema::hasTable('tables') && Schema::hasColumn('tables', 'is_vip_zone')) {
            Schema::table('tables', function (Blueprint $table): void {
                $table->dropColumn('is_vip_zone');
            });
        }
    }
};
