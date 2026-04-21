<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('service_detail')->delete();
        DB::table('tables')->delete();

        $rows = [];

        for ($i = 1; $i <= 20; $i++) {
            $zone = $i <= 14 ? 'standard' : 'vip';
            $status = match ($i % 6) {
                0, 1 => 'available',
                2, 3, 4 => 'occupied',
                default => 'maintenance',
            };

            $rows[] = [
                'table_no' => 'T'.str_pad((string) $i, 2, '0', STR_PAD_LEFT),
                'capacity' => random_int(2, 8),
                'zone' => $zone,
                'status' => $status,
            ];
        }

        DB::table('tables')->insert($rows);
    }
}
