<?php

namespace Database\Seeders;

use App\Models\BuffetTier;
use Illuminate\Database\Seeder;

class BuffetTierSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['tier_name' => 'Silver', 'price' => 299000, 'description' => 'Silver buffet package', 'image' => null],
            ['tier_name' => 'Gold', 'price' => 399000, 'description' => 'Gold buffet package', 'image' => null],
            ['tier_name' => 'Platinum', 'price' => 599000, 'description' => 'Platinum buffet package', 'image' => null],
        ];

        foreach ($rows as $row) {
            BuffetTier::query()->updateOrCreate(
                ['tier_name' => $row['tier_name']],
                $row
            );
        }
    }
}

