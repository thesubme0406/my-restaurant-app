<?php

namespace Database\Seeders;

use App\Models\BuffetTier;
use App\Models\Menu;
use App\Models\MenuCatg;
use Illuminate\Database\Seeder;

/**
 * Links menus to buffet tiers via the menu_detail pivot (buffet_tier_id, menu_id).
 *
 * Rules:
 * - Silver: all Drinks + all Dessert + 2 basic Sushi items (lowest id in Sushi category).
 * - Gold: everything in Silver + all remaining Sushi items (full Sushi category).
 * - Deluxe: all 20 menu items (every category).
 */
class BuffetTierMappingSeeder extends Seeder
{
    public function run(): void
    {
        $tierSilver = BuffetTier::query()->where('tier_name', 'Silver')->first();
        $tierGold = BuffetTier::query()->where('tier_name', 'Gold')->first();
        $tierDeluxe = BuffetTier::query()->where('tier_name', 'Deluxe')->first();

        if ($tierSilver === null || $tierGold === null || $tierDeluxe === null) {
            $this->command?->warn('BuffetTierMappingSeeder skipped: Silver, Gold, and Deluxe tiers must exist (run BuffetTierSeeder).');

            return;
        }

        $catId = static fn (string $name): ?int => MenuCatg::query()->where('catg_name', $name)->value('id');

        $idSashimi = $catId('Sashimi');
        $idSushi = $catId('Sushi');
        $idDrinks = $catId('Drinks');
        $idDessert = $catId('Dessert');

        if ($idSashimi === null || $idSushi === null || $idDrinks === null || $idDessert === null) {
            $this->command?->warn('BuffetTierMappingSeeder skipped: menu categories missing (run MenuCategorySeeder + MenuSeeder).');

            return;
        }

        $idsForCategory = static fn (int $categoryId): array => Menu::query()
            ->where('category_id', $categoryId)
            ->orderBy('id')
            ->pluck('id')
            ->all();

        $drinkIds = $idsForCategory($idDrinks);
        $dessertIds = $idsForCategory($idDessert);
        $sushiIds = $idsForCategory($idSushi);
        $sashimiIds = $idsForCategory($idSashimi);

        if (count($drinkIds) + count($dessertIds) + count($sushiIds) + count($sashimiIds) < 20) {
            $this->command?->warn('BuffetTierMappingSeeder skipped: expected 20 menus across four categories.');

            return;
        }

        $basicSushiIds = array_slice($sushiIds, 0, 2);

        $silverIds = array_values(array_unique(array_merge($drinkIds, $dessertIds, $basicSushiIds)));
        sort($silverIds);

        $goldIds = array_values(array_unique(array_merge($silverIds, $sushiIds)));
        sort($goldIds);

        $deluxeIds = Menu::query()->orderBy('id')->pluck('id')->all();

        $tierSilver->menus()->sync($silverIds);
        $tierGold->menus()->sync($goldIds);
        $tierDeluxe->menus()->sync($deluxeIds);
    }
}
