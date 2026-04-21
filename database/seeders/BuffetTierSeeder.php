<?php

namespace Database\Seeders;

use App\Models\BuffetTier;
use Illuminate\Database\Seeder;

class BuffetTierSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['tier_name' => 'Silver', 'price' => 299000, 'description' => 'ແພັກເກັດ Silver — ເຄື່ອງດື່ມ ແລະ ຂອງຫວານ ພ້ອມຊູຊິພື້ນຖານ.', 'image' => null],
            ['tier_name' => 'Gold', 'price' => 460000, 'description' => 'ແພັກເກັດ Gold — ຄົບຊຸດ Silver ບວກຊູຊິທັງໝົດ.', 'image' => null],
            ['tier_name' => 'Deluxe', 'price' => 850000, 'description' => 'ແພັກເກັດ Deluxe — ເມນູຄົບທຸກປະເພດ.', 'image' => null],
        ];

        foreach ($rows as $row) {
            BuffetTier::query()->updateOrCreate(
                ['tier_name' => $row['tier_name']],
                $row
            );
        }
    }
}
