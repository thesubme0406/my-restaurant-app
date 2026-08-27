<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\Ingredient;
use App\Models\Payment;
use App\Models\PoDetail;
use App\Models\PurchaseOrder;
use App\Models\Service;
use App\Models\StockIn;
use App\Models\StockInDetail;
use App\Models\StockUsage;
use App\Models\Supplier;
use App\Models\Table;
use App\Models\UsageDetail;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Comprehensive test data for ALL report types.
 * Generates 30+ records spread across the past 2 months with mixed statuses.
 */
class ReportTestDataSeeder extends Seeder
{
    public function run(): void
    {
        $staffId = (int) (DB::table('staffs')->where('role', 'manager')->orderBy('id')->value('id') ?? 0);
        $customers = Customer::query()->orderBy('id')->get();
        $tiers = DB::table('buffet_tiers')->orderBy('id')->get();
        $tables = Table::query()->where('readiness', 'ready')->orderBy('id')->get();
        $ingredients = Ingredient::query()->orderBy('id')->get();
        $suppliers = Supplier::query()->orderBy('id')->get();

        if ($staffId <= 0 || $customers->count() < 3 || $tiers->count() < 3 || $tables->count() < 3) {
            $this->command?->warn('ReportTestDataSeeder skipped: need staff, customers, tiers, and tables.');

            return;
        }

        DB::transaction(function () use ($staffId, $customers, $tiers, $tables, $ingredients, $suppliers): void {
            DB::table('payments')->delete();
            DB::table('service_detail')->delete();
            DB::table('services')->delete();
            DB::table('bookings')->delete();
            DB::table('stock_in_details')->delete();
            DB::table('stock_ins')->delete();
            DB::table('po_detail')->delete();
            DB::table('purchase_orders')->delete();
            DB::table('usage_detail')->delete();
            DB::table('stock_usage')->delete();
            Table::query()->update(['usage_status' => 'available']);

            $now = Carbon::now();
            $tierIds = $tiers->pluck('id')->values();
            $tierPrices = $tiers->pluck('price', 'id');
            $tableIds = $tables->pluck('id')->values();
            $customerCount = $customers->count();

            // ==============================
            // BOOKINGS, SERVICES, PAYMENTS
            // Generate 30 queue entries spread over 2 months
            // ==============================
            $queueEntries = [
                // 6 weeks ago
                ['day' => -42, 'hour' => 11, 'status' => 'finished', 'guests' => 2, 'tier' => 0],
                ['day' => -42, 'hour' => 12, 'status' => 'finished', 'guests' => 4, 'tier' => 1],
                ['day' => -42, 'hour' => 13, 'status' => 'cancelled', 'guests' => 3, 'tier' => 2],
                // 5 weeks ago
                ['day' => -35, 'hour' => 11, 'status' => 'finished', 'guests' => 5, 'tier' => 2],
                ['day' => -35, 'hour' => 12, 'status' => 'finished', 'guests' => 3, 'tier' => 0],
                ['day' => -35, 'hour' => 13, 'status' => 'skipped', 'guests' => 2, 'tier' => 1],
                // 4 weeks ago
                ['day' => -28, 'hour' => 11, 'status' => 'finished', 'guests' => 6, 'tier' => 1],
                ['day' => -28, 'hour' => 12, 'status' => 'finished', 'guests' => 2, 'tier' => 0],
                ['day' => -28, 'hour' => 13, 'status' => 'finished', 'guests' => 4, 'tier' => 2],
                ['day' => -28, 'hour' => 14, 'status' => 'cancelled', 'guests' => 2, 'tier' => 0],
                // 3 weeks ago
                ['day' => -21, 'hour' => 11, 'status' => 'finished', 'guests' => 3, 'tier' => 2],
                ['day' => -21, 'hour' => 12, 'status' => 'finished', 'guests' => 5, 'tier' => 1],
                ['day' => -21, 'hour' => 13, 'status' => 'skipped', 'guests' => 2, 'tier' => 0],
                ['day' => -21, 'hour' => 14, 'status' => 'finished', 'guests' => 4, 'tier' => 0],
                // 2 weeks ago
                ['day' => -14, 'hour' => 11, 'status' => 'finished', 'guests' => 3, 'tier' => 1],
                ['day' => -14, 'hour' => 12, 'status' => 'finished', 'guests' => 2, 'tier' => 2],
                ['day' => -14, 'hour' => 13, 'status' => 'cancelled', 'guests' => 5, 'tier' => 0],
                ['day' => -14, 'hour' => 14, 'status' => 'finished', 'guests' => 4, 'tier' => 1],
                // 1 week ago
                ['day' => -7, 'hour' => 11, 'status' => 'finished', 'guests' => 2, 'tier' => 0],
                ['day' => -7, 'hour' => 12, 'status' => 'finished', 'guests' => 6, 'tier' => 2],
                ['day' => -7, 'hour' => 13, 'status' => 'finished', 'guests' => 3, 'tier' => 1],
                ['day' => -7, 'hour' => 14, 'status' => 'skipped', 'guests' => 2, 'tier' => 0],
                // 3 days ago
                ['day' => -3, 'hour' => 11, 'status' => 'finished', 'guests' => 4, 'tier' => 2],
                ['day' => -3, 'hour' => 12, 'status' => 'finished', 'guests' => 3, 'tier' => 0],
                ['day' => -3, 'hour' => 13, 'status' => 'cancelled', 'guests' => 2, 'tier' => 1],
                // Yesterday
                ['day' => -1, 'hour' => 11, 'status' => 'finished', 'guests' => 5, 'tier' => 1],
                ['day' => -1, 'hour' => 12, 'status' => 'finished', 'guests' => 3, 'tier' => 2],
                ['day' => -1, 'hour' => 13, 'status' => 'finished', 'guests' => 2, 'tier' => 0],
                // Today: standard + VIP (booking report / zone filter demo)
                ['day' => 0, 'hour' => 10, 'status' => 'called', 'guests' => 3, 'tier' => 0, 'queue_no' => 'Q0074'],
                ['day' => 0, 'hour' => 10, 'status' => 'cancelled', 'guests' => 5, 'tier' => 1, 'queue_no' => 'Q0075'],
                ['day' => 0, 'hour' => 11, 'status' => 'cancelled', 'guests' => 4, 'tier' => 1, 'queue_no' => 'Q0076'],
                ['day' => 0, 'hour' => 10, 'status' => 'waiting', 'guests' => 2, 'tier' => 0, 'queue_no' => 'Q0077'],
                ['day' => 0, 'hour' => 11, 'status' => 'called', 'guests' => 3, 'tier' => 0, 'queue_no' => 'V0001', 'is_vip' => true],
                ['day' => 0, 'hour' => 11, 'status' => 'cancelled', 'guests' => 4, 'tier' => 2, 'queue_no' => 'V0002', 'is_vip' => true],
                ['day' => 0, 'hour' => 12, 'status' => 'cancelled', 'guests' => 3, 'tier' => 0, 'queue_no' => 'V0003', 'is_vip' => true],
                ['day' => 0, 'hour' => 12, 'status' => 'confirmed', 'guests' => 2, 'tier' => 1, 'queue_no' => 'V0004', 'is_vip' => true],
                // VIP history
                ['day' => -7, 'hour' => 13, 'status' => 'finished', 'guests' => 4, 'tier' => 2, 'is_vip' => true],
                ['day' => -14, 'hour' => 12, 'status' => 'finished', 'guests' => 3, 'tier' => 1, 'is_vip' => true],
                // Tomorrow: pre-booked
                ['day' => 1, 'hour' => 12, 'status' => 'pending', 'guests' => 4, 'tier' => 1],
                ['day' => 1, 'hour' => 12, 'status' => 'pending', 'guests' => 6, 'tier' => 2],
            ];

            $queueNumber = 1;
            $vipNumber = 1;
            foreach ($queueEntries as $idx => $entry) {
                $queueDay = $now->copy()->startOfDay()->addDays($entry['day']);
                $queuedAt = $queueDay->copy()->addHours($entry['hour'])->addMinutes(rand(0, 15));
                $customer = $customers[$idx % $customerCount];
                $tierId = (int) $tierIds[$entry['tier']];
                $tableIdx = $idx % $tableIds->count();
                $tableId = in_array($entry['status'], ['finished', 'called']) ? (int) $tableIds[$tableIdx] : null;

                if (! empty($entry['queue_no'])) {
                    $queueNo = (string) $entry['queue_no'];
                } elseif (! empty($entry['is_vip'])) {
                    $queueNo = 'V'.str_pad((string) $vipNumber++, 4, '0', STR_PAD_LEFT);
                } else {
                    $queueNo = 'Q'.str_pad((string) $queueNumber++, 4, '0', STR_PAD_LEFT);
                }

                $isVip = (bool) ($entry['is_vip'] ?? str_starts_with(strtoupper($queueNo), 'V'));

                $calledAt = null;
                $diningFinished = null;
                $paidAt = null;

                if (in_array($entry['status'], ['called', 'finished'])) {
                    $calledAt = $queuedAt->copy()->addMinutes(rand(8, 20));
                }
                if ($entry['status'] === 'finished') {
                    $diningFinished = $calledAt->copy()->addMinutes(rand(60, 100));
                    $paidAt = $diningFinished->copy()->addMinutes(rand(3, 12));
                }

                $booking = Booking::query()->create([
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->name,
                    'phone' => $customer->phone,
                    'tier_id' => $tierId,
                    'table_id' => $tableId,
                    'queue_no' => $queueNo,
                    'is_vip' => $isVip,
                    'queue_day' => $queueDay->toDateString(),
                    'guest_count' => $entry['guests'],
                    'expected_time' => $queueDay->copy()->addHours(12),
                    'queued_at' => $queuedAt,
                    'called_at' => $calledAt,
                    'dining_finished_at' => $diningFinished,
                    'paid_at' => $paidAt,
                    'status' => $entry['status'],
                    'skip_count' => $entry['status'] === 'skipped' ? 1 : 0,
                ]);

                if ($tableId !== null && in_array($entry['status'], ['called', 'finished'])) {
                    $serviceStatus = $entry['status'] === 'finished' ? 'completed' : 'in_service';
                    $startTime = $calledAt ?? $queuedAt->copy()->addMinutes(15);
                    $endTime = $serviceStatus === 'completed' ? $diningFinished : null;

                    $service = Service::query()->create([
                        'booking_id' => $booking->id,
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                        'status' => $serviceStatus,
                        'service_code' => 'SV'.str_pad((string) $booking->id, 5, '0', STR_PAD_LEFT),
                    ]);

                    DB::table('service_detail')->insert([
                        'service_id' => $service->id,
                        'table_id' => $tableId,
                    ]);

                    if ($serviceStatus === 'completed') {
                        $tierPrice = (float) ($tierPrices[$tierId] ?? 299000);
                        Payment::query()->create([
                            'service_id' => $service->id,
                            'staff_id' => $staffId,
                            'total_amount' => $tierPrice * $entry['guests'],
                            'method' => $idx % 3 === 0 ? 'transfer' : 'cash',
                            'note' => null,
                            'payment_time' => $paidAt ?? $endTime ?? $now,
                        ]);
                    }
                }
            }

            // Mark currently in-service tables as occupied
            $activeServiceIds = Service::query()->where('status', 'in_service')->pluck('id')->all();
            if ($activeServiceIds !== []) {
                $occupiedTableIds = DB::table('service_detail')
                    ->whereIn('service_id', $activeServiceIds)
                    ->pluck('table_id')
                    ->all();
                if ($occupiedTableIds !== []) {
                    Table::query()->whereIn('id', $occupiedTableIds)->update(['usage_status' => 'occupied']);
                }
            }

            // ==============================
            // PURCHASE ORDERS & STOCK-INS
            // ==============================
            if ($ingredients->count() >= 3 && $suppliers->count() >= 2) {
                $ingIds = $ingredients->pluck('id')->values();
                $supIds = $suppliers->pluck('id')->values();

                $purchaseData = [
                    ['days_ago' => 50, 'supplier' => 0, 'status' => 'Received', 'items' => [[0, 15, 185000], [1, 50, 12000]]],
                    ['days_ago' => 40, 'supplier' => 1, 'status' => 'Received', 'items' => [[2, 30, 45000], [3, 10, 62000]]],
                    ['days_ago' => 30, 'supplier' => 0, 'status' => 'Received', 'items' => [[0, 20, 185000], [4, 15, 28000]]],
                    ['days_ago' => 20, 'supplier' => 1, 'status' => 'Received', 'items' => [[1, 40, 12000], [2, 20, 45000]]],
                    ['days_ago' => 14, 'supplier' => 0, 'status' => 'Received', 'items' => [[3, 12, 62000], [0, 10, 190000]]],
                    ['days_ago' => 7, 'supplier' => 1, 'status' => 'Received', 'items' => [[4, 25, 28000], [1, 30, 12500]]],
                    ['days_ago' => 3, 'supplier' => 0, 'status' => 'Received', 'items' => [[2, 15, 46000], [0, 8, 188000]]],
                    ['days_ago' => 1, 'supplier' => 1, 'status' => 'Ordered', 'items' => [[3, 8, 63000], [4, 20, 29000]]],
                    ['days_ago' => -3, 'supplier' => 0, 'status' => 'Pending', 'items' => [[0, 25, 185000], [1, 60, 12000]]],
                    ['days_ago' => -7, 'supplier' => 1, 'status' => 'Pending', 'items' => [[2, 35, 45000]]],
                ];

                foreach ($purchaseData as $po) {
                    $poDate = $now->copy()->subDays($po['days_ago'])->setTime(9, rand(0, 59));
                    $supId = (int) $supIds[$po['supplier'] % $supIds->count()];

                    $purchaseOrder = PurchaseOrder::query()->create([
                        'staff_id' => $staffId,
                        'sup_id' => $supId,
                        'po_date' => $poDate,
                        'po_status' => $po['status'],
                    ]);

                    $totalPrice = 0;
                    foreach ($po['items'] as [$ingIdx, $qty, $cost]) {
                        $ingId = (int) $ingIds[$ingIdx % $ingIds->count()];
                        PoDetail::query()->create([
                            'po_id' => $purchaseOrder->id,
                            'ing_id' => $ingId,
                            'quantity' => $qty,
                        ]);
                        $totalPrice += $qty * $cost;
                    }

                    if ($po['status'] === 'Received') {
                        $importDate = $poDate->copy()->addDays(rand(1, 3))->setTime(14, rand(0, 59));
                        $stockIn = StockIn::query()->create([
                            'po_id' => $purchaseOrder->id,
                            'staff_id' => $staffId,
                            'total_price' => $totalPrice,
                            'import_date' => $importDate,
                        ]);

                        foreach ($po['items'] as [$ingIdx, $qty, $cost]) {
                            $ingId = (int) $ingIds[$ingIdx % $ingIds->count()];
                            StockInDetail::query()->create([
                                'imp_id' => $stockIn->id,
                                'ing_id' => $ingId,
                                'quantity' => $qty,
                                'cost_price' => $cost,
                            ]);
                        }
                    }
                }

                // ==============================
                // STOCK USAGE (ingredient usage)
                // ==============================
                $usageData = [
                    ['days_ago' => 45, 'note' => 'ເປີດຮ້ານ - ກຽມວັດຖຸດິບ', 'lines' => [[0, 3.5], [1, 8], [2, 4]]],
                    ['days_ago' => 40, 'note' => 'ບຸບເຟ້ວັນເສົາ', 'lines' => [[0, 5], [3, 2], [4, 1.5]]],
                    ['days_ago' => 35, 'note' => 'ບຸບເຟ້ວັນອາທິດ', 'lines' => [[1, 10], [2, 6], [0, 4]]],
                    ['days_ago' => 30, 'note' => 'ກຽມອາຫານພິເສດ', 'lines' => [[0, 6], [2, 3.5], [3, 2.5]]],
                    ['days_ago' => 25, 'note' => 'ໃຊ້ປະຈຳວັນ', 'lines' => [[1, 5], [4, 2], [0, 2.5]]],
                    ['days_ago' => 21, 'note' => 'ວັນພັກ - ລູກຄ້າຫຼາຍ', 'lines' => [[0, 7], [1, 12], [2, 8], [3, 3]]],
                    ['days_ago' => 18, 'note' => 'ເປີດບຸບເຟ້ເທື່ອງ', 'lines' => [[2, 5], [4, 3], [0, 3]]],
                    ['days_ago' => 14, 'note' => 'ສັ່ງເພີ່ມຕື່ມ', 'lines' => [[1, 7], [3, 4], [0, 2]]],
                    ['days_ago' => 10, 'note' => 'ໃຊ້ສຳລັບ event ພິເສດ', 'lines' => [[0, 8], [2, 6], [1, 9]]],
                    ['days_ago' => 7, 'note' => 'ກຽມອາທິດໃໝ່', 'lines' => [[3, 3], [4, 4], [0, 3.5]]],
                    ['days_ago' => 5, 'note' => 'ໃຊ້ປະຈຳວັນ', 'lines' => [[1, 6], [2, 4], [0, 2]]],
                    ['days_ago' => 3, 'note' => 'ບຸບເຟ້ຄ່ຳ', 'lines' => [[0, 5], [1, 8], [4, 2.5]]],
                    ['days_ago' => 2, 'note' => 'ກຽມອາຫານກາງວັນ', 'lines' => [[2, 3], [3, 2], [0, 1.5]]],
                    ['days_ago' => 1, 'note' => 'ບຸບເຟ້ມື້ວານ', 'lines' => [[0, 4], [1, 7], [2, 5], [4, 3]]],
                    ['days_ago' => 0, 'note' => 'ໃຊ້ມື້ນີ້ (ເຊົ້າ)', 'lines' => [[0, 2], [1, 4], [3, 1.5]]],
                ];

                foreach ($usageData as $spec) {
                    $usageDate = $now->copy()->subDays($spec['days_ago'])->setTime(rand(6, 10), rand(0, 59));
                    $usage = StockUsage::query()->create([
                        'staff_id' => $staffId,
                        'usage_date' => $usageDate,
                        'usage_detail' => $spec['note'],
                    ]);

                    foreach ($spec['lines'] as [$ingIdx, $qty]) {
                        $ingId = (int) $ingIds[$ingIdx % $ingIds->count()];
                        UsageDetail::query()->create([
                            'usage_id' => $usage->id,
                            'ing_id' => $ingId,
                            'usage_qty' => $qty,
                        ]);
                    }
                }
            }
        });

        $this->command?->info('ReportTestDataSeeder: comprehensive test data created for all reports.');
    }
}
