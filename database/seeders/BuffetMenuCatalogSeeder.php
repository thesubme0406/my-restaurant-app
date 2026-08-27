<?php

namespace Database\Seeders;

use App\Models\BuffetTier;
use App\Models\Menu;
use App\Models\MenuCatg;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Full buffet menu + tier catalog. Each menu item gets a photo matched to its English name
 * (downloaded from curated Unsplash URLs, with local fallback).
 */
class BuffetMenuCatalogSeeder extends Seeder
{
    /** @var array<string, string> English menu name → image URL (Unsplash + tag-matched LoremFlickr) */
    private const PHOTO_URLS = [
        'Salmon Sushi' => 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=800&h=800&q=80',
        'Tuna Sushi' => 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&h=800&q=80',
        'California Roll' => 'https://loremflickr.com/800/800/california,roll,sushi?lock=201',
        'Avocado Roll' => 'https://loremflickr.com/800/800/avocado,sushi,roll?lock=202',
        'Tamago Sushi' => 'https://loremflickr.com/800/800/tamago,sushi,egg?lock=203',
        'Shrimp Tempura Roll' => 'https://loremflickr.com/800/800/shrimp,tempura,roll?lock=204',
        'Salmon Belly' => 'https://loremflickr.com/800/800/salmon,sashimi,belly?lock=205',
        'Crab Roll' => 'https://loremflickr.com/800/800/crab,sushi,roll?lock=206',
        'Yakitori' => 'https://loremflickr.com/800/800/yakitori,chicken,skewer?lock=207',
        'Gyoza' => 'https://loremflickr.com/800/800/gyoza,dumpling,japanese?lock=208',
        'Miso Soup' => 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&h=800&q=80',
        'Seaweed Salad' => 'https://loremflickr.com/800/800/seaweed,salad,wakame?lock=209',
        'Takoyaki' => 'https://loremflickr.com/800/800/takoyaki,japanese,octopus?lock=210',
        'Edamame' => 'https://loremflickr.com/800/800/edamame,beans,soy?lock=211',
        'Iced Green Tea' => 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&h=800&q=80',
        'Orange Juice' => 'https://loremflickr.com/800/800/orange,juice,glass?lock=212',
        'Apple Juice' => 'https://loremflickr.com/800/800/apple,juice,drink?lock=213',
        'Soft Drink' => 'https://loremflickr.com/800/800/soda,cola,drink?lock=214',
        'Mineral Water' => 'https://loremflickr.com/800/800/mineral,water,bottle?lock=215',
        'Lemon Tea' => 'https://loremflickr.com/800/800/lemon,tea,drink?lock=216',
        'Green Tea Ice' => 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&h=800&q=80',
        'Mochi Ice' => 'https://loremflickr.com/800/800/mochi,ice,cream?lock=217',
        'Japanese Crepe' => 'https://loremflickr.com/800/800/crepe,japanese,dessert?lock=218',
        'Dorayaki' => 'https://loremflickr.com/800/800/dorayaki,pan,japanese?lock=219',
        'Fruit Platter' => 'https://loremflickr.com/800/800/fruit,platter,fresh?lock=220',
        'Dessert Set' => 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&h=800&q=80',
    ];

    /** @var array<string, string> */
    private const CATEGORY_FALLBACK_ASSET = [
        'Sushi' => 'images/sushi.png',
        'Appetizers' => 'images/foodshowing.jpg',
        'Drinks' => 'images/foodshowing.jpg',
        'Dessert' => 'images/sushi.png',
    ];

    public function run(): void
    {
        $this->resetMenuStorage();

        $categories = $this->seedCategories();
        $menusByCategory = $this->seedMenus($categories);
        $tiers = $this->seedBuffetTiers();
        $this->mapMenusToTiers($tiers, $menusByCategory);

        $withPhoto = Menu::query()->whereNotNull('image')->where('image', '!=', '')->count();
        $total = Menu::query()->count();
        $this->command?->info("BuffetMenuCatalogSeeder: {$total} menus, {$withPhoto} with photos, 4 tiers.");
    }

