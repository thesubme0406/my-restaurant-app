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
        DB::table('stock_in_details')->truncate();
        DB::table('stock_ins')->truncate();
        DB::table('po_detail')->truncate();
        DB::table('purchase_orders')->truncate();
        DB::table('usage_detail')->truncate();
        DB::table('stock_usage')->truncate();
        DB::table('suppliers')->truncate();
        DB::table('buffet_tier_menu')->truncate();
        DB::table('menu_detail')->truncate();
        DB::table('menus')->truncate();
        DB::table('menu_catg')->truncate();
        DB::table('ingredients')->truncate();
        DB::table('buffet_tiers')->truncate();
        DB::table('tables')->truncate();
        DB::table('customers')->truncate();
        DB::table('activity_logs')->truncate();
        DB::table('news')->truncate();
        DB::table('staffs')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $this->call([
            StaffSeeder::class,
            BuffetMenuCatalogSeeder::class,
            TableSeeder::class,
            IngredientSeeder::class,
            SupplierSeeder::class,
            CustomerSeeder::class,
            ReportTestDataSeeder::class,
            NewsSeeder::class,
            OshineiDemoExtrasSeeder::class,
        ]);

        $this->printDemoCredentials();
    }

    private function printDemoCredentials(): void
    {
        $this->command?->newLine();
        $this->command?->info('═══════════════════════════════════════════════════════');
        $this->command?->info('  OSHINEI demo data ready — login credentials');
        $this->command?->info('═══════════════════════════════════════════════════════');
        $this->command?->line('  Staff (admin):  02055551111 / password  → /admin/login');
        $this->command?->line('  Staff (mgr):    02055552222 / password');
        $this->command?->line('  Staff:          02055553333 / password');
        $this->command?->line('  Customer:       02011110001 / password  → /login');
        $this->command?->newLine();
        $this->command?->line('  Run once if images 404:  php artisan storage:link');
        $this->command?->info('═══════════════════════════════════════════════════════');
    }
}
