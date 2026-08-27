<?php

namespace Database\Seeders;

use App\Models\News;
use App\Models\Staff;
use Illuminate\Database\Seeder;

class NewsSeeder extends Seeder
{
    public function run(): void
    {
        $staffId = Staff::query()->orderBy('id')->value('id');
        if ($staffId === null) {
            $this->command?->warn('NewsSeeder: ບໍ່ພົບພະນັກງານ — ກະລຸນາແລ່ນ StaffSeeder ກ່ອນ.');

            return;
        }

        $rows = [
            [
                'title' => 'ໂປຣໂມຊັ່ນບຸບເຟ່ ຄືນນີ້ລາຄາພິເສດ',
                'content' => <<<'LAO'
ສະບາຍດີລູກຄ້າທຸກທ່ານ!

ໃນເດືອນນີ້ OSHINEI ມີໂປຣໂມຊັ່ນບຸບເຟ່ພິເສດ ສຳລັບທ່ານທີ່ມາຮັບປະທານກັບຄອບຄົວ ແລະ ໝູ່ເພື່ອນ.

ລາຍລະອຽດ ແລະ ເງື່ອນໄຂການຮັບປະທານຈະແຈ້ງໃຫ້ຊາບທີ່ຮ້ານ ຫຼື ສອບຖາມພະນັກງານຕ້ອນຮັບ.

ຂອບໃຈທີ່ໃຫ້ຄວາມໄວ້ວາງໃຈ OSHINEI ສະເໝີ.
LAO,
                'published_at' => now()->subDays(1),
            ],
            [
                'title' => 'ແຈ້ງປິດຮ້ານວັນບຸນຊ່ວງເຮັ້ຍ',
                'content' => <<<'LAO'
ແຈ້ງການສຳຄັນ

ຮ້ານ OSHINEI ຈະປິດໃຫ້ບໍລິການຊົ່ວຄາວໃນວັນບຸນຊ່ວງເຮັ້ຍ ເພື່ອໃຫ້ພະນັກງານໄດ້ພັກຜ່ອນກັບຄອບຄົວ.

ກະລຸນາກວດເບິ່ງກຳນົດເປີດ-ປິດລ່າສຸດໃນແອັບ ຫຼື ໂທຫາຮ້ານກ່ອນມາເພື່ອບໍ່ໃຫ້ພາດການຈອງຄິວ.

ຂອບໃຈທີ່ເຂົ້າໃຈ.
LAO,
                'published_at' => now()->subDays(3),
            ],
            [
                'title' => 'ເມນູໃໝ່ ສະເພາະເດືອນນີ້',
                'content' => <<<'LAO'
ພວກເຮົາເພີ່ມເມນູພິເສດໃໝ່ໃນບຸບເຟ່ແລ້ວ!

ມີທັງຊູຊິ, ຊາຊິມິ, ແລະ ຂອງຫວານຄັດເລືອກຈາກກຸ່ມເຊຟ — ລອງຊິມແລ້ວຈະຮັກແນ່ນອນ.

ປະລິມານຈຳກັດຕາມວັນຕາມຊຸດວັດຖຸດິບ; ຖ້າມີຄຳຖາມຕິດຕໍ່ພະນັກງານໃນຮ້ານໄດ້ເລີຍ.

ຍິນດີຕ້ອນຮັບທຸກທ່ານ!
LAO,
                'published_at' => now()->subDays(5),
            ],
            [
                'title' => 'ສ່ວນຫຼຸດກຸ່ມ 4 ຄົນຂຶ້ນໄປ',
                'content' => <<<'LAO'
ໂປຣໂມຊັ່ນສຳລັບກຸ່ມໃຫຍ່

ເມື່ອມາກິນບຸບເຟ່ກັນບໍ່ຕ່ຳກວ່າ 4 ທ່ານໃນບິນດຽວກັນ ອາດມີສ່ວນຫຼຸດພິເສດຕາມເງື່ອນໄຂທີ່ຮ້ານກຳນົດ.

ກະລຸນາແຈ້ງຈຳນວນຄົນຕອນຈອງຄິວ ຫຼື ຕອນເຂົ້າຮ້ານເພື່ອໃຫ້ພວກເຮົາຈັດຕາຕະລາງໂຕະໃຫ້ເໝາະສົມ.

ຂອບໃຈທີ່ສະໜັບສະໜູນ OSHINEI.
LAO,
                'published_at' => now()->subDays(7),
            ],
            [
                'title' => 'ອັບເດດກົດຈອງຄິວແບບໃໝ່',
                'content' => <<<'LAO'
ເພື່ອຄວາມເປັນລະບຽບຮຽບຮ້ອຍໃນຊ່ວງຄົນຫຼາຍ ພວກເຮົາປັບກົດລະບຽບການຈອງຄິວເລັກນ້ອຍ:

• ກະລຸນາມາຕົງເວລາທີ່ຈອງໄວ້
• ຖ້າຊັກຊ້າ ກະລຸນາແຈ້ງຮ້ານລ່ວງໜ້າ
• ການຍົກເລີກອາດມີເງື່ອນໄຂຕາມນະໂຍບາຍຂອງຮ້ານ

ລາຍລະອຽດເຕັມຖາມພະນັກງານຕ້ອນຮັບໄດ້ທຸກເວລາ.

ຂອບໃຈທີ່ໃຊ້ບໍລິການ.
LAO,
                'published_at' => now()->subDays(10),
            ],
        ];

        foreach ($rows as $row) {
            News::query()->create([
                'staff_id' => $staffId,
                'title' => $row['title'],
                'content' => trim($row['content']),
                'image' => null,
                'status' => 'published',
                'published_at' => $row['published_at'],
            ]);
        }

        $extra = [
            [
                'title' => 'Draft: ກຳລັງກະກຽມປະກາດໃໝ່',
                'content' => 'ນີ້ແມ່ນຂ່າວຮ່າງສຳລັບທົດສອບ — ຍັງບໍ່ເຜີຍແຜ່.',
                'status' => 'draft',
                'published_at' => null,
            ],
            [
                'title' => 'Expired: ໂປຣເກົ່າສິ້ນສຸດແລ້ວ',
                'content' => 'ໂປຣໂມຊັ່ນນີ້ໝົດອາຍຸແລ້ວ; ກວດເບິ່ງໂປຣໃໝ່ທີ່ໜ້າຂ່າວ.',
                'status' => 'expired',
                'published_at' => now()->subMonths(4),
            ],
            [
                'title' => 'Scheduled: ເປີດຮັບຈອງວັນທີ່ຫນ້າ',
                'content' => 'ຂ່າວນີ້ມີວັນເຜີຍແຜ່ເປັນອະນາຄົດເພື່ອທົດສອບປະຕິທິນ.',
                'status' => 'published',
                'published_at' => now()->addWeeks(3),
            ],
        ];

        foreach ($extra as $row) {
            News::query()->create([
                'staff_id' => $staffId,
                'title' => $row['title'],
                'content' => $row['content'],
                'image' => null,
                'status' => $row['status'],
                'published_at' => $row['published_at'],
            ]);
        }
    }
}
