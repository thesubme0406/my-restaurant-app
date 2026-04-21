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

class FoodMenuManagementTest extends TestCase
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

    private function lineStaff(): Staff
    {
        return Staff::query()->create([
            'name' => 'Line',
            'surname' => 'Staff',
            'username' => 'line_'.substr(uniqid(), -8),
            'password' => Hash::make('password'),
            'role' => 'staff',
            'phone' => '02066'.(string) random_int(100000, 999999),
        ]);
    }

    public function test_manager_can_view_food_menu_section(): void
    {
        $manager = $this->manager();
        $cat = MenuCatg::query()->create(['catg_name' => 'ເມນູສະເຕັກ', 'image' => null]);
        Menu::query()->create([
            'category_id' => $cat->id,
            'name' => 'ສະເຕັກໄກ່',
            'description' => 'Test',
            'image' => null,
            'is_active' => true,
        ]);

        $this->actingAs($manager, 'staff');

        $this->get(route('admin.master-data', ['section' => 'food_menu'], absolute: false))
            ->assertOk()
            ->assertInertia(fn ($p) => $p
                ->component('Admin/MasterData')
                ->where('section', 'food_menu')
                ->has('foodMenus', 1)
                ->has('foodMenuCategories', 1)
                ->where('foodMenus.0.name', 'ສະເຕັກໄກ່')
                ->where('foodMenus.0.image_url', null));
    }

    public function test_non_manager_cannot_create_menu(): void
    {
        Storage::fake('public');
        $staff = $this->lineStaff();
        $cat = MenuCatg::query()->create(['catg_name' => 'Cat', 'image' => null]);

        $this->actingAs($staff, 'staff');

        $file = UploadedFile::fake()->image('m.jpg', 80, 80);

        $this->post(route('admin.menus.store', absolute: false), [
            'category_id' => $cat->id,
            'name' => 'Item',
            'description' => null,
            'image' => $file,
            'is_active' => true,
        ])->assertForbidden();
    }

    public function test_manager_can_create_menu_with_image(): void
    {
        Storage::fake('public');
        $manager = $this->manager();
        $cat = MenuCatg::query()->create(['catg_name' => 'Cat', 'image' => null]);

        $this->actingAs($manager, 'staff');

        $file = UploadedFile::fake()->image('m.jpg', 80, 80);

        $this->post(route('admin.menus.store', absolute: false), [
            'category_id' => $cat->id,
            'name' => 'Item',
            'description' => 'Desc',
            'image' => $file,
            'is_active' => '1',
        ])->assertRedirect(route('admin.master-data', ['section' => 'food_menu'], absolute: false));

        $this->assertDatabaseHas('menus', [
            'category_id' => $cat->id,
            'name' => 'Item',
            'is_active' => 1,
        ]);

        $menu = Menu::query()->where('name', 'Item')->first();
        $this->assertNotNull($menu->image);
        Storage::disk('public')->assertExists($menu->image);
    }

    public function test_manager_can_update_menu_including_is_active(): void
    {
        $manager = $this->manager();
        $cat = MenuCatg::query()->create(['catg_name' => 'Cat', 'image' => null]);
        $menu = Menu::query()->create([
            'category_id' => $cat->id,
            'name' => 'Old',
            'description' => null,
            'image' => null,
            'is_active' => true,
        ]);

        $this->actingAs($manager, 'staff');

        $this->post(route('admin.menus.update', $menu, absolute: false), [
            'category_id' => $cat->id,
            'name' => 'New',
            'description' => 'X',
            'is_active' => '0',
        ])->assertRedirect(route('admin.master-data', ['section' => 'food_menu'], absolute: false));

        $menu->refresh();
        $this->assertSame('New', $menu->name);
        $this->assertFalse($menu->is_active);
        $this->assertSame('X', $menu->description);
    }
}
