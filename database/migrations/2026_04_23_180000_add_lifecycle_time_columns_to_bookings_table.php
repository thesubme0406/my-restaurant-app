<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            if (! Schema::hasColumn('bookings', 'called_at')) {
                $table->dateTime('called_at')->nullable()->after('queued_at');
            }
            if (! Schema::hasColumn('bookings', 'dining_finished_at')) {
                $table->dateTime('dining_finished_at')->nullable()->after('called_at');
            }
            if (! Schema::hasColumn('bookings', 'paid_at')) {
                $table->dateTime('paid_at')->nullable()->after('dining_finished_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $drop = [];
            if (Schema::hasColumn('bookings', 'paid_at')) {
                $drop[] = 'paid_at';
            }
            if (Schema::hasColumn('bookings', 'dining_finished_at')) {
                $drop[] = 'dining_finished_at';
            }
            if (Schema::hasColumn('bookings', 'called_at')) {
                $drop[] = 'called_at';
            }
            if ($drop !== []) {
                $table->dropColumn($drop);
            }
        });
    }
};
