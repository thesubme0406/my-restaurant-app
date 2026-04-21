<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class QueueBookingCalendarSeeder extends Seeder
{
    public function run(): void
    {
        $customerIds = DB::table('customers')->orderBy('id')->pluck('id')->all();
        $tierIds = DB::table('buffet_tiers')->orderBy('id')->pluck('id')->all();

        if (empty($customerIds) || empty($tierIds)) {
            $this->command?->warn('QueueBookingCalendarSeeder skipped: customers and buffet_tiers are required.');
            return;
        }

        $hasCreatedAt = Schema::hasColumn('bookings', 'created_at');
        $hasUpdatedAt = Schema::hasColumn('bookings', 'updated_at');

        DB::transaction(function () use ($customerIds, $tierIds, $hasCreatedAt, $hasUpdatedAt): void {
            // Cleanup old calendar-test bookings.
            DB::table('bookings')->where('queue_no', 'like', 'QCAL%')->delete();

            $cursor = 1;

            // Past dates (not today): -1, -2, -5 days
            $pastDays = [1, 2, 5];
            foreach ($pastDays as $offset) {
                for ($i = 0; $i < 3; $i++, $cursor++) {
                    $bookingAt = Carbon::today()->subDays($offset)->setTime(random_int(9, 19), random_int(0, 59));
                    $expectedAt = $bookingAt->copy()->addMinutes(random_int(30, 120));

                    $row = [
                        'customer_id' => $customerIds[array_rand($customerIds)],
                        'customer_name' => null,
                        'phone' => null,
                        'tier_id' => $tierIds[array_rand($tierIds)],
                        'table_id' => null,
                        'queue_no' => 'QCAL'.str_pad((string) $cursor, 4, '0', STR_PAD_LEFT),
                        'guest_count' => random_int(1, 8),
                        'expected_time' => $expectedAt,
                        'status' => ['completed', 'cancelled', 'skipped'][array_rand(['completed', 'cancelled', 'skipped'])],
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
            }

            // Future dates (not today): +1, +2, +7 days
            $futureDays = [1, 2, 7];
            foreach ($futureDays as $offset) {
                for ($i = 0; $i < 3; $i++, $cursor++) {
                    $bookingAt = Carbon::today()->addDays($offset)->setTime(random_int(9, 19), random_int(0, 59));
                    $expectedAt = $bookingAt->copy()->addMinutes(random_int(30, 120));

                    $row = [
                        'customer_id' => $customerIds[array_rand($customerIds)],
                        'customer_name' => null,
                        'phone' => null,
                        'tier_id' => $tierIds[array_rand($tierIds)],
                        'table_id' => null,
                        'queue_no' => 'QCAL'.str_pad((string) $cursor, 4, '0', STR_PAD_LEFT),
                        'guest_count' => random_int(1, 8),
                        'expected_time' => $expectedAt,
                        'status' => ['pending', 'confirmed', 'called'][array_rand(['pending', 'confirmed', 'called'])],
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
            }

            // Fixed future test date: 30 April (this year if upcoming, otherwise next year)
            $year = (int) Carbon::today()->year;
            $april30 = Carbon::create($year, 4, 30, 18, 30, 0);
            if ($april30->lessThanOrEqualTo(Carbon::today()->endOfDay())) {
                $april30 = $april30->addYear();
            }
            $bookingAt = $april30->copy()->subMinutes(60);

            $special = [
                'customer_id' => $customerIds[array_rand($customerIds)],
                'customer_name' => null,
                'phone' => null,
                'tier_id' => $tierIds[array_rand($tierIds)],
                'table_id' => null,
                'queue_no' => 'QCAL-APR30',
                'guest_count' => random_int(2, 6),
                'expected_time' => $april30,
                'status' => 'confirmed',
                'skip_count' => 0,
            ];
            if ($hasCreatedAt) {
                $special['created_at'] = $bookingAt;
            }
            if ($hasUpdatedAt) {
                $special['updated_at'] = $bookingAt;
            }
            DB::table('bookings')->insert($special);
        });

        $this->command?->info('QueueBookingCalendarSeeder seeded past/future bookings (excluding today).');
    }
}

