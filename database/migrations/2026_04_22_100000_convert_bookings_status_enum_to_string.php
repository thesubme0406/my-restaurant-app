<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bookings') || ! Schema::hasColumn('bookings', 'status')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table): void {
            $table->string('status_new', 32)->nullable();
        });

        DB::table('bookings')->select(['id', 'status'])->orderBy('id')->chunkById(200, function ($rows): void {
            foreach ($rows as $row) {
                $new = $row->status === 'pending' ? 'waiting' : $row->status;
                DB::table('bookings')->where('id', $row->id)->update(['status_new' => $new]);
            }
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropColumn('status');
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->renameColumn('status_new', 'status');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('bookings') || ! Schema::hasColumn('bookings', 'status')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table): void {
            $table->string('status_new', 32)->nullable();
        });

        DB::table('bookings')->select(['id', 'status'])->orderBy('id')->chunkById(200, function ($rows): void {
            foreach ($rows as $row) {
                $new = $row->status === 'waiting' ? 'pending' : $row->status;
                DB::table('bookings')->where('id', $row->id)->update(['status_new' => $new]);
            }
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropColumn('status');
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->renameColumn('status_new', 'status');
        });
    }
};
