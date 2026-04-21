<?php

namespace Tests\Feature;

use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StaffManagementTest extends TestCase
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

    public function test_manager_can_view_master_data_page(): void
    {
        $manager = $this->manager();
        $this->actingAs($manager, 'staff');

        $this->get(route('admin.master-data', absolute: false))
            ->assertOk();
    }

    public function test_non_manager_cannot_view_master_data(): void
    {
        $staff = $this->lineStaff();
        $this->actingAs($staff, 'staff');

        $this->get(route('admin.master-data', absolute: false))
            ->assertForbidden();
    }

    public function test_staff_directory_lookup_by_phone(): void
    {
        $manager = $this->manager();
        $phone = '02055123456';

        Staff::query()->create([
            'name' => 'Lookup',
            'surname' => 'Test',
            'username' => 'lu_'.substr(uniqid(), -8),
            'password' => Hash::make('password'),
            'role' => 'staff',
            'phone' => $phone,
        ]);

        $this->actingAs($manager, 'staff');

        $this->getJson(route('queue-dashboard.directory.staff-by-phone', ['phone' => $phone], absolute: false))
            ->assertOk()
            ->assertJson([
                'matched' => true,
                'name' => 'Lookup',
                'surname' => 'Test',
            ]);
    }

    public function test_manager_can_create_staff_member(): void
    {
        $manager = $this->manager();
        $this->actingAs($manager, 'staff');

        $phone = '02088123456';

        $this->post(route('admin.staff.store', absolute: false), [
            'name' => 'New',
            'surname' => 'Hire',
            'username' => 'newhire01',
            'phone' => $phone,
            'password' => 'secretpass',
            'role' => 'staff',
            'address' => null,
        ])->assertRedirect(route('admin.master-data', ['section' => 'staff'], absolute: false));

        $this->assertDatabaseHas('staffs', [
            'name' => 'New',
            'surname' => 'Hire',
            'username' => 'newhire01',
            'phone' => $phone,
            'role' => 'staff',
        ]);
    }

    public function test_manager_can_update_staff_member(): void
    {
        $manager = $this->manager();
        $target = Staff::query()->create([
            'name' => 'Old',
            'surname' => 'Name',
            'username' => 'oldnm01',
            'password' => Hash::make('password'),
            'role' => 'staff',
            'phone' => '02099123456',
        ]);

        $this->actingAs($manager, 'staff');

        $this->patch(route('admin.staff.update', ['staff' => $target->id], absolute: false), [
            'name' => 'Updated',
            'surname' => 'Name',
            'username' => 'oldnm01',
            'phone' => '02099123456',
            'password' => null,
            'role' => 'staff',
            'address' => 'Vientiane',
        ])->assertRedirect(route('admin.master-data', ['section' => 'staff'], absolute: false));

        $this->assertDatabaseHas('staffs', [
            'id' => $target->id,
            'name' => 'Updated',
            'address' => 'Vientiane',
        ]);
    }

    public function test_manager_cannot_delete_own_account(): void
    {
        $manager = $this->manager();
        $this->actingAs($manager, 'staff');

        $this->delete(route('admin.staff.destroy', ['staff' => $manager->id], absolute: false))
            ->assertSessionHasErrors('staff');
    }
}
