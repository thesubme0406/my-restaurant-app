<?php

namespace Tests\Feature;

use App\Models\Menu;
use App\Models\MenuCatg;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FoodCategoryManagementTest extends TestCase
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

    public function test_manager_can_view_food_categories_section(): void
    {
        $manager = $this->manager();
        MenuCatg::query()->create(['catg_name' => 'ເມນູຊາຊິມິ', 'image' => null]);

        $this->actingAs($manager, 'staff');

        $this->get(route('admin.master-data', ['section' => 'food_categories'], absolute: false))
            ->assertOk()
            ->assertInertia(fn ($p) => $p
                ->component('Admin/MasterData')
                ->where('section', 'food_categories')
                ->has('foodCategories', 1)
                ->where('foodCategories.0.catg_name', 'ເມນູຊາຊິມິ'));
    }

    public function test_manager_can_create_category_with_image(): void
    {
        Storage::fake('public');
        $manager = $this->manager();
        $this->actingAs($manager, 'staff');

        $file = UploadedFile::fake()->image('c.jpg', 80, 80);

        $this->post(route('admin.menu-categories.store', absolute: false), [
            'catg_name' => 'SUSHI MENU',
            'image' => $file,
        ])->assertRedirect(route('admin.master-data', ['section' => 'food_categories'], absolute: false));

        $cat = MenuCatg::query()->where('catg_name', 'SUSHI MENU')->first();
        $this->assertNotNull($cat);
        $this->assertNotNull($cat->image);
        Storage::disk('public')->assertExists($cat->image);
    }

    public function test_cannot_delete_category_when_menu_exists(): void
    {
        $manager = $this->manager();
        $cat = MenuCatg::query()->create(['catg_name' => 'Locked', 'image' => null]);
        Menu::query()->create([
            'category_id' => $cat->id,
            'name' => 'Item',
            'description' => null,
            'image' => null,
            'is_active' => true,
        ]);

        $this->actingAs($manager, 'staff');

        $this->delete(route('admin.menu-categories.destroy', $cat, absolute: false))
            ->assertSessionHasErrors('menu_category');
    }
}
