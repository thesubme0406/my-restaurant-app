<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['phone' => '02011110001', 'name' => 'ພອນສະຫວັນ'],
            ['phone' => '02011110002', 'name' => 'ຄຳແພງ'],
            ['phone' => '02011110003', 'name' => 'Anousone'],
            ['phone' => '02011110004', 'name' => 'Sokdy'],
            ['phone' => '02011110005', 'name' => 'ຈັນທະລາ'],
        ];

        foreach ($rows as $row) {
            Customer::query()->updateOrCreate(
                ['phone' => $row['phone']],
                [
                    'name' => $row['name'],
                    'password' => 'password',
                ]
            );
        }
    }
}