    private function resetMenuStorage(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('buffet_tier_menu')->truncate();
        DB::table('menu_detail')->truncate();
        DB::table('menus')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        if (Storage::disk('public')->exists('menus')) {
            foreach (Storage::disk('public')->allFiles('menus') as $file) {
                Storage::disk('public')->delete($file);
            }
        }

        Storage::disk('public')->makeDirectory('menus');
        Storage::disk('public')->makeDirectory('menu-categories');
        Storage::disk('public')->makeDirectory('buffet-tiers');
    }

    /**
     * @return array<string, MenuCatg>
     */
    private function seedCategories(): array
    {
        $out = [];
        foreach (self::CATEGORY_FALLBACK_ASSET as $name => $asset) {
            $image = $this->copyLocalAsset($asset, 'menu-categories/'.Str::slug($name).'.png');
            $out[$name] = MenuCatg::query()->updateOrCreate(
                ['catg_name' => $name],
                ['image' => $image]
            );
        }

        return $out;
    }

    /**
     * @param  array<string, MenuCatg>  $categories
     * @return array<string, list<int>>
     */
    private function seedMenus(array $categories): array
    {
        $catalog = [
            'Sushi' => [
                ['name' => 'ຊູຊິແຊວມອນ', 'name_en' => 'Salmon Sushi', 'description' => 'ແຊວມອນສົດ ຫົວໃຫຍ່ ເຂົ້າສຸກ'],
                ['name' => 'ຊູຊິທູນາ', 'name_en' => 'Tuna Sushi', 'description' => 'ທູນາສົດ ຄຸນນະພາບດີ'],
                ['name' => 'ຄາລິຟໍເນຍໂຣລ', 'name_en' => 'California Roll', 'description' => 'ກຸ້ງ ແອວໂກໂດ ຄຣີມຊີ'],
                ['name' => 'ອາໂວຄາໂດໂຣລ', 'name_en' => 'Avocado Roll', 'description' => 'ອາໂວຄາໂດສົດ ຫວານເບົາ'],
                ['name' => 'ໄຂ່ຫວານຊູຊິ', 'name_en' => 'Tamago Sushi', 'description' => 'ໄຂ່ຫວານຍີ່ປຸ່ນແບບດັ້ງເດີມ'],
                ['name' => 'ກຸ້ງເທັມປູລາໂຣລ', 'name_en' => 'Shrimp Tempura Roll', 'description' => 'ກຸ້ງທອດກຮອບ ຊອດພິເສດ'],
                ['name' => 'ແຊວມອນຄໍ', 'name_en' => 'Salmon Belly', 'description' => 'ຄໍແຊວມອນ ມັນຊຸ່ມ'],
                ['name' => 'ໂຣລປູອັດ', 'name_en' => 'Crab Roll', 'description' => 'ປູອັດ ເຂົ້າສຸກ ຄຣີມຊີ'],
            ],
            'Appetizers' => [
                ['name' => 'ຢາກິໂທຣິ', 'name_en' => 'Yakitori', 'description' => 'ໄກ່ປີ້ງແບບຍີ່ປຸ່ນ ຫອມກະເທີມ'],
                ['name' => 'ເກຍວຊ່າ', 'name_en' => 'Gyoza', 'description' => 'ຕຳຫປູ້ງທອດ ຊອດສົ້ມຫວານ'],
                ['name' => 'ຊູບມິໂຊ', 'name_en' => 'Miso Soup', 'description' => 'ຊູບມິໂຊຮ້ອນໆ'],
                ['name' => 'ສະຫຼັດສາຫຼ່າຍ', 'name_en' => 'Seaweed Salad', 'description' => 'ສາຫຼ່າຍສົດ ງາຂີ້'],
                ['name' => 'ທາໂກະຍາກິ', 'name_en' => 'Takoyaki', 'description' => 'ລູກປຸ້ງຍີ່ປຸ່ນ ຊອດພິເສດ'],
                ['name' => 'ເອດາມາເມະ', 'name_en' => 'Edamame', 'description' => 'ຖົ່ວແຂກໂຣຍເກືອ'],
            ],
            'Drinks' => [
                ['name' => 'ຊາຂຽວເຢັນ', 'name_en' => 'Iced Green Tea', 'description' => 'ຊາເຂຍວເຢັນ ສົດຊື່ນ'],
                ['name' => 'ນ້ຳສົ້ມຄັ້ນ', 'name_en' => 'Orange Juice', 'description' => 'ນ້ຳສົ້ມສົດຄັ້ນ'],
                ['name' => 'ນ້ຳແອັບເປິ້ນ', 'name_en' => 'Apple Juice', 'description' => 'ແອັບເປິ້ນຫວານສົດ'],
                ['name' => 'ນ້ຳອັດລົມ', 'name_en' => 'Soft Drink', 'description' => 'ໂຄ້ກ / ສະເປຣດ'],
                ['name' => 'ນ້ຳແຮ່', 'name_en' => 'Mineral Water', 'description' => 'ນ້ຳແຮ່ເຢັນ'],
                ['name' => 'ຊາມະນາວ', 'name_en' => 'Lemon Tea', 'description' => 'ຊາມະນາວ ຫວານອົມກະປິ'],
            ],
            'Dessert' => [
                ['name' => 'ໄອຕິມຊາເຂຍວ', 'name_en' => 'Green Tea Ice', 'description' => 'ໄອຕິມຊາເຂຍວ'],
                ['name' => 'ມອດຊິເຢັນ', 'name_en' => 'Mochi Ice', 'description' => 'ໂມຈິໄອສຄຣີມ'],
                ['name' => 'ເຄຣບຍີ່ປຸ່ນ', 'name_en' => 'Japanese Crepe', 'description' => 'ເຄຣບໄສ້ຫວານ'],
                ['name' => 'ໂດຣາຍາກິ', 'name_en' => 'Dorayaki', 'description' => 'ຂນົມຖົ່ວແດງ'],
                ['name' => 'ຈານຜົນໄມ້', 'name_en' => 'Fruit Platter', 'description' => 'ຜົນໄມ້ຕາມລະດູກິນ'],
                ['name' => 'ເຄື່ອງຫວານລວມ', 'name_en' => 'Dessert Set', 'description' => 'ຊຸດຂອງຫວານຍີ່ປຸ່ນ'],
            ],
        ];

        $menusByCategory = [];
        $index = 0;

        foreach ($catalog as $categoryName => $items) {
            $category = $categories[$categoryName];
            $menusByCategory[$categoryName] = [];
            $fallback = self::CATEGORY_FALLBACK_ASSET[$categoryName] ?? 'images/foodshowing.jpg';

            foreach ($items as $item) {
                $index++;
                $nameEn = $item['name_en'];
                $slug = Str::slug($nameEn);
                $storageBase = 'menus/'.$index.'-'.$slug;

                $imagePath = $this->downloadPhoto($nameEn, $storageBase);
                if ($imagePath === null) {
                    $imagePath = $this->copyLocalAsset($fallback, $storageBase.'.png');
                }

                $menu = Menu::query()->create([
                    'category_id' => $category->id,
                    'name' => mb_substr($item['name'], 0, 25),
                    'name_en' => $nameEn,
                    'description' => $item['description'],
                    'image' => $imagePath,
                    'is_active' => true,
                ]);

                $menusByCategory[$categoryName][] = $menu->id;
                $this->command?->line("  ✓ {$nameEn}");
            }
        }

        return $menusByCategory;
    }

