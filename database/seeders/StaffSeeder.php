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
                'name' => 'Admin',
                'surname' => 'User',
                'username' => 'admin',
                'password' => 'password',
                'role' => 'manager',
                'image' => null,
                'address' => null,
            ]
        );

        Staff::query()->updateOrCreate(
            ['phone' => '02055552222'],
            [
                'name' => 'Restaurant',
                'surname' => 'Manager',
                'username' => 'manager',
                'password' => 'password',
                'role' => 'manager',
                'image' => null,
                'address' => null,
            ]
        );

        Staff::query()->updateOrCreate(
            ['phone' => '02055553333'],
            [
                'name' => 'Front',
                'surname' => 'Staff',
                'username' => 'staff',
                'password' => 'password',
                'role' => 'staff',
                'image' => null,
                'address' => null,
            ]
        );
    }
}
