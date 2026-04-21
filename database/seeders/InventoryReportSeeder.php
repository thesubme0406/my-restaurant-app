<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class InventoryReportSeeder extends Seeder
{
    public function run(): void
    {
        $staffIds = DB::table('staffs')->orderBy('id')->pluck('id')->all();
        if (empty($staffIds)) {
            $this->call([StaffSeeder::class]);
            $staffIds = DB::table('staffs')->orderBy('id')->pluck('id')->all();
        }

        $ingredients = DB::table('ingredients')->select('id')->orderBy('id')->get();
        if ($ingredients->isEmpty()) {
            $this->call([IngredientSeeder::class]);
            $ingredients = DB::table('ingredients')->select('id')->orderBy('id')->get();
        }

        $supplierIds = DB::table('suppliers')->orderBy('id')->pluck('id')->all();
        if (empty($supplierIds)) {
            DB::table('suppliers')->insert([
                [
                    'sup_name' => 'Lao Fresh Food Supply',
                    'contact_tel' => '02022334455',
                    'contact_person' => 'Mr. Kham',
                    'sup_address' => 'Vientiane Capital',
                ],
                [
                    'sup_name' => 'Mekong Ingredient Trading',
                    'contact_tel' => '02033445566',
                    'contact_person' => 'Ms. Noy',
                    'sup_address' => 'Sikhottabong, Vientiane',
                ],
                [
                    'sup_name' => 'Golden Farm Distribution',
                    'contact_tel' => '02044556677',
                    'contact_person' => 'Mr. Seng',
                    'sup_address' => 'Xaythany District',
                ],
            ]);
            $supplierIds = DB::table('suppliers')->orderBy('id')->pluck('id')->all();
        }

        if (empty($staffIds) || empty($supplierIds) || $ingredients->isEmpty()) {
            $this->command?->warn('InventoryReportSeeder skipped: staffs, suppliers, and ingredients are required.');
            return;
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('usage_detail')->truncate();
        DB::table('stock_usage')->truncate();
        DB::table('stock_in_details')->truncate();
        DB::table('stock_ins')->truncate();
        DB::table('po_detail')->truncate();
        DB::table('purchase_orders')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        DB::table('ingredients')->update(['ing_quantity' => 0]);

        $ingredientIds = $ingredients->pluck('id')->all();
        $purchasedQty = array_fill_keys($ingredientIds, 0.0);
        $usedQty = array_fill_keys($ingredientIds, 0.0);

        $today = Carbon::today();
        $monthStart = $today->copy()->startOfMonth();

        // 18 purchase orders in current month; most are received.
        for ($i = 1; $i <= 18; $i++) {
                $poDate = $monthStart->copy()->addDays(min($i, $today->day - 1))->setTime(random_int(9, 17), random_int(0, 59));
                $statusRoll = random_int(1, 100);
                $poStatus = $statusRoll <= 70 ? 'Received' : ($statusRoll <= 90 ? 'Ordered' : 'Pending');

                $poId = DB::table('purchase_orders')->insertGetId([
                    'staff_id' => $staffIds[array_rand($staffIds)],
                    'sup_id' => $supplierIds[array_rand($supplierIds)],
                    'po_date' => $poDate,
                    'po_status' => $poStatus,
                ]);

                $lineCount = random_int(2, min(4, count($ingredientIds)));
                $selectedIngredientIds = collect($ingredientIds)->shuffle()->take($lineCount)->all();
                $lineRows = [];
                $totalPrice = 0.0;

                foreach ($selectedIngredientIds as $ingId) {
                    $qty = (float) random_int(8, 30);
                    $unitCost = (float) random_int(12000, 68000);
                    $lineRows[] = [
                        'po_id' => $poId,
                        'ing_id' => $ingId,
                        'quantity' => $qty,
                    ];
                    $totalPrice += $qty * $unitCost;
                }

                DB::table('po_detail')->insert($lineRows);

                if ($poStatus === 'Received') {
                    $importDate = $poDate->copy()->addDays(random_int(0, 3))->setTime(random_int(10, 18), random_int(0, 59));
                    $stockInId = DB::table('stock_ins')->insertGetId([
                        'po_id' => $poId,
                        'staff_id' => $staffIds[array_rand($staffIds)],
                        'total_price' => round($totalPrice, 2),
                        'import_date' => $importDate,
                    ]);

                    $stockDetailRows = [];
                    foreach ($selectedIngredientIds as $ingId) {
                        $qty = (float) DB::table('po_detail')
                            ->where('po_id', $poId)
                            ->where('ing_id', $ingId)
                            ->value('quantity');
                        $unitCost = (float) random_int(12000, 68000);

                        $stockDetailRows[] = [
                            'imp_id' => $stockInId,
                            'ing_id' => $ingId,
                            'quantity' => $qty,
                            'cost_price' => $unitCost,
                        ];

                        $purchasedQty[$ingId] += $qty;
                    }

                    DB::table('stock_in_details')->insert($stockDetailRows);
                }
        }

        // 36 usage entries in current month, distributed daily.
        for ($i = 1; $i <= 36; $i++) {
                $usageDate = $monthStart->copy()->addDays(min($i - 1, max($today->day - 1, 0)))->setTime(random_int(10, 21), random_int(0, 59));
                $staffId = $staffIds[array_rand($staffIds)];
                $ingId = $ingredientIds[array_rand($ingredientIds)];

                $remainingAvailable = max($purchasedQty[$ingId] - $usedQty[$ingId], 0);
                if ($remainingAvailable <= 0) {
                    continue;
                }

                $qty = min((float) random_int(1, 6), $remainingAvailable);

                $usageId = DB::table('stock_usage')->insertGetId([
                    'staff_id' => $staffId,
                    'usage_date' => $usageDate,
                    'usage_detail' => 'INV_REPORT_USAGE_'.$i,
                ]);

                DB::table('usage_detail')->insert([
                    'usage_id' => $usageId,
                    'ing_id' => $ingId,
                    'usage_qty' => round($qty, 2),
                ]);

                $usedQty[$ingId] += $qty;
        }

        foreach ($ingredientIds as $ingId) {
            $netQty = max($purchasedQty[$ingId] - $usedQty[$ingId], 0);
            DB::table('ingredients')->where('id', $ingId)->update([
                'ing_quantity' => round($netQty, 2),
            ]);
        }

        $this->command?->info('InventoryReportSeeder seeded purchase + usage data with consistent remaining stock.');
    }
}

