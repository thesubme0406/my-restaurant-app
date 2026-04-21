<?php

namespace Database\Seeders;

use App\Models\Staff;
use Illuminate\Database\Seeder;

class StaffSeeder extends Seeder
{
    public function run(): void
    {
        Staff::query()->updateOrCreate(
            ['phone' => '02055551111'],
            [
                'name' => 'ສົມຊາຍ',
                'surname' => 'ພນລະວັນ',
                'username' => 'oshinei_mgr',
                'password' => 'password',
                'role' => 'manager',
                'image' => null,
                'address' => null,
            ]
        );

        Staff::query()->updateOrCreate(
            ['phone' => '02055552222'],
            [
                'name' => 'ຄຳແພງ',
                'surname' => 'ວົງສະຫວັນ',
                'username' => 'oshinei_stf',
                'password' => 'password',
                'role' => 'staff',
                'image' => null,
                'address' => null,
            ]
        );
    }
}
