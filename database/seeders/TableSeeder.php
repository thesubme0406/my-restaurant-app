<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Table;
use Illuminate\Support\Collection;

class TableSeeder extends Seeder
{
    public function run(): void
    {
        $capacities = Collection::make([2, 4, 8]);
        $rows = [];

        for ($i = 1; $i <= 12; $i++) {
            $rows[] = [
                'table_no' => 'T-'.str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                'capacity' => $capacities[($i - 1) % $capacities->count()],
                'zone' => $i <= 8 ? 'standard' : 'vip',
                'readiness' => 'ready',
                'usage_status' => $i <= 6 ? 'available' : 'occupied',
            ];
        }

        foreach ($rows as $row) {
            Table::query()->updateOrCreate(
                ['table_no' => $row['table_no']],
                $row
            );
        }
    }
}
