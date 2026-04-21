<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FutureBookingSeeder extends Seeder
{
    public function run(): void
    {
        $customerRows = DB::table('customers')->select('id', 'name', 'phone')->orderBy('id')->get();
        $tierIds = DB::table('buffet_tiers')->orderBy('id')->pluck('id')->all();

        if ($customerRows->isEmpty() || empty($tierIds)) {
            $this->command?->warn('FutureBookingSeeder skipped: customers and buffet_tiers are required.');
            return;
        }

        $hasCreatedAt = Schema::hasColumn('bookings', 'created_at');
        $hasUpdatedAt = Schema::hasColumn('bookings', 'updated_at');

        DB::transaction(function () use ($customerRows, $tierIds, $hasCreatedAt, $hasUpdatedAt): void {
            DB::table('bookings')->where('queue_no', 'like', 'FQB%')->delete();

            for ($i = 1; $i <= 20; $i++) {
                $customer = $customerRows->random();
                $dayOffset = random_int(1, 30); // tomorrow .. next 30 days
                $expectedAt = Carbon::today()->addDays($dayOffset)->setTime(random_int(10, 21), [0, 10, 20, 30, 40, 50][array_rand([0, 1, 2, 3, 4, 5])]);
                $bookingAt = $expectedAt->copy()->subDays(random_int(0, 4))->subMinutes(random_int(15, 180));

                $row = [
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->name,
                    'phone' => $customer->phone,
                    'tier_id' => $tierIds[array_rand($tierIds)],
                    'table_id' => null,
                    'queue_no' => 'FQB'.str_pad((string) $i, 4, '0', STR_PAD_LEFT),
                    'guest_count' => random_int(1, 8),
                    'expected_time' => $expectedAt,
                    'status' => random_int(0, 1) ? 'pending' : 'confirmed',
                    'skip_count' => 0,
                ];

                if ($hasCreatedAt) {
                    $row['created_at'] = $bookingAt;
                }
                if ($hasUpdatedAt) {
                    $row['updated_at'] = $bookingAt;
                }

                DB::table('bookings')->insert($row);
            }
        });

        $this->command?->info('FutureBookingSeeder seeded 20 future bookings (tomorrow to next 30 days).');
    }
}