    /**
     * @return array<string, BuffetTier>
     */
    private function seedBuffetTiers(): array
    {
        $definitions = [
            'Silver' => [
                'price' => 299000,
                'description' => 'ແພັກ Silver — ທຸກປະເພດອາຫານ (ຊູຊິ ເຄື່ອງກັນ ເຄື່ອງດື່ມ ຂອງຫວານ) ເລືອກຊຸດພື້ນຖານ.',
                'asset' => 'images/foodshowing.jpg',
            ],
            'Gold' => [
                'price' => 460000,
                'description' => 'ແພັກ Gold — ເມນູເພີ່ມຂຶ້ນ ຄົບທຸກຫມວດອາຫານ.',
                'asset' => 'images/sushi.png',
            ],
            'Deluxe' => [
                'price' => 850000,
                'description' => 'ແພັກ Deluxe — ເກືອບທຸກເມນູ ທຸກປະເພດ.',
                'asset' => 'images/foodshowing.jpg',
            ],
            'Platinum' => [
                'price' => 990000,
                'description' => 'ແພັກ Platinum — ບຸບເຟ່ເຕັມຮູບແບບ ທຸກເມນູ.',
                'asset' => 'images/sushi.png',
            ],
        ];

        $tiers = [];
        foreach ($definitions as $name => $row) {
            $image = $this->copyLocalAsset($row['asset'], 'buffet-tiers/tier-'.Str::slug($name).'.png');
            $tiers[$name] = BuffetTier::query()->updateOrCreate(
                ['tier_name' => $name],
                [
                    'price' => $row['price'],
                    'description' => $row['description'],
                    'image' => $image,
                ]
            );
        }

        return $tiers;
    }

