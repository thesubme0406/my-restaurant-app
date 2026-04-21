<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('payments')->truncate();
        DB::table('service_detail')->truncate();
        DB::table('services')->truncate();
        DB::table('bookings')->truncate();
        DB::table('ingredients')->truncate();
        DB::table('buffet_tiers')->truncate();
        DB::table('tables')->truncate();
        DB::table('customers')->truncate();
        DB::table('staffs')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $this->call([
            StaffSeeder::class,
            BuffetTierSeeder::class,
            TableSeeder::class,
            IngredientSeeder::class,
            CustomerSeeder::class,
            BookingSeeder::class,
            ServiceSeeder::class,
            PaymentSeeder::class,
        ]);
    }
}
