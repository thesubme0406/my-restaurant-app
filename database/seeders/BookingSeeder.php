<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BookingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('payments')->delete();
        DB::table('service_detail')->delete();
        DB::table('services')->delete();
        DB::table('bookings')->delete();

        if (DB::table('buffet_tiers')->count() === 0) {
            DB::table('buffet_tiers')->insert([
                [
                    'tier_name' => 'ຊຸດ A',
                    'price' => 129000,
                    'description' => 'ບຸບເຟ່ພື້ນຖານ',
                    'image' => null,
                ],
                [
                    'tier_name' => 'Set B',
                    'price' => 179000,
                    'description' => 'Standard buffet package',
                    'image' => null,
                ],
            ]);
        }

        $customerIds = DB::table('customers')->orderBy('id')->limit(5)->pluck('id')->values();
        if ($customerIds->isEmpty()) {
            return;
        }
        $tierIds = DB::table('buffet_tiers')->limit(2)->pluck('id')->values();
        if ($tierIds->isEmpty()) {
            return;
        }

        $rows = [];

        for ($i = 0; $i < 5; $i++) {
            $customerId = (int) $customerIds[$i % $customerIds->count()];
            $customer = DB::table('customers')->where('id', $customerId)->first();

            $rows[] = [
                'customer_id' => $customerId,
                'customer_name' => $customer?->name,
                'phone' => $customer?->phone,
                'tier_id' => $tierIds[$i % $tierIds->count()],
                'table_id' => null,
                'queue_no' => 'Q'.str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT),
                'guest_count' => random_int(2, 8),
                'expected_time' => Carbon::now()->addHours($i + 1),
                'status' => 'waiting',
                'skip_count' => 0,
            ];
        }

        DB::table('bookings')->insert($rows);
    }
}
