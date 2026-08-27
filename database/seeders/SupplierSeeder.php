<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            [
                'sup_name' => 'Nordic Seafood Supply',
                'contact_person' => 'Jon Hansen',
                'contact_tel' => '02123450001',
                'sup_address' => '12 Harbor Rd, Vientiane',
            ],
            [
                'sup_name' => 'Asia Grain Co.',
                'contact_person' => 'Ms. Keomany',
                'contact_tel' => '02123450002',
                'sup_address' => '45 Market St, Vientiane',
            ],
            [
                'sup_name' => 'Fresh Condiments Ltd',
                'contact_person' => 'Mr. Bounmy',
                'contact_tel' => '02123450003',
                'sup_address' => '8 Food Park, Vientiane',
            ],
            [
                'sup_name' => 'Green Veg Wholesale',
                'contact_person' => 'Ms. Sengdao',
                'contact_tel' => '02123450004',
                'sup_address' => '33 Farm Link Rd, Vientiane',
            ],
        ];

        foreach ($rows as $row) {
            Supplier::query()->updateOrCreate(
                ['sup_name' => $row['sup_name']],
                $row
            );
        }
    }
}
