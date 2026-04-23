<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        if (! Schema::hasColumn('bookings', 'queued_at')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->dateTime('queued_at')->nullable()->after('expected_time');
            });
        }

        // ຄ່າເລີ່ມຕົ້ນ: ໃຊ້ expected_time ເປັນຈຸດອ້າງອີງລຽງຄິວກ່ອນມີຖັນ queued_at
        DB::table('bookings')->whereNull('queued_at')->update(['queued_at' => DB::raw('expected_time')]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('bookings') || ! Schema::hasColumn('bookings', 'queued_at')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropColumn('queued_at');
        });
    }
};