    /**
     * @param  array<string, BuffetTier>  $tiers
     * @param  array<string, list<int>>  $menusByCategory
     */
    private function mapMenusToTiers(array $tiers, array $menusByCategory): void
    {
        $coverage = [
            'Silver' => 0.55,
            'Gold' => 0.72,
            'Deluxe' => 0.88,
            'Platinum' => 1.0,
        ];

        foreach ($coverage as $tierName => $ratio) {
            $tier = $tiers[$tierName] ?? null;
            if ($tier === null) {
                continue;
            }

            $menuIds = [];
            foreach ($menusByCategory as $ids) {
                $count = count($ids);
                if ($count === 0) {
                    continue;
                }
                $take = max(2, min($count, (int) ceil($count * $ratio)));
                $menuIds = array_merge($menuIds, array_slice($ids, 0, $take));
            }

            $menuIds = array_values(array_unique($menuIds));
            sort($menuIds);
            $tier->menus()->sync($menuIds);
        }

        DB::table('menu_detail')->delete();
        foreach (DB::table('buffet_tier_menu')->get() as $pivot) {
            DB::table('menu_detail')->insert([
                'buffet_tier_id' => $pivot->buffet_tier_id,
                'menu_id' => $pivot->menu_id,
            ]);
        }
    }

    private function downloadPhoto(string $nameEn, string $storageBase): ?string
    {
        $url = self::PHOTO_URLS[$nameEn] ?? null;
        if ($url === null) {
            return null;
        }

        try {
            $response = Http::timeout(90)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'image/*,*/*',
                ])
                ->get($url);

            if (! $response->successful()) {
                $this->command?->warn("  ↳ HTTP {$response->status()} for {$nameEn}");

                return null;
            }

            $body = $response->body();
            if ($body === '') {
                return null;
            }

            $ext = 'jpg';
            $contentType = strtolower((string) $response->header('Content-Type'));
            if (str_contains($contentType, 'png')) {
                $ext = 'png';
            } elseif (str_contains($contentType, 'webp')) {
                $ext = 'webp';
            }

            $path = $storageBase.'.'.$ext;
            Storage::disk('public')->put($path, $body);

            return $path;
        } catch (\Throwable $e) {
            $this->command?->warn("  ↳ Download failed for {$nameEn}: {$e->getMessage()}");

            return null;
        }
    }

    private function copyLocalAsset(string $publicRelative, string $storagePath): ?string
    {
        $source = public_path($publicRelative);
        if (! is_file($source)) {
            return null;
        }

        $dir = dirname($storagePath);
        if ($dir !== '.' && $dir !== '') {
            Storage::disk('public')->makeDirectory($dir);
        }

        File::copy($source, Storage::disk('public')->path($storagePath));

        return $storagePath;
    }
}
