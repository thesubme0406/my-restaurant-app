<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\BuffetTier;
use App\Models\Customer;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BuffetTierManagementTest extends TestCase
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

    public function test_non_manager_cannot_create_buffet_tier(): void
    {
        Storage::fake('public');
        $staff = $this->lineStaff();
        $this->actingAs($staff, 'staff');

        $file = UploadedFile::fake()->image('tier.jpg', 80, 80);

        $this->post(route('admin.buffet-tiers.store', absolute: false), [
            'tier_name' => 'X',
            'price' => '1',
            'description' => null,
            'image' => $file,
        ])->assertForbidden();
    }

    public function test_manager_can_view_buffet_section_with_rows(): void
    {
        $manager = $this->manager();
        BuffetTier::query()->create([
            'tier_name' => 'Starter',
            'price' => 299000,
            'description' => 'Test',
            'image' => null,
        ]);

        $this->actingAs($manager, 'staff');

        $this->get(route('admin.master-data', ['section' => 'buffet_menu'], absolute: false))
            ->assertOk()
            ->assertInertia(fn ($p) => $p
                ->component('Admin/MasterData')
                ->where('section', 'buffet_menu')
                ->has('buffetTiers', 1)
                ->where('buffetTiers.0.tier_name', 'Starter'));
    }

    public function test_manager_can_create_buffet_tier_with_image(): void
    {
        Storage::fake('public');
        $manager = $this->manager();
        $this->actingAs($manager, 'staff');

        $file = UploadedFile::fake()->image('tier.jpg', 120, 120);

        $this->post(route('admin.buffet-tiers.store', absolute: false), [
            'tier_name' => 'Deluxe',
            'price' => '499000',
            'description' => 'Desc',
            'image' => $file,
        ])->assertRedirect(route('admin.master-data', ['section' => 'buffet_menu'], absolute: false));

        $this->assertDatabaseHas('buffet_tiers', [
            'tier_name' => 'Deluxe',
            'price' => 499000,
        ]);

        $tier = BuffetTier::query()->where('tier_name', 'Deluxe')->first();
        $this->assertNotNull($tier->image);
        Storage::disk('public')->assertExists($tier->image);
    }

    public function test_manager_can_update_buffet_tier(): void
    {
        Storage::fake('public');
        $manager = $this->manager();
        $tier = BuffetTier::query()->create([
            'tier_name' => 'Old',
            'price' => 100000,
            'description' => null,
            'image' => null,
        ]);

        $this->actingAs($manager, 'staff');

        $this->patch(route('admin.buffet-tiers.update', $tier, absolute: false), [
            'tier_name' => 'NewName',
            'price' => 150000,
            'description' => 'Updated',
        ])->assertRedirect(route('admin.master-data', ['section' => 'buffet_menu'], absolute: false));

        $tier->refresh();
        $this->assertSame('NewName', $tier->tier_name);
        $this->assertEquals(150000.0, (float) $tier->price);
        $this->assertSame('Updated', $tier->description);
    }

    public function test_manager_can_delete_buffet_tier_without_bookings(): void
    {
        Storage::fake('public');
        $manager = $this->manager();
        $path = UploadedFile::fake()->image('x.png')->store('buffet-tiers', 'public');
        $tier = BuffetTier::query()->create([
            'tier_name' => 'ToDelete',
            'price' => 100,
            'description' => null,
            'image' => $path,
        ]);

        $this->actingAs($manager, 'staff');

        $this->delete(route('admin.buffet-tiers.destroy', $tier, absolute: false))
            ->assertRedirect(route('admin.master-data', ['section' => 'buffet_menu'], absolute: false));

        $this->assertDatabaseMissing('buffet_tiers', ['id' => $tier->id]);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_cannot_delete_buffet_tier_when_booking_exists(): void
    {
        $manager = $this->manager();
        $tier = BuffetTier::query()->create([
            'tier_name' => 'Locked',
            'price' => 100000,
            'description' => null,
            'image' => null,
        ]);

        $customer = Customer::query()->create([
            'phone' => '02088'.(string) random_int(100000, 999999),
            'name' => 'C',
            'password' => Hash::make('password'),
        ]);

        Booking::query()->create([
            'customer_id' => $customer->id,
            'tier_id' => $tier->id,
            'queue_no' => 'Q99',
            'queue_day' => now()->toDateString(),
            'guest_count' => 2,
            'expected_time' => now(),
            'status' => 'pending',
        ]);

        $this->actingAs($manager, 'staff');

        $this->delete(route('admin.buffet-tiers.destroy', $tier, absolute: false))
            ->assertSessionHasErrors('buffet_tier');

        $this->assertDatabaseHas('buffet_tiers', ['id' => $tier->id]);
    }
}
