<?php

namespace Tests\Feature;

use App\Models\BuffetTier;
use App\Models\Customer;
use App\Models\Menu;
use App\Models\MenuCatg;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CustomerMenuPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_view_menu_page_with_tier_categories(): void
    {
        $customer = Customer::query()->create([
            'name' => 'Pat',
            'phone' => '02055552222',
            'password' => Hash::make('password'),
        ]);

        $cat = MenuCatg::query()->create(['catg_name' => 'Sushi', 'image' => null]);
        $tier = BuffetTier::query()->create([
            'tier_name' => 'Silver',
            'price' => 299000,
            'description' => 'ທົດລອງ',
            'image' => null,
        ]);
        $menu = Menu::query()->create([
            'category_id' => $cat->id,
            'name' => 'ຊູຊິທົດລອງ',
            'name_en' => 'Test Sushi',
            'description' => 'desc',
            'image' => null,
            'is_active' => true,
        ]);
        $tier->menus()->sync([$menu->id]);

        $this->actingAs($customer, 'customer');

        $this->get(route('customer.menu'))
            ->assertOk()
            ->assertInertia(fn ($p) => $p
                ->component('Customer/MenuPage')
                ->has('buffetTiers', 1)
                ->where('buffetTiers.0.tier_name', 'Silver')
                ->has('buffetTiers.0.categories', 1)
                ->where('buffetTiers.0.categories.0.category_name', 'Sushi')
                ->has('buffetTiers.0.categories.0.items', 1)
                ->where('buffetTiers.0.categories.0.items.0.name', 'ຊູຊິທົດລອງ')
                ->where('buffetTiers.0.categories.0.items.0.name_en', 'TEST SUSHI'));
    }
}
