<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\BuffetTier;
use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class BookingSeeder extends Seeder
{
    public function run(): void
    {
        $customers = Customer::query()->orderBy('id')->limit(5)->get();
        $tiers = BuffetTier::query()->orderBy('id')->limit(3)->get();

        if ($customers->count() < 5 || $tiers->isEmpty()) {
            return;
        }

        $rows = [
            ['queue_no' => 'Q001', 'status' => 'pending', 'guest_count' => 2],
            ['queue_no' => 'Q002', 'status' => 'confirmed', 'guest_count' => 4],
            ['queue_no' => 'Q003', 'status' => 'pending', 'guest_count' => 3],
            ['queue_no' => 'Q004', 'status' => 'confirmed', 'guest_count' => 5],
            ['queue_no' => 'Q005', 'status' => 'confirmed', 'guest_count' => 6],
        ];

        $queueDay = Carbon::now()->toDateString();

        foreach ($rows as $i => $row) {
            $customer = $customers[$i];
            $tier = $tiers[$i % $tiers->count()];

            Booking::query()->updateOrCreate(
                [
                    'queue_day' => $queueDay,
                    'queue_no' => $row['queue_no'],
                ],
                [
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->name,
                    'phone' => $customer->phone,
                    'tier_id' => $tier->id,
                    'table_id' => null,
                    'guest_count' => $row['guest_count'],
                    'expected_time' => Carbon::now()->addMinutes(($i + 1) * 20),
                    'queued_at' => Carbon::now()->addMinutes(($i + 1) * 20),
                    'queue_day' => $queueDay,
                    'status' => $row['status'],
                    'skip_count' => 0,
                ]
            );
        }
    }
}
