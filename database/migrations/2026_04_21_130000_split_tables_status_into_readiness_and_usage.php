<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tables')) {
            return;
        }

        if (! Schema::hasColumn('tables', 'readiness')) {
            Schema::table('tables', function (Blueprint $table): void {
                $table->string('readiness', 20)->default('ready');
                $table->string('usage_status', 20)->default('available');
            });
        }

        if (Schema::hasColumn('tables', 'status')) {
            DB::table('tables')->orderBy('id')->chunkById(200, function ($rows): void {
                foreach ($rows as $row) {
                    $legacy = (string) ($row->status ?? 'available');
                    $readiness = $legacy === 'maintenance' ? 'not_ready' : 'ready';
                    $usage = $legacy === 'occupied' ? 'occupied' : 'available';
                    DB::table('tables')->where('id', $row->id)->update([
                        'readiness' => $readiness,
                        'usage_status' => $usage,
                    ]);
                }
            });

            Schema::table('tables', function (Blueprint $table): void {
                $table->dropColumn('status');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('tables')) {
            return;
        }

        if (Schema::hasColumn('tables', 'status')) {
            return;
        }

        Schema::table('tables', function (Blueprint $table): void {
            $table->string('status', 20)->default('available');
        });

        DB::table('tables')->orderBy('id')->chunkById(200, function ($rows): void {
            foreach ($rows as $row) {
                $readiness = (string) ($row->readiness ?? 'ready');
                $usage = (string) ($row->usage_status ?? 'available');
                $legacy = 'available';
                if ($readiness === 'not_ready') {
                    $legacy = 'maintenance';
                } elseif ($usage === 'occupied') {
                    $legacy = 'occupied';
                }
                DB::table('tables')->where('id', $row->id)->update(['status' => $legacy]);
            }
        });

        Schema::table('tables', function (Blueprint $table): void {
            $table->dropColumn(['readiness', 'usage_status']);
        });
    }
};
