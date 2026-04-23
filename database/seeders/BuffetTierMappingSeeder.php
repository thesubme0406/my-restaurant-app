<?php

namespace Database\Seeders;

use App\Models\BuffetTier;
use App\Models\Menu;
use App\Models\MenuCatg;
use Illuminate\Database\Seeder;

/**
 * Links menus to buffet tiers via the buffet_tier_menu pivot (buffet_tier_id, menu_id).
 *
 * Rules:
 * - Silver: Drinks + Appetizers + 2 basic Sushi items.
 * - Gold: everything in Silver + all Sushi items.
 * - Deluxe: all available menu items.
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

        $idSushi = $catId('Sushi');
        $idDrinks = $catId('Drinks');
        $idAppetizers = $catId('Appetizers');

        if ($idSushi === null || $idDrinks === null || $idAppetizers === null) {
            $this->command?->warn('BuffetTierMappingSeeder skipped: menu categories missing (run MenuCategorySeeder + MenuSeeder).');

            return;
        }

        $idsForCategory = static fn (int $categoryId): array => Menu::query()
            ->where('category_id', $categoryId)
            ->orderBy('id')
            ->pluck('id')
            ->all();

        $drinkIds = $idsForCategory($idDrinks);
        $appetizerIds = $idsForCategory($idAppetizers);
        $sushiIds = $idsForCategory($idSushi);

        if (count($drinkIds) + count($appetizerIds) + count($sushiIds) < 15) {
            $this->command?->warn('BuffetTierMappingSeeder skipped: expected at least 15 menus across Sushi/Drinks/Appetizers.');

            return;
        }

        $basicSushiIds = array_slice($sushiIds, 0, 2);

        $silverIds = array_values(array_unique(array_merge($drinkIds, $appetizerIds, $basicSushiIds)));
        sort($silverIds);

        $goldIds = array_values(array_unique(array_merge($silverIds, $sushiIds)));
        sort($goldIds);

        $deluxeIds = Menu::query()->orderBy('id')->pluck('id')->all();

        $tierSilver->menus()->sync($silverIds);
        $tierGold->menus()->sync($goldIds);
        $tierDeluxe->menus()->sync($deluxeIds);
    }
}
