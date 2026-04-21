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

        if (! Schema::hasColumn('bookings', 'skip_count')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->unsignedInteger('skip_count')->default(0)->after('status');
            });
        }

        if (! Schema::hasColumn('bookings', 'customer_name')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->string('customer_name', 100)->nullable()->after('customer_id');
            });
        }

        if (! Schema::hasColumn('bookings', 'phone')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->string('phone', 20)->nullable()->after('customer_name');
            });
        }

        $this->backfillWalkInFieldsFromCustomers();

        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropForeign(['customer_id']);
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->unsignedBigInteger('customer_id')->nullable()->change();
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        if (Schema::hasColumn('bookings', 'phone')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->dropColumn('phone');
            });
        }

        if (Schema::hasColumn('bookings', 'customer_name')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->dropColumn('customer_name');
            });
        }

        // Intentionally not reverting nullable customer_id or skip_count to avoid data loss.
    }

    private function backfillWalkInFieldsFromCustomers(): void
    {
        $ids = DB::table('bookings')->whereNotNull('customer_id')->pluck('id');
        foreach ($ids as $id) {
            $booking = DB::table('bookings')->where('id', $id)->first();
            if ($booking === null || $booking->customer_id === null) {
                continue;
            }
            $customer = DB::table('customers')->where('id', $booking->customer_id)->first();
            if ($customer === null) {
                continue;
            }
            DB::table('bookings')->where('id', $id)->update([
                'customer_name' => $booking->customer_name ?? $customer->name,
                'phone' => $booking->phone ?? $customer->phone,
            ]);
        }
    }
};
