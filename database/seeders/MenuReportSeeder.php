<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MenuReportSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'ອາຫານ',
            'ເຄື່ອງດື່ມ',
            'ເມນູສະເຕັກ',
            'ຂອງຫວານ',
            'ຊູຊິ',
        ];

        $categoryIdsByName = [];
        foreach ($categories as $categoryName) {
            DB::table('menu_catg')->updateOrInsert(
                ['catg_name' => $categoryName],
                ['image' => 'https://via.placeholder.com/150']
            );

            $categoryIdsByName[$categoryName] = (int) DB::table('menu_catg')
                ->where('catg_name', $categoryName)
                ->value('id');
        }

        $menuCategoryColumn = Schema::hasColumn('menus', 'category_id') ? 'category_id' : 'catg_id';

        $menuRows = [
            ['name' => 'ເຂົ້າຜັດໄຂ່', 'description' => 'ເຂົ້າຜັດຫອມໆ', 'category' => 'ອາຫານ', 'is_active' => true],
            ['name' => 'ເຂົ້າໜ້າຊີ້ນ', 'description' => 'ເຂົ້າຮ້ອນພ້ອມຊີ້ນປຸງລົດ', 'category' => 'ອາຫານ', 'is_active' => true],
            ['name' => 'ເຝີງົວ', 'description' => 'ນ້ຳຊຸບຫອມກົມກ່ອມ', 'category' => 'ອາຫານ', 'is_active' => false],
            ['name' => 'ໄກ່ທອດກະທຽມ', 'description' => 'ໄກ່ກອບນອກນຸ່ມໃນ', 'category' => 'ອາຫານ', 'is_active' => true],
            ['name' => 'ຜັດກະເພົາໝູ', 'description' => 'ເຜັດນ້ອຍ ກິນງ່າຍ', 'category' => 'ອາຫານ', 'is_active' => false],

            ['name' => 'ຊາຂຽວມັດຊະ', 'description' => 'ຊາຂຽວເຂັ້ມຂົ້ນ', 'category' => 'ເຄື່ອງດື່ມ', 'is_active' => true],
            ['name' => 'ກາເຟເຢັນ', 'description' => 'ຫອມກາເຟຄົບລົດ', 'category' => 'ເຄື່ອງດື່ມ', 'is_active' => true],
            ['name' => 'ນ້ຳສົ້ມສົດ', 'description' => 'ຄັ້ນໃໝ່ທຸກແກ້ວ', 'category' => 'ເຄື່ອງດື່ມ', 'is_active' => false],
            ['name' => 'ນ້ຳໝາກໂມປັ່ນ', 'description' => 'ເຢັນຊື່ນໃຈ', 'category' => 'ເຄື່ອງດື່ມ', 'is_active' => true],
            ['name' => 'ຊານົມໄຂ່ມຸກ', 'description' => 'ຫວານມັນກຳລັງດີ', 'category' => 'ເຄື່ອງດື່ມ', 'is_active' => false],

            ['name' => 'ສະເຕັກໄກ່', 'description' => 'ຊີ້ນໄກ່ນຸ່ມຊຸ່ມ', 'category' => 'ເມນູສະເຕັກ', 'is_active' => true],
            ['name' => 'ສະເຕັກໝູພິກໄທດຳ', 'description' => 'ຊອດພິກໄທຫອມໆ', 'category' => 'ເມນູສະເຕັກ', 'is_active' => true],
            ['name' => 'ສະເຕັກປາແຊວມອນ', 'description' => 'ປານຸ່ມ ກິ່ນຫອມ', 'category' => 'ເມນູສະເຕັກ', 'is_active' => false],
            ['name' => 'ສະເຕັກງົວນ້ຳຈິ້ມພິເສດ', 'description' => 'ຊີ້ນແນ່ນ ນ້ຳຈິ້ມເດັດ', 'category' => 'ເມນູສະເຕັກ', 'is_active' => true],
            ['name' => 'ສະເຕັກຊີສ', 'description' => 'ເພີ່ມຊີສເຂັ້ມຂົ້ນ', 'category' => 'ເມນູສະເຕັກ', 'is_active' => false],

            ['name' => 'ໄອສະຄຣີມວານິລາ', 'description' => 'ຫອມຫວານນຸ່ມລະມຸນ', 'category' => 'ຂອງຫວານ', 'is_active' => true],
            ['name' => 'ເຄັກຊັອກໂກແລັດ', 'description' => 'ເນື້ອນຸ່ມລະລາຍ', 'category' => 'ຂອງຫວານ', 'is_active' => true],
            ['name' => 'ບິງຊູໝາກມ່ວງ', 'description' => 'ນ້ຳກ້ອນນົມເຢັນ', 'category' => 'ຂອງຫວານ', 'is_active' => false],
            ['name' => 'ພຸດດິ້ງນົມສົດ', 'description' => 'ນຸ່ມຫວານກຳລັງດີ', 'category' => 'ຂອງຫວານ', 'is_active' => true],
            ['name' => 'ຄຸກກີ້ຊັອກຊິບ', 'description' => 'ກອບນອກນຸ່ມໃນ', 'category' => 'ຂອງຫວານ', 'is_active' => false],

            ['name' => 'ແຊວມອນຊາຊິມິ', 'description' => 'ປາສົດຊິ້ນໜາ', 'category' => 'ຊູຊິ', 'is_active' => true],
            ['name' => 'ຊູຊິປູອັດ', 'description' => 'ຊູຊິຄຳພອດດີ', 'category' => 'ຊູຊິ', 'is_active' => true],
            ['name' => 'ມາກິທູນ່າ', 'description' => 'ຂ້າວແນ່ນ ທູນ່າຫອມ', 'category' => 'ຊູຊິ', 'is_active' => false],
            ['name' => 'ຊູຊິກຸ້ງເທັມປູຣະ', 'description' => 'ກອບນອກນຸ່ມໃນ', 'category' => 'ຊູຊິ', 'is_active' => true],
            ['name' => 'ນິກິຣິໄຂ່ຫວານ', 'description' => 'ຫອມໄຂ່ລະມຸນ', 'category' => 'ຊູຊິ', 'is_active' => false],
        ];

        DB::transaction(function () use ($menuRows, $menuCategoryColumn, $categoryIdsByName): void {
            foreach ($menuRows as $menu) {
                $categoryId = $categoryIdsByName[$menu['category']] ?? null;
                if (! $categoryId) {
                    continue;
                }

                DB::table('menus')->updateOrInsert(
                    ['name' => $menu['name']],
                    [
                        $menuCategoryColumn => $categoryId,
                        'description' => $menu['description'],
                        'image' => 'https://via.placeholder.com/150',
                        'is_active' => $menu['is_active'] ? 1 : 0,
                    ]
                );
            }
        });

        $this->command?->info('MenuReportSeeder seeded categories and 25 menu items for report testing.');
    }
}

