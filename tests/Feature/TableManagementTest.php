<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\BuffetTier;
use App\Models\Customer;
use App\Models\Staff;
use App\Models\Table;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TableManagementTest extends TestCase
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

    public function test_manager_can_view_tables_section_with_rows(): void
    {
        $manager = $this->manager();
        Table::query()->create([
            'table_no' => 'T-001',
            'capacity' => 4,
            'zone' => 'standard',
            'status' => 'available',
        ]);

        $this->actingAs($manager, 'staff');

        $this->get(route('admin.master-data', ['section' => 'tables'], absolute: false))
            ->assertOk()
            ->assertInertia(fn ($p) => $p
                ->component('Admin/MasterData')
                ->where('section', 'tables')
                ->has('tables', 1)
                ->where('tables.0.table_no', 'T-001')
                ->where('tables.0.capacity', 4)
                ->where('tables.0.zone', 'standard')
                ->where('tables.0.status', 'available'));
    }

    public function test_manager_can_create_table(): void
    {
        $manager = $this->manager();
        $this->actingAs($manager, 'staff');

        $this->post(route('admin.tables.store', absolute: false), [
            'table_no' => 'T-002',
            'capacity' => 6,
            'zone' => 'vip',
            'status' => 'maintenance',
        ])->assertRedirect(route('admin.master-data', ['section' => 'tables'], absolute: false));

        $this->assertDatabaseHas('tables', [
            'table_no' => 'T-002',
            'capacity' => 6,
            'zone' => 'vip',
            'status' => 'maintenance',
        ]);
    }

    public function test_manager_can_update_table(): void
    {
        $manager = $this->manager();
        $table = Table::query()->create([
            'table_no' => 'T-003',
            'capacity' => 2,
            'zone' => 'standard',
            'status' => 'available',
        ]);

        $this->actingAs($manager, 'staff');

        $this->patch(route('admin.tables.update', $table, absolute: false), [
            'table_no' => 'T-003A',
            'capacity' => 8,
            'zone' => 'vip',
            'status' => 'occupied',
        ])->assertRedirect(route('admin.master-data', ['section' => 'tables'], absolute: false));

        $table->refresh();
        $this->assertSame('T-003A', $table->table_no);
        $this->assertSame(8, $table->capacity);
        $this->assertSame('vip', $table->zone);
        $this->assertSame('occupied', $table->status);
    }

    public function test_cannot_delete_table_when_service_detail_exists(): void
    {
        $manager = $this->manager();
        $table = Table::query()->create([
            'table_no' => 'T-004',
            'capacity' => 4,
            'zone' => 'standard',
            'status' => 'occupied',
        ]);

        $customer = Customer::query()->create([
            'phone' => '02055111222',
            'name' => 'Customer',
            'password' => 'password',
        ]);

        $tier = BuffetTier::query()->create([
            'tier_name' => 'Silver',
            'price' => 99000,
            'image' => null,
            'description' => null,
        ]);

        $booking = Booking::query()->create([
            'customer_id' => $customer->id,
            'customer_name' => 'Customer',
            'phone' => $customer->phone,
            'tier_id' => $tier->id,
            'table_id' => $table->id,
            'queue_no' => 'Q001',
            'queue_day' => now()->toDateString(),
            'guest_count' => 2,
            'expected_time' => now(),
            'status' => 'called',
            'skip_count' => 0,
        ]);

        $serviceId = DB::table('services')->insertGetId([
            'booking_id' => $booking->id,
            'start_time' => now(),
            'end_time' => null,
            'status' => 'in_service',
            'service_code' => 'SV00000001',
        ]);

        DB::table('service_detail')->insert([
            'service_id' => $serviceId,
            'table_id' => $table->id,
        ]);

        $this->actingAs($manager, 'staff');

        $this->delete(route('admin.tables.destroy', $table, absolute: false))
            ->assertSessionHasErrors('table');

        $this->assertDatabaseHas('tables', ['id' => $table->id]);
    }
}
