<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use Illuminate\Database\Seeder;

class IngredientSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['ing_name' => 'Salmon', 'ing_category' => 'Seafood', 'ing_unit' => 'kg', 'ing_quantity' => 35, 'ing_min' => 8],
            ['ing_name' => 'Rice', 'ing_category' => 'Grain', 'ing_unit' => 'kg', 'ing_quantity' => 100, 'ing_min' => 20],
            ['ing_name' => 'Wasabi', 'ing_category' => 'Condiment', 'ing_unit' => 'pack', 'ing_quantity' => 40, 'ing_min' => 10],
            ['ing_name' => 'Soy Sauce', 'ing_category' => 'Condiment', 'ing_unit' => 'L', 'ing_quantity' => 25, 'ing_min' => 5],
            ['ing_name' => 'Seaweed', 'ing_category' => 'Vegetable', 'ing_unit' => 'pack', 'ing_quantity' => 30, 'ing_min' => 8],
        ];

        foreach ($rows as $row) {
            Ingredient::query()->updateOrCreate(
                ['ing_name' => $row['ing_name']],
                $row
            );
        }
    }
}

