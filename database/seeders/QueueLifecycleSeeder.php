<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Service;
use App\Models\Table;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class QueueLifecycleSeeder extends Seeder
{
    public function run(): void
    {
        $customers = Customer::query()->orderBy('id')->limit(12)->get();
        $tiers = DB::table('buffet_tiers')->orderBy('id')->limit(3)->get();
        $tables = Table::query()->where('readiness', 'ready')->orderBy('id')->limit(4)->get();
        $cashierId = (int) (DB::table('staffs')->where('role', 'manager')->orderBy('id')->value('id') ?? 0);

        if ($customers->count() < 3 || $tiers->count() < 3 || $tables->count() < 4 || $cashierId <= 0) {
            $this->command?->warn('QueueLifecycleSeeder skipped: need customers, buffet tiers, ready tables, and manager staff.');

            return;
        }

        DB::transaction(function () use ($customers, $tiers, $tables, $cashierId): void {
            // ລ້າງຂໍ້ມູນຄິວ/ບໍລິການເກົ່າທັງໝົດ ເພື່ອທົດສອບ logic ໃໝ່ໄດ້ຊັດເຈນ.
            DB::table('payments')->delete();
            DB::table('service_detail')->delete();
            DB::table('services')->delete();
            DB::table('bookings')->delete();
            Table::query()->update(['usage_status' => 'available']);

            $now = Carbon::now();
            $today = $now->copy()->startOfDay();
            $yesterday = $today->copy()->subDay();
            $tomorrow = $today->copy()->addDay();
            $twoWeeksAgo = $today->copy()->subWeeks(2);
            $sixWeeksAgo = $today->copy()->subWeeks(6);
            $nextWeek = $today->copy()->addWeek();

            $queueRows = [
                // Deeper past: finished services for reports / history
                ['queue_no' => 'Q701', 'queue_day' => $sixWeeksAgo, 'status' => 'finished', 'customer' => 0, 'tier' => 0, 'guests' => 3, 'table' => 0, 'queued' => $sixWeeksAgo->copy()->addHours(11), 'called' => $sixWeeksAgo->copy()->addHours(11)->addMinutes(18), 'dining_finished' => $sixWeeksAgo->copy()->addHours(12)->addMinutes(40), 'paid' => $sixWeeksAgo->copy()->addHours(12)->addMinutes(48)],
                ['queue_no' => 'Q801', 'queue_day' => $twoWeeksAgo, 'status' => 'finished', 'customer' => 1, 'tier' => 2, 'guests' => 5, 'table' => 1, 'queued' => $twoWeeksAgo->copy()->addHours(12), 'called' => $twoWeeksAgo->copy()->addHours(12)->addMinutes(10), 'dining_finished' => $twoWeeksAgo->copy()->addHours(13)->addMinutes(30), 'paid' => $twoWeeksAgo->copy()->addHours(13)->addMinutes(40)],

                // Yesterday: finished flow with full timestamps
                ['queue_no' => 'Q901', 'queue_day' => $yesterday, 'status' => 'finished', 'customer' => 0, 'tier' => 0, 'guests' => 2, 'table' => 0, 'queued' => $yesterday->copy()->addHours(11), 'called' => $yesterday->copy()->addHours(11)->addMinutes(12), 'dining_finished' => $yesterday->copy()->addHours(12)->addMinutes(25), 'paid' => $yesterday->copy()->addHours(12)->addMinutes(35)],
                ['queue_no' => 'Q902', 'queue_day' => $yesterday, 'status' => 'finished', 'customer' => 1, 'tier' => 1, 'guests' => 4, 'table' => 1, 'queued' => $yesterday->copy()->addHours(11)->addMinutes(20), 'called' => $yesterday->copy()->addHours(11)->addMinutes(40), 'dining_finished' => $yesterday->copy()->addHours(13), 'paid' => $yesterday->copy()->addHours(13)->addMinutes(8)],

                // Today: waiting list + skipped/cancelled + in-service
                ['queue_no' => 'Q001', 'queue_day' => $today, 'status' => 'waiting', 'customer' => 2, 'tier' => 0, 'guests' => 3, 'table' => null, 'queued' => $today->copy()->addHours(10), 'called' => null, 'dining_finished' => null, 'paid' => null],
                ['queue_no' => 'Q002', 'queue_day' => $today, 'status' => 'pending', 'customer' => 3, 'tier' => 1, 'guests' => 2, 'table' => null, 'queued' => $today->copy()->addHours(10)->addMinutes(10), 'called' => null, 'dining_finished' => null, 'paid' => null],
                ['queue_no' => 'Q003', 'queue_day' => $today, 'status' => 'confirmed', 'customer' => 4, 'tier' => 2, 'guests' => 5, 'table' => null, 'queued' => $today->copy()->addHours(10)->addMinutes(24), 'called' => null, 'dining_finished' => null, 'paid' => null],
                ['queue_no' => 'Q004', 'queue_day' => $today, 'status' => 'skipped', 'customer' => 5, 'tier' => 0, 'guests' => 2, 'table' => null, 'queued' => $today->copy()->addHours(10)->addMinutes(38), 'called' => null, 'dining_finished' => null, 'paid' => null],
                ['queue_no' => 'Q005', 'queue_day' => $today, 'status' => 'cancelled', 'customer' => 6, 'tier' => 1, 'guests' => 2, 'table' => null, 'queued' => $today->copy()->addHours(10)->addMinutes(55), 'called' => null, 'dining_finished' => null, 'paid' => null],
                ['queue_no' => 'Q006', 'queue_day' => $today, 'status' => 'called', 'customer' => 7, 'tier' => 2, 'guests' => 4, 'table' => 2, 'queued' => $today->copy()->addHours(11)->addMinutes(2), 'called' => $today->copy()->addHours(11)->addMinutes(22), 'dining_finished' => null, 'paid' => null],
                ['queue_no' => 'Q007', 'queue_day' => $today, 'status' => 'finished', 'customer' => 0, 'tier' => 1, 'guests' => 3, 'table' => 3, 'queued' => $today->copy()->addHours(11)->addMinutes(15), 'called' => $today->copy()->addHours(11)->addMinutes(33), 'dining_finished' => $today->copy()->addHours(12)->addMinutes(45), 'paid' => $today->copy()->addHours(12)->addMinutes(52)],
                ['queue_no' => 'Q008', 'queue_day' => $today, 'status' => 'waiting', 'walk_in' => true, 'customer_name' => 'Walk-in Guest', 'phone' => '02099990001', 'tier' => 0, 'guests' => 2, 'table' => null, 'queued' => $today->copy()->addHours(9)->addMinutes(30), 'called' => null, 'dining_finished' => null, 'paid' => null],
                ['queue_no' => 'V0001', 'queue_day' => $today, 'status' => 'called', 'is_vip' => true, 'customer' => 8, 'tier' => 1, 'guests' => 4, 'table' => 2, 'queued' => $today->copy()->addHours(9)->addMinutes(45), 'called' => $today->copy()->addHours(10)->addMinutes(5), 'dining_finished' => null, 'paid' => null],
                ['queue_no' => 'V0002', 'queue_day' => $today, 'status' => 'cancelled', 'is_vip' => true, 'customer' => 9, 'tier' => 2, 'guests' => 3, 'table' => null, 'queued' => $today->copy()->addHours(10)->addMinutes(20), 'called' => null, 'dining_finished' => null, 'paid' => null],
                ['queue_no' => 'V0003', 'queue_day' => $today, 'status' => 'waiting', 'is_vip' => true, 'customer' => 10, 'tier' => 0, 'guests' => 2, 'table' => null, 'queued' => $today->copy()->addHours(10)->addMinutes(40), 'called' => null, 'dining_finished' => null, 'paid' => null],
                ['queue_no' => 'V0101', 'queue_day' => $yesterday, 'status' => 'finished', 'is_vip' => true, 'customer' => 8, 'tier' => 2, 'guests' => 4, 'table' => 1, 'queued' => $yesterday->copy()->addHours(12), 'called' => $yesterday->copy()->addHours(12)->addMinutes(15), 'dining_finished' => $yesterday->copy()->addHours(13)->addMinutes(30), 'paid' => $yesterday->copy()->addHours(13)->addMinutes(38)],

                // Tomorrow: pre-booked future queues
                ['queue_no' => 'Q101', 'queue_day' => $tomorrow, 'status' => 'pending', 'customer' => 1, 'tier' => 0, 'guests' => 2, 'table' => null, 'queued' => $now->copy()->subHours(2), 'called' => null, 'dining_finished' => null, 'paid' => null],
                ['queue_no' => 'Q102', 'queue_day' => $tomorrow, 'status' => 'confirmed', 'customer' => 2, 'tier' => 2, 'guests' => 6, 'table' => null, 'queued' => $now->copy()->subHour(), 'called' => null, 'dining_finished' => null, 'paid' => null],
                ['queue_no' => 'Q201', 'queue_day' => $nextWeek, 'status' => 'confirmed', 'customer' => 3, 'tier' => 1, 'guests' => 4, 'table' => null, 'queued' => $now->copy()->subHours(4), 'called' => null, 'dining_finished' => null, 'paid' => null],
            ];

            $tableIds = $tables->pluck('id')->values();
            $tierIds = $tiers->pluck('id')->values();

            foreach ($queueRows as $row) {
                $walkIn = ! empty($row['walk_in']);
                if ($walkIn) {
                    $customerId = null;
                    $customerName = (string) $row['customer_name'];
                    $phone = (string) $row['phone'];
                } else {
                    $customer = $customers[$row['customer'] % $customers->count()];
                    $customerId = $customer->id;
                    $customerName = $customer->name;
                    $phone = $customer->phone;
                }
                $tierId = (int) $tierIds[$row['tier']];
                $tableId = $row['table'] === null ? null : (int) $tableIds[$row['table']];

                $booking = Booking::query()->create([
                    'customer_id' => $customerId,
                    'customer_name' => $customerName,
                    'phone' => $phone,
                    'tier_id' => $tierId,
                    'table_id' => $tableId,
                    'queue_no' => $row['queue_no'],
                    'is_vip' => (bool) ($row['is_vip'] ?? str_starts_with(strtoupper((string) $row['queue_no']), 'V')),
                    'queue_day' => $row['queue_day']->toDateString(),
                    'guest_count' => $row['guests'],
                    'expected_time' => $row['queue_day']->copy()->addHours(12),
                    'queued_at' => $row['queued'],
                    'called_at' => $row['called'],
                    'dining_finished_at' => $row['dining_finished'],
                    'paid_at' => $row['paid'],
                    'status' => $row['status'],
                    'skip_count' => $row['status'] === 'skipped' ? 1 : 0,
                ]);

                // ສ້າງ service/payment ໃຫ້ສອດຄ່ອງກັບສະຖານະແຕ່ລະຄິວ.
                if ($tableId !== null && in_array($row['status'], ['called', 'finished'], true)) {
                    $serviceStatus = $row['status'] === 'finished' ? 'completed' : 'in_service';
                    $startTime = $row['called'] ?? $row['queued']->copy()->addMinutes(15);
                    $endTime = $serviceStatus === 'completed' ? ($row['dining_finished'] ?? $startTime->copy()->addMinutes(80)) : null;

                    $service = Service::query()->create([
                        'booking_id' => $booking->id,
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                        'status' => $serviceStatus,
                        'service_code' => 'S'.str_pad((string) $booking->id, 9, '0', STR_PAD_LEFT),
                    ]);

                    DB::table('service_detail')->insert([
                        'service_id' => $service->id,
                        'table_id' => $tableId,
                    ]);

                    if ($serviceStatus === 'completed') {
                        $tierPrice = (float) ($tiers->firstWhere('id', $tierId)->price ?? 0);
                        Payment::query()->create([
                            'service_id' => $service->id,
                            'staff_id' => $cashierId,
                            'total_amount' => $tierPrice * (int) $row['guests'],
                            'method' => ((int) $booking->id % 2 === 0) ? 'transfer' : 'cash',
                            'note' => 'seed lifecycle payment',
                            'payment_time' => $row['paid'] ?? $endTime ?? $now,
                        ]);
                    }
                }
            }

            $occupiedTableIds = Service::query()
                ->where('status', 'in_service')
                ->pluck('id')
                ->all();

            if ($occupiedTableIds !== []) {
                $tableIdsInUse = DB::table('service_detail')
                    ->whereIn('service_id', $occupiedTableIds)
                    ->pluck('table_id')
                    ->all();
                if ($tableIdsInUse !== []) {
                    Table::query()->whereIn('id', $tableIdsInUse)->update(['usage_status' => 'occupied']);
                }
            }
        });

        $this->command?->info('QueueLifecycleSeeder: queue lifecycle dataset recreated successfully.');
    }
}
