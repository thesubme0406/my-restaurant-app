<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class UsageReportSeeder extends Seeder
{
    public function run(): void
    {
        $staffIds = DB::table('staffs')->orderBy('id')->pluck('id')->all();
        $ingredientRows = DB::table('ingredients')
            ->select('id', 'ing_quantity')
            ->orderBy('id')
            ->get();

        if (empty($staffIds) || $ingredientRows->isEmpty()) {
            $this->command?->warn('UsageReportSeeder skipped: staffs and ingredients are required.');
            return;
        }

        DB::transaction(function () use ($staffIds): void {
            $oldUsageIds = DB::table('stock_usage')
                ->where('usage_detail', 'like', 'REPORT_USAGE_%')
                ->pluck('id')
                ->all();

            if (! empty($oldUsageIds)) {
                DB::table('stock_usage')->whereIn('id', $oldUsageIds)->delete();
            }

            $ingredients = DB::table('ingredients')
                ->select('id', 'ing_quantity')
                ->orderBy('id')
                ->get()
                ->keyBy('id');

            for ($i = 1; $i <= 18; $i++) {
                $ingredientId = (int) $ingredients->keys()->random();
                $ingredient = $ingredients->get($ingredientId);
                $currentQty = (float) ($ingredient->ing_quantity ?? 0);

                if ($currentQty <= 0) {
                    continue;
                }

                $usageQty = min($currentQty, (float) random_int(1, 5));
                $usageAt = Carbon::now()->subDays(random_int(0, 25))->setTime(random_int(9, 20), random_int(0, 59));

                $usageId = DB::table('stock_usage')->insertGetId([
                    'staff_id' => $staffIds[array_rand($staffIds)],
                    'usage_date' => $usageAt,
                    'usage_detail' => 'REPORT_USAGE_'.$i,
                ]);

                DB::table('usage_detail')->insert([
                    'usage_id' => $usageId,
                    'ing_id' => $ingredientId,
                    'usage_qty' => $usageQty,
                ]);

                DB::table('ingredients')->where('id', $ingredientId)->decrement('ing_quantity', $usageQty);
                $ingredient->ing_quantity = $currentQty - $usageQty;
                $ingredients->put($ingredientId, $ingredient);
            }
        });

        $this->command?->info('UsageReportSeeder seeded raw-material usage rows for report testing.');
    }
}

