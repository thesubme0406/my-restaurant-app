<?php

namespace Database\Seeders;

use App\Models\MenuCatg;
use Illuminate\Database\Seeder;

/**
 * Core menu categories for buffet / à la carte demo data (Lao UI copy).
 */
class MenuCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['catg_name' => 'Sashimi', 'image' => null],
            ['catg_name' => 'Sushi', 'image' => null],
            ['catg_name' => 'Drinks', 'image' => null],
            ['catg_name' => 'Dessert', 'image' => null],
        ];

        foreach ($categories as $row) {
            MenuCatg::query()->updateOrCreate(
                ['catg_name' => $row['catg_name']],
                $row
            );
        }
    }
}
