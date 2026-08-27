<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use App\Models\PoDetail;
use App\Models\PurchaseOrder;
use App\Models\StockIn;
use App\Models\StockInDetail;
use App\Models\StockUsage;
use App\Models\Supplier;
use App\Models\UsageDetail;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Purchase orders, stock receipts, and kitchen usage with mixed past / recent / future dates.
 */
class PurchaseInventorySeeder extends Seeder
{
    public function run(): void
    {
        $staffId = (int) (DB::table('staffs')->orderBy('id')->value('id') ?? 0);
        $suppliers = Supplier::query()->orderBy('id')->get();
        $ingredients = Ingredient::query()->orderBy('id')->get();

        if ($staffId <= 0 || $suppliers->isEmpty() || $ingredients->count() < 3) {
            $this->command?->warn('PurchaseInventorySeeder skipped: need staff, suppliers, and at least 3 ingredients.');

            return;
        }

        $i0 = (int) $ingredients[0]->id;
        $i1 = (int) $ingredients[1]->id;
        $i2 = (int) $ingredients[2]->id;
        $i3 = $ingredients->count() > 3 ? (int) $ingredients[3]->id : $i0;
        $i4 = $ingredients->count() > 4 ? (int) $ingredients[4]->id : $i1;

        $s0 = (int) $suppliers[0]->id;
        $s1 = (int) $suppliers[1]->id;
        $s2 = (int) $suppliers[2]->id;

        $now = Carbon::now();

        DB::transaction(function () use ($staffId, $i0, $i1, $i2, $i3, $i4, $s0, $s1, $s2, $now): void {
            // --- Purchase orders (past → future po_date) ---
            $poReceivedOld = PurchaseOrder::query()->create([
                'staff_id' => $staffId,
                'sup_id' => $s0,
                'po_date' => $now->copy()->subMonths(3)->setTime(9, 30),
                'po_status' => 'Received',
            ]);
            PoDetail::query()->create(['po_id' => $poReceivedOld->id, 'ing_id' => $i0, 'quantity' => 12.5]);
            PoDetail::query()->create(['po_id' => $poReceivedOld->id, 'ing_id' => $i1, 'quantity' => 40]);

            $impOld = StockIn::query()->create([
                'po_id' => $poReceivedOld->id,
                'staff_id' => $staffId,
                'total_price' => 12.5 * 185_000 + 40 * 12_000,
                'import_date' => $now->copy()->subMonths(3)->addDay()->setTime(14, 0),
            ]);
            StockInDetail::query()->create(['imp_id' => $impOld->id, 'ing_id' => $i0, 'quantity' => 12.5, 'cost_price' => 185_000]);
            StockInDetail::query()->create(['imp_id' => $impOld->id, 'ing_id' => $i1, 'quantity' => 40, 'cost_price' => 12_000]);

            $poReceivedMid = PurchaseOrder::query()->create([
                'staff_id' => $staffId,
                'sup_id' => $s1,
                'po_date' => $now->copy()->subWeeks(5)->setTime(10, 15),
                'po_status' => 'Received',
            ]);
            PoDetail::query()->create(['po_id' => $poReceivedMid->id, 'ing_id' => $i2, 'quantity' => 25]);
            PoDetail::query()->create(['po_id' => $poReceivedMid->id, 'ing_id' => $i3, 'quantity' => 8.25]);

            $impMid = StockIn::query()->create([
                'po_id' => $poReceivedMid->id,
                'staff_id' => $staffId,
                'total_price' => 25 * 45_000 + 8.25 * 62_000,
                'import_date' => $now->copy()->subWeeks(5)->addHours(8),
            ]);
            StockInDetail::query()->create(['imp_id' => $impMid->id, 'ing_id' => $i2, 'quantity' => 25, 'cost_price' => 45_000]);
            StockInDetail::query()->create(['imp_id' => $impMid->id, 'ing_id' => $i3, 'quantity' => 8.25, 'cost_price' => 62_000]);

            $poOrdered = PurchaseOrder::query()->create([
                'staff_id' => $staffId,
                'sup_id' => $s2,
                'po_date' => $now->copy()->subDays(6)->setTime(11, 0),
                'po_status' => 'Ordered',
            ]);
            PoDetail::query()->create(['po_id' => $poOrdered->id, 'ing_id' => $i3, 'quantity' => 6]);
            PoDetail::query()->create(['po_id' => $poOrdered->id, 'ing_id' => $i2, 'quantity' => 10.5]);
            $poPending = PurchaseOrder::query()->create([
                'staff_id' => $staffId,
                'sup_id' => $s0,
                'po_date' => $now->copy()->addWeeks(2)->setTime(9, 0),
                'po_status' => 'Pending',
            ]);
            PoDetail::query()->create(['po_id' => $poPending->id, 'ing_id' => $i4, 'quantity' => 15]);
            PoDetail::query()->create(['po_id' => $poPending->id, 'ing_id' => $i0, 'quantity' => 20]);

            // --- Stock usage batches (kitchen / spoilage) ---
            $usageSpecs = [
                ['date' => $now->copy()->subMonths(2)->setTime(7, 0), 'note' => 'Monthly inventory prep (demo)', 'lines' => [
                    [$i0, 2.5], [$i1, 5],
                ]],
                ['date' => $now->copy()->subWeeks(6)->setTime(8, 30), 'note' => 'Buffet line setup', 'lines' => [
                    [$i2, 3], [$i3, 1.25],
                ]],
                ['date' => $now->copy()->subWeeks(2)->setTime(6, 45), 'note' => 'Weekend service', 'lines' => [
                    [$i0, 1], [$i2, 4.5], [$i4, 0.5],
                ]],
                ['date' => $now->copy()->subDay()->setTime(19, 0), 'note' => 'Yesterday closing usage', 'lines' => [
                    [$i1, 2], [$i3, 3],
                ]],
                ['date' => $now->copy()->subHours(3), 'note' => 'Today live kitchen', 'lines' => [
                    [$i0, 0.75], [$i2, 1.5],
                ]],
                ['date' => $now->copy()->addDay()->setTime(10, 0), 'note' => 'Scheduled prep (demo future)', 'lines' => [
                    [$i1, 1.25], [$i4, 2],
                ]],
            ];

            foreach ($usageSpecs as $spec) {
                $usage = StockUsage::query()->create([
                    'staff_id' => $staffId,
                    'usage_date' => $spec['date'],
                    'usage_detail' => $spec['note'],
                ]);
                foreach ($spec['lines'] as [$ingId, $qty]) {
                    UsageDetail::query()->create([
                        'usage_id' => $usage->id,
                        'ing_id' => $ingId,
                        'usage_qty' => $qty,
                    ]);
                }
            }
        });

        $this->command?->info('PurchaseInventorySeeder: suppliers POs, stock-in, and usage rows created.');
    }
}
