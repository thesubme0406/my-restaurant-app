<?php

namespace Tests\Feature;

use App\Models\BuffetTier;
use App\Models\Customer;
use App\Models\Menu;
use App\Models\MenuCatg;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BuffetTierMenuBindingTest extends TestCase
{
    use RefreshDatabase;

    private function manager(): Staff
    {
        return Staff::query()->create([
            'name' => 'Mgr',
            'surname' => 'One',
            'username' => 'mgr_'.substr(uniqid(), -8),
            'password' => Hash::make('password'),
            'role' => 'manager',
            'phone' => '02077'.(string) random_int(100000, 999999),
        ]);
    }

    public function test_manager_can_view_tier_menu_binding_section(): void
    {
        $manager = $this->manager();
        $tier = BuffetTier::query()->create([
            'tier_name' => 'Deluxe',
            'price' => 460000,
            'description' => 'Deluxe',
            'image' => null,
        ]);
        $cat = MenuCatg::query()->create(['catg_name' => 'Cat', 'image' => null]);
        $menu = Menu::query()->create([
            'category_id' => $cat->id,
            'name' => 'Sashimi Set',
            'description' => 'Fresh',
            'image' => null,
            'is_active' => true,
        ]);
        DB::table('menu_detail')->insert([
            'buffet_tier_id' => $tier->id,
            'menu_id' => $menu->id,
        ]);

        $this->actingAs($manager, 'staff');

        $this->get(route('admin.master-data', ['section' => 'tier_menu_binding']))
            ->assertOk()
            ->assertInertia(fn ($p) => $p
                ->component('Admin/MasterData')
                ->where('section', 'tier_menu_binding')
                ->has('tierLinkBuffetTiers', 1)
                ->has('tierLinkMenus', 1)
                ->where('tierMenuLinks.'.$tier->id.'.0', $menu->id));
    }

    public function test_manager_can_fetch_menu_ids_for_tier_via_api(): void
    {
        $manager = $this->manager();
        $tier = BuffetTier::query()->create(['tier_name' => 'Gold', 'price' => 399000, 'description' => '', 'image' => null]);
        $cat = MenuCatg::query()->create(['catg_name' => 'Cat', 'image' => null]);
        $m1 = Menu::query()->create(['category_id' => $cat->id, 'name' => 'A', 'description' => null, 'image' => null, 'is_active' => true]);
        $m2 = Menu::query()->create(['category_id' => $cat->id, 'name' => 'B', 'description' => null, 'image' => null, 'is_active' => true]);
        $tier->menus()->sync([$m2->id, $m1->id]);

        $this->actingAs($manager, 'staff');

        $this->getJson(route('admin.buffet-tier-menus.show', $tier))
            ->assertOk()
            ->assertJson([
                'menu_ids' => [$m1->id, $m2->id],
            ]);
    }

    public function test_manager_can_sync_tier_menu_binding(): void
    {
        $manager = $this->manager();
        $silver = BuffetTier::query()->create(['tier_name' => 'Silver', 'price' => 299000, 'description' => '', 'image' => null]);
        BuffetTier::query()->create(['tier_name' => 'Gold', 'price' => 399000, 'description' => '', 'image' => null]);
        $cat = MenuCatg::query()->create(['catg_name' => 'Cat', 'image' => null]);
        $m1 = Menu::query()->create(['category_id' => $cat->id, 'name' => 'A', 'description' => null, 'image' => null, 'is_active' => true]);
        $m2 = Menu::query()->create(['category_id' => $cat->id, 'name' => 'B', 'description' => null, 'image' => null, 'is_active' => true]);

        $this->actingAs($manager, 'staff');

        $this->from(route('admin.master-data', ['section' => 'tier_menu_binding']));
        $this->put(route('admin.buffet-tier-menus.sync', $silver), [
            'menu_ids' => [$m1->id, $m2->id],
        ])->assertRedirect(route('admin.master-data', ['section' => 'tier_menu_binding', 'tier_id' => $silver->id]));

        $this->assertDatabaseHas('menu_detail', ['buffet_tier_id' => $silver->id, 'menu_id' => $m1->id]);
        $this->assertDatabaseHas('menu_detail', ['buffet_tier_id' => $silver->id, 'menu_id' => $m2->id]);
        $this->assertSame(2, (int) DB::table('menu_detail')->where('buffet_tier_id', $silver->id)->count());
    }

    public function test_customer_home_shows_only_active_menus_linked_to_each_tier(): void
    {
        $silver = BuffetTier::query()->create(['tier_name' => 'Silver', 'price' => 299000, 'description' => '', 'image' => null]);
        $gold = BuffetTier::query()->create(['tier_name' => 'Gold', 'price' => 399000, 'description' => '', 'image' => null]);
        $cat = MenuCatg::query()->create(['catg_name' => 'Cat', 'image' => null]);
        $onlySilver = Menu::query()->create(['category_id' => $cat->id, 'name' => 'Silver Dish', 'description' => null, 'image' => null, 'is_active' => true]);
        $onlyGold = Menu::query()->create(['category_id' => $cat->id, 'name' => 'Gold Dish', 'description' => null, 'image' => null, 'is_active' => true]);
        $inactive = Menu::query()->create(['category_id' => $cat->id, 'name' => 'Hidden', 'description' => null, 'image' => null, 'is_active' => false]);
        $silver->menus()->sync([$onlySilver->id, $inactive->id]);
        $gold->menus()->sync([$onlyGold->id]);

        $customer = Customer::query()->create([
            'name' => 'Pat',
            'phone' => '02055551111',
            'password' => Hash::make('password'),
        ]);
        $this->actingAs($customer, 'customer');

        $this->get(route('customer.home'))
            ->assertOk()
            ->assertInertia(fn ($p) => $p
                ->component('Customer/Home')
                ->has('buffetTiersWithMenus', 2)
                ->where('buffetTiersWithMenus.0.tier_name', 'Silver')
                ->has('buffetTiersWithMenus.0.menus', 1)
                ->where('buffetTiersWithMenus.0.menus.0.name', 'Silver Dish')
                ->where('buffetTiersWithMenus.1.tier_name', 'Gold')
                ->has('buffetTiersWithMenus.1.menus', 1)
                ->where('buffetTiersWithMenus.1.menus.0.name', 'Gold Dish'));
    }
}
