<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        if (! Schema::hasColumn('bookings', 'queue_day')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->date('queue_day')->nullable()->after('expected_time');
            });
        }

        DB::table('bookings')->orderBy('id')->chunkById(200, function ($rows): void {
            foreach ($rows as $row) {
                if ($row->expected_time === null) {
                    continue;
                }
                $day = Carbon::parse($row->expected_time)->toDateString();
                DB::table('bookings')->where('id', $row->id)->update(['queue_day' => $day]);
            }
        });

        $this->resolveDuplicateQueueNumbers();

        Schema::table('bookings', function (Blueprint $table): void {
            if ($this->indexExists('bookings', 'bookings_queue_day_queue_no_unique')) {
                return;
            }
            $table->unique(['queue_day', 'queue_no'], 'bookings_queue_day_queue_no_unique');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table): void {
            if ($this->indexExists('bookings', 'bookings_queue_day_queue_no_unique')) {
                $table->dropUnique('bookings_queue_day_queue_no_unique');
            }
        });

        if (Schema::hasColumn('bookings', 'queue_day')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->dropColumn('queue_day');
            });
        }
    }

    private function resolveDuplicateQueueNumbers(): void
    {
        $dupes = DB::select('
            SELECT queue_day, queue_no, COUNT(*) AS c
            FROM bookings
            WHERE queue_day IS NOT NULL AND queue_no IS NOT NULL AND queue_no <> ?
            GROUP BY queue_day, queue_no
            HAVING c > 1
        ', ['']);

        foreach ($dupes as $dupe) {
            $ids = DB::table('bookings')
                ->where('queue_day', $dupe->queue_day)
                ->where('queue_no', $dupe->queue_no)
                ->orderBy('id')
                ->pluck('id')
                ->all();

            array_shift($ids);
            foreach ($ids as $id) {
                DB::table('bookings')->where('id', $id)->update([
                    'queue_no' => $dupe->queue_no.'-'.$id,
                ]);
            }
        }
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            $rows = DB::select("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND name = ?", [$table, $indexName]);

            return count($rows) > 0;
        }

        $database = DB::getDatabaseName();
        $rows = DB::select(
            'SELECT COUNT(*) AS c FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ?',
            [$database, $table, $indexName]
        );

        return isset($rows[0]) && (int) $rows[0]->c > 0;
    }
};
