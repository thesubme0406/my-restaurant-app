<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class QueueReportSeeder extends Seeder
{
    public function run(): void
    {
        $customerIds = DB::table('customers')->orderBy('id')->pluck('id')->all();
        $tierIds = DB::table('buffet_tiers')->orderBy('id')->pluck('id')->all();
        $tableIds = DB::table('tables')->orderBy('id')->pluck('id')->all();
        $staffIds = DB::table('staffs')->orderBy('id')->pluck('id')->all();

        if (empty($customerIds) || empty($tierIds) || empty($tableIds)) {
            $this->command?->warn('QueueReportSeeder skipped: customers, buffet_tiers, and tables are required.');
            return;
        }

        $hasCreatedAt = Schema::hasColumn('bookings', 'created_at');
        $hasUpdatedAt = Schema::hasColumn('bookings', 'updated_at');

        DB::transaction(function () use ($customerIds, $tierIds, $tableIds, $staffIds, $hasCreatedAt, $hasUpdatedAt): void {
            $oldBookingIds = DB::table('bookings')
                ->where('queue_no', 'like', 'QR%')
                ->pluck('id')
                ->all();

            if (! empty($oldBookingIds)) {
                $oldServiceIds = DB::table('services')
                    ->whereIn('booking_id', $oldBookingIds)
                    ->pluck('id')
                    ->all();

                if (! empty($oldServiceIds)) {
                    DB::table('payments')->whereIn('service_id', $oldServiceIds)->delete();
                    DB::table('service_detail')->whereIn('service_id', $oldServiceIds)->delete();
                    DB::table('services')->whereIn('id', $oldServiceIds)->delete();
                }

                DB::table('bookings')->whereIn('id', $oldBookingIds)->delete();
            }

            $cursor = 1;

            // Scenario A: 10 completed queues with services (15-45 min actual wait).
            for ($i = 0; $i < 10; $i++, $cursor++) {
                $bookingAt = Carbon::now()->startOfMonth()->addDays(random_int(0, max(now()->day - 1, 0)))->setTime(random_int(10, 20), random_int(0, 59));
                $waitMinutes = random_int(15, 45);
                $serviceStart = $bookingAt->copy()->addMinutes($waitMinutes);
                $serviceEnd = $serviceStart->copy()->addMinutes(random_int(60, 130));

                $bookingInsert = [
                    'customer_id' => $customerIds[array_rand($customerIds)],
                    'customer_name' => null,
                    'phone' => null,
                    'tier_id' => $tierIds[array_rand($tierIds)],
                    'table_id' => $tableIds[array_rand($tableIds)],
                    'queue_no' => 'QR'.str_pad((string) $cursor, 4, '0', STR_PAD_LEFT),
                    'guest_count' => random_int(1, 8),
                    // Keep expected_time equal to booking time so report fallback still works.
                    'expected_time' => $bookingAt,
                    'status' => 'completed',
                    'skip_count' => 0,
                ];
                if ($hasCreatedAt) {
                    $bookingInsert['created_at'] = $bookingAt;
                }
                if ($hasUpdatedAt) {
                    $bookingInsert['updated_at'] = $bookingAt;
                }

                $bookingId = DB::table('bookings')->insertGetId($bookingInsert);
                $tableId = (int) DB::table('bookings')->where('id', $bookingId)->value('table_id');

                $serviceId = DB::table('services')->insertGetId([
                    'booking_id' => $bookingId,
                    'start_time' => $serviceStart,
                    'end_time' => $serviceEnd,
                    'status' => 'completed',
                    'service_code' => 'QRS'.str_pad((string) $cursor, 4, '0', STR_PAD_LEFT),
                ]);

                DB::table('service_detail')->insert([
                    'service_id' => $serviceId,
                    'table_id' => $tableId,
                ]);

                // Optional: create payment to tie completed flow with staff when available.
                if (! empty($staffIds)) {
                    $tierPrice = (float) DB::table('buffet_tiers')->where('id', DB::table('bookings')->where('id', $bookingId)->value('tier_id'))->value('price');
                    $guestCount = (int) DB::table('bookings')->where('id', $bookingId)->value('guest_count');

                    DB::table('payments')->insert([
                        'service_id' => $serviceId,
                        'staff_id' => $staffIds[array_rand($staffIds)],
                        'total_amount' => $tierPrice * $guestCount,
                        'method' => random_int(0, 1) ? 'cash' : 'transfer',
                        'payment_time' => $serviceEnd,
                    ]);
                }
            }

            // Scenario B1: 5 cancelled queues (no service).
            for ($i = 0; $i < 5; $i++, $cursor++) {
                $bookingAt = Carbon::now()->startOfMonth()->addDays(random_int(0, max(now()->day - 1, 0)))->setTime(random_int(10, 20), random_int(0, 59));
                $row = [
                    'customer_id' => $customerIds[array_rand($customerIds)],
                    'customer_name' => null,
                    'phone' => null,
                    'tier_id' => $tierIds[array_rand($tierIds)],
                    'table_id' => null,
                    'queue_no' => 'QR'.str_pad((string) $cursor, 4, '0', STR_PAD_LEFT),
                    'guest_count' => random_int(1, 8),
                    'expected_time' => $bookingAt->copy()->addMinutes(random_int(20, 60)),
                    'status' => 'cancelled',
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

            // Scenario B2: 3 skipped queues (no service).
            for ($i = 0; $i < 3; $i++, $cursor++) {
                $bookingAt = Carbon::now()->startOfMonth()->addDays(random_int(0, max(now()->day - 1, 0)))->setTime(random_int(10, 20), random_int(0, 59));
                $row = [
                    'customer_id' => $customerIds[array_rand($customerIds)],
                    'customer_name' => null,
                    'phone' => null,
                    'tier_id' => $tierIds[array_rand($tierIds)],
                    'table_id' => null,
                    'queue_no' => 'QR'.str_pad((string) $cursor, 4, '0', STR_PAD_LEFT),
                    'guest_count' => random_int(1, 8),
                    'expected_time' => $bookingAt->copy()->addMinutes(random_int(20, 60)),
                    'status' => 'skipped',
                    'skip_count' => random_int(1, 2),
                ];
                if ($hasCreatedAt) {
                    $row['created_at'] = $bookingAt;
                }
                if ($hasUpdatedAt) {
                    $row['updated_at'] = $bookingAt;
                }
                DB::table('bookings')->insert($row);
            }

            // Scenario C: 4 active confirmed queues.
            for ($i = 0; $i < 4; $i++, $cursor++) {
                $bookingAt = Carbon::now()->subDays(random_int(0, min(now()->day - 1, 6)))->setTime(random_int(10, 20), random_int(0, 59));
                $row = [
                    'customer_id' => $customerIds[array_rand($customerIds)],
                    'customer_name' => null,
                    'phone' => null,
                    'tier_id' => $tierIds[array_rand($tierIds)],
                    'table_id' => null,
                    'queue_no' => 'QR'.str_pad((string) $cursor, 4, '0', STR_PAD_LEFT),
                    'guest_count' => random_int(1, 8),
                    'expected_time' => $bookingAt->copy()->addMinutes(random_int(15, 50)),
                    'status' => 'confirmed',
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

        $this->command?->info('QueueReportSeeder seeded: 10 completed + 5 cancelled + 3 skipped + 4 confirmed queues.');
    }
}

