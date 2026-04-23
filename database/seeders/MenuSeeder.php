<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\MenuCatg;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Generates 18 unique demo menus across Sushi/Appetizers/Drinks.
 */
class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $cat = static fn (string $name): ?MenuCatg => MenuCatg::query()->where('catg_name', $name)->first();

        // Hard reset menu data first to remove duplicate rows/legacy mappings.
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('buffet_tier_menu')->truncate();
        DB::table('menu_detail')->truncate();
        DB::table('menus')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $definitions = [
            'Sushi' => [
                ['name' => 'ຊູຊິແຊວມອນ', 'name_en' => 'Salmon Sushi'],
                ['name' => 'ຊູຊິທູນາ', 'name_en' => 'Tuna Sushi'],
                ['name' => 'ຄາລິຟໍເນຍໂຣລ', 'name_en' => 'California Roll'],
                ['name' => 'ອາໂວກາໂດໂຣລ', 'name_en' => 'Avocado Roll'],
                ['name' => 'ໄຂ່ຫວານຊູຊິ', 'name_en' => 'Tamago Sushi'],
                ['name' => 'ກຸ້ງເທັມປູຣາໂຣລ', 'name_en' => 'Shrimp Tempura Roll'],
            ],
            'Appetizers' => [
                ['name' => 'ຢາກິໂທຣິ', 'name_en' => 'Yakitori'],
                ['name' => 'ເກຍວຊ່າ', 'name_en' => 'Gyoza'],
                ['name' => 'ຊູບມິໂຊ', 'name_en' => 'Miso Soup'],
                ['name' => 'ສະຫຼັດສາຫຼາຍ', 'name_en' => 'Seaweed Salad'],
                ['name' => 'ທາໂກະຍາກິ', 'name_en' => 'Takoyaki'],
                ['name' => 'ເອດາມາເມະ', 'name_en' => 'Edamame'],
            ],
            'Drinks' => [
                ['name' => 'ຊາຂຽວເຢັນ', 'name_en' => 'Iced Green Tea'],
                ['name' => 'ນ້ຳສົ້ມຄັ້ນ', 'name_en' => 'Orange Juice'],
                ['name' => 'ນ້ຳແອັບເປິ້ນ', 'name_en' => 'Apple Juice'],
                ['name' => 'ນ້ຳອັດລົມ', 'name_en' => 'Soft Drink'],
                ['name' => 'ນ້ຳແຮ່', 'name_en' => 'Mineral Water'],
                ['name' => 'ຊາມະນາວ', 'name_en' => 'Lemon Tea'],
            ],
        ];

        foreach ($definitions as $categoryName => $items) {
            $category = $cat($categoryName);
            if ($category === null) {
                continue;
            }

            foreach ($items as $item) {
                Menu::query()->create([
                    'category_id' => $category->id,
                    'name' => $item['name'],
                    'name_en' => $item['name_en'],
                    'description' => "Demo {$item['name_en']} menu for reporting and filter tests.",
                    'image' => null,
                    'is_active' => true,
                ]);
            }
        }
    }
}
