<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\MenuCatg;
use Illuminate\Database\Seeder;

/**
 * Twenty demo menus (5 per category) with Lao names, English subtitles, Unsplash image URLs, and descriptions.
 * Names are kept within the schema limit (varchar 25) for the menus.name column.
 */
class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $cat = static fn (string $name): ?MenuCatg => MenuCatg::query()->where('catg_name', $name)->first();

        $definitions = [
            'Sashimi' => [
                ['name' => 'ຊາຊິມິແຊວມອນ', 'name_en' => 'Salmon Sashimi', 'description' => 'ຊາຊິມິແຊວມອນສົດໃໝ່ ຕັດໜາເບບີ.', 'image' => 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?auto=format&fit=crop&w=800&q=80'],
                ['name' => 'ຊາຊິມິທູນນາ', 'name_en' => 'Tuna Sashimi', 'description' => 'ທູນນາຄຸນນະພາບດີ ລົດຊາດນຸ່ມ.', 'image' => 'https://images.unsplash.com/photo-1553621042-f1e14756d3b5?auto=format&fit=crop&w=800&q=80'],
                ['name' => 'ຊາຊິມິກຸ້ງ', 'name_en' => 'Shrimp Sashimi', 'description' => 'ກຸ້ງຫວານ ຈິ້ມແຊວມອນ.', 'image' => 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80'],
                ['name' => 'ຊາຊິມິປາ', 'name_en' => 'White Fish Sashimi', 'description' => 'ປາທະເລຊິ້ນຂາວ ສົດຈາກຕະຫຼາດ.', 'image' => 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80'],
                ['name' => 'ຊາຂຽວມັດຊະ', 'name_en' => 'Green Tea Sashimi', 'description' => 'ຊາຂຽວຄຸນນະພາບ ຕັດບາງໆ ກິນກັບວາຊາບິ.', 'image' => 'https://images.unsplash.com/photo-1580959375944-3a17d1e33487?auto=format&fit=crop&w=800&q=80'],
            ],
            'Sushi' => [
                ['name' => 'ຊູຊິໄຂ່', 'name_en' => 'Tamago Sushi', 'description' => 'ໄຂ່ລວມກັບຂ້າວຫອມ ຮູບແບບຄລາສສິກ.', 'image' => 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=800&q=80'],
                ['name' => 'ຊູຊິປາແຊວມອນ', 'name_en' => 'Salmon Sushi', 'description' => 'ປາແຊວມອນ ແລະ ຂ້າວສົດ.', 'image' => 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80'],
                ['name' => 'ມາກິໂຣລ', 'name_en' => 'California Maki', 'description' => 'ປາແຊວມອນຫອມ ຫວານນຸ່ມ.', 'image' => 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80'],
                ['name' => 'ເທມຸລະ', 'name_en' => 'Tuna Roll', 'description' => 'ປາແຊວມອນ ຫວານ ແລະ ຂຽວ.', 'image' => 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80'],
                ['name' => 'ໄຂ່ຫວານແຊວມອນ', 'name_en' => 'Salmon Roe', 'description' => 'ໄຂ່ຫວານກັບແຊວມອນ ກິນລື່ນ.', 'image' => 'https://images.unsplash.com/photo-1617196038435-bb4cb4f90f56?auto=format&fit=crop&w=800&q=80'],
            ],
            'Drinks' => [
                ['name' => 'ຊາເຂົ້າຫອມ', 'name_en' => 'Jasmine Tea', 'description' => 'ຊາເຂົ້າຫອມເຢັນ ຫວານພໍດີ.', 'image' => 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80'],
                ['name' => 'ນ້ຳແຕງຄັ້ນ', 'name_en' => 'Orange Juice', 'description' => 'ແຕງສົດຄັ້ນ ວິຕາມິນສູງ.', 'image' => 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80'],
                ['name' => 'ນ້ຳໝາກໂມ', 'name_en' => 'Watermelon Juice', 'description' => 'ໝາກໂມເຢັນ ສົດຊື່ນ.', 'image' => 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=800&q=80'],
                ['name' => 'ໂຄລາເຢັນ', 'name_en' => 'Iced Cola', 'description' => 'ໂຄລາຫວານເຢັນ ກິນກັບອາຫານ.', 'image' => 'https://images.unsplash.com/photo-1554866585-cd94860845b7?auto=format&fit=crop&w=800&q=80'],
                ['name' => 'ກາເຟເຢັນ', 'name_en' => 'Iced Coffee', 'description' => 'ກາເຟຄັ້ນເຢັນ ຫອມເຂັ້ມ.', 'image' => 'https://images.unsplash.com/photo-1461023058943-07fc16bf34d8?auto=format&fit=crop&w=800&q=80'],
            ],
            'Dessert' => [
                ['name' => 'ໄອຕິມວານິລາ', 'name_en' => 'Vanilla Ice Cream', 'description' => 'ວານິລາຫວານນຸ່ມ ຫອມຫວານ.', 'image' => 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80'],
                ['name' => 'ເຄັກໝາກມ່ວງ', 'name_en' => 'Mango Cake', 'description' => 'ໝາກມ່ວງສຸກ ກັບເຄັກຊັ້ນນຸ່ມ.', 'image' => 'https://images.unsplash.com/photo-1505253149613-112d21d9fcca?auto=format&fit=crop&w=800&q=80'],
                ['name' => 'ມູສເຊັກໂຊໂຄແລັດ', 'name_en' => 'Chocolate Mousse', 'description' => 'ຊັກໂຊແລັດນຸ່ມ ຫວານພໍດີ.', 'image' => 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80'],
                ['name' => 'ຂ້າວເຫນັດມະມ່ວງ', 'name_en' => 'Mango Sticky Rice', 'description' => 'ຂ້າວເຫນັດຫວານ ກັບມະມ່ວງສຸກ.', 'image' => 'https://images.unsplash.com/photo-1514516340757-237d1a4e5d9f?auto=format&fit=crop&w=800&q=80'],
                ['name' => 'ໄຊເຄິກໝາກໄມ້', 'name_en' => 'Fruit Parfait', 'description' => 'ໝາກໄມ້ສົດ ກັບຄຣີມເບົາ.', 'image' => 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=800&q=80'],
            ],
        ];

        foreach ($definitions as $categoryName => $items) {
            $category = $cat($categoryName);
            if ($category === null) {
                continue;
            }

            foreach ($items as $item) {
                Menu::query()->updateOrCreate(
                    [
                        'category_id' => $category->id,
                        'name' => $item['name'],
                    ],
                    [
                        'name_en' => $item['name_en'],
                        'description' => $item['description'],
                        'image' => $item['image'],
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
