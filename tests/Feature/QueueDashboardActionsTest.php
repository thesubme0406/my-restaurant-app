<?php

namespace Tests\Feature;

use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class QueueDashboardActionsTest extends TestCase
{
    use RefreshDatabase;

    private function actingStaff(): Staff
    {
        return Staff::query()->create([
            'name' => 'Test',
            'surname' => 'Staff',
            'username' => 'qdst_'.substr(uniqid(), -8),
            'password' => Hash::make('password'),
            'role' => 'staff',
            'phone' => '02099'.(string) random_int(100000, 999999),
        ]);
    }

    /**
     * @return array{tier_id: int, table_id: int, customer_id: int}
     */
    private function seedTierTableCustomer(): array
    {
        $tierId = (int) DB::table('buffet_tiers')->insertGetId([
            'tier_name' => 'Test Tier',
            'price' => 100000,
            'description' => null,
            'image' => null,
        ]);

        $tableId = (int) DB::table('tables')->insertGetId([
            'table_no' => 'T99',
            'capacity' => 4,
            'zone' => 'standard',
            'status' => 'available',
        ]);

        $customerId = (int) DB::table('customers')->insertGetId([
            'phone' => '02088'.(string) random_int(100000, 999999),
            'name' => 'Queue Customer',
            'password' => Hash::make('password'),
        ]);

        return [
            'tier_id' => $tierId,
            'table_id' => $tableId,
            'customer_id' => $customerId,
        ];
    }

    public function test_staff_can_add_queue_entry(): void
    {
        $staff = $this->actingStaff();
        $ids = $this->seedTierTableCustomer();

        $this->actingAs($staff, 'staff');

        $response = $this->post(route('queue-dashboard.queues.store', absolute: false), [
            'customer_name' => 'ສົມສີ',
            'phone' => '02012345678',
            'guest_count' => 4,
            'tier_id' => $ids['tier_id'],
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'tier_id' => $ids['tier_id'],
            'guest_count' => 4,
            'status' => 'waiting',
            'table_id' => null,
            'customer_id' => null,
            'customer_name' => 'ສົມສີ',
            'phone' => '02012345678',
            'skip_count' => 0,
        ]);

        $booking = DB::table('bookings')->where('phone', '02012345678')->first();
        $this->assertNotNull($booking);
        $this->assertSame('Q'.str_pad((string) $booking->id, 4, '0', STR_PAD_LEFT), $booking->queue_no);
    }

    public function test_staff_can_skip_waiting_booking(): void
    {
        $staff = $this->actingStaff();
        $ids = $this->seedTierTableCustomer();

        $bookingId = (int) DB::table('bookings')->insertGetId([
            'customer_id' => $ids['customer_id'],
            'tier_id' => $ids['tier_id'],
            'table_id' => null,
            'queue_no' => 'Q0099',
            'guest_count' => 2,
            'expected_time' => now()->addHour(),
            'status' => 'waiting',
            'skip_count' => 0,
        ]);

        $this->actingAs($staff, 'staff');

        $response = $this->post(route('queue-dashboard.queues.skip', ['booking' => $bookingId], absolute: false));

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'status' => 'skipped',
            'skip_count' => 1,
        ]);
    }

    public function test_multiple_skips_remain_skipped_and_increment_count(): void
    {
        $staff = $this->actingStaff();
        $ids = $this->seedTierTableCustomer();

        $bookingId = (int) DB::table('bookings')->insertGetId([
            'customer_id' => $ids['customer_id'],
            'tier_id' => $ids['tier_id'],
            'table_id' => null,
            'queue_no' => 'Q0555',
            'guest_count' => 2,
            'expected_time' => now()->addHour(),
            'status' => 'waiting',
            'skip_count' => 0,
        ]);

        $this->actingAs($staff, 'staff');
        $route = fn () => route('queue-dashboard.queues.skip', ['booking' => $bookingId], absolute: false);

        $this->post($route())->assertRedirect();
        $this->post($route())->assertRedirect();
        $this->post($route())->assertRedirect();
        $this->post($route())->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'status' => 'skipped',
            'skip_count' => 4,
        ]);
    }

    public function test_staff_can_cancel_waiting_booking(): void
    {
        $staff = $this->actingStaff();
        $ids = $this->seedTierTableCustomer();

        $bookingId = (int) DB::table('bookings')->insertGetId([
            'customer_id' => $ids['customer_id'],
            'tier_id' => $ids['tier_id'],
            'table_id' => null,
            'queue_no' => 'Q0088',
            'guest_count' => 2,
            'expected_time' => now()->addHour(),
            'status' => 'waiting',
            'skip_count' => 0,
        ]);

        $this->actingAs($staff, 'staff');

        $response = $this->post(route('queue-dashboard.queues.cancel', ['booking' => $bookingId], absolute: false));

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'status' => 'cancelled',
        ]);
    }

    public function test_staff_can_assign_booking_to_table(): void
    {
        $staff = $this->actingStaff();
        $ids = $this->seedTierTableCustomer();

        $bookingId = (int) DB::table('bookings')->insertGetId([
            'customer_id' => $ids['customer_id'],
            'tier_id' => $ids['tier_id'],
            'table_id' => null,
            'queue_no' => 'Q0077',
            'guest_count' => 2,
            'expected_time' => now()->addHour(),
            'status' => 'waiting',
            'skip_count' => 0,
        ]);

        $this->actingAs($staff, 'staff');

        $response = $this->post(route('queue-dashboard.assignments.store', absolute: false), [
            'booking_id' => $bookingId,
            'table_id' => $ids['table_id'],
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'table_id' => $ids['table_id'],
            'status' => 'called',
        ]);

        $this->assertDatabaseHas('tables', [
            'id' => $ids['table_id'],
            'status' => 'occupied',
        ]);
    }

    public function test_guest_must_be_authenticated_as_staff(): void
    {
        $ids = $this->seedTierTableCustomer();

        $bookingId = (int) DB::table('bookings')->insertGetId([
            'customer_id' => $ids['customer_id'],
            'tier_id' => $ids['tier_id'],
            'table_id' => null,
            'queue_no' => 'Q0066',
            'guest_count' => 2,
            'expected_time' => now()->addHour(),
            'status' => 'waiting',
            'skip_count' => 0,
        ]);

        $this->post(route('queue-dashboard.queues.skip', ['booking' => $bookingId], absolute: false))
            ->assertRedirect(route('login', absolute: false));
    }

    public function test_add_queue_rejects_phone_with_non_digits(): void
    {
        $staff = $this->actingStaff();
        $ids = $this->seedTierTableCustomer();

        $this->actingAs($staff, 'staff');

        $this->post(route('queue-dashboard.queues.store', absolute: false), [
            'customer_name' => 'ສົມສີ',
            'phone' => '02012abc45',
            'guest_count' => 2,
            'tier_id' => $ids['tier_id'],
        ])->assertSessionHasErrors('phone');
    }

    public function test_add_queue_rejects_guest_count_over_twenty(): void
    {
        $staff = $this->actingStaff();
        $ids = $this->seedTierTableCustomer();

        $this->actingAs($staff, 'staff');

        $this->post(route('queue-dashboard.queues.store', absolute: false), [
            'customer_name' => 'ສົມສີ',
            'phone' => '02012345678',
            'guest_count' => 21,
            'tier_id' => $ids['tier_id'],
        ])->assertSessionHasErrors('guest_count');
    }

    public function test_add_queue_rejects_zero_guest_count(): void
    {
        $staff = $this->actingStaff();
        $ids = $this->seedTierTableCustomer();

        $this->actingAs($staff, 'staff');

        $this->post(route('queue-dashboard.queues.store', absolute: false), [
            'customer_name' => 'ສົມສີ',
            'phone' => '02012345678',
            'guest_count' => 0,
            'tier_id' => $ids['tier_id'],
        ])->assertSessionHasErrors('guest_count');
    }

    public function test_assign_rejects_when_group_exceeds_table_capacity(): void
    {
        $staff = $this->actingStaff();
        $ids = $this->seedTierTableCustomer();

        $bookingId = (int) DB::table('bookings')->insertGetId([
            'customer_id' => $ids['customer_id'],
            'tier_id' => $ids['tier_id'],
            'table_id' => null,
            'queue_no' => 'Q0099',
            'guest_count' => 5,
            'expected_time' => now()->addHour(),
            'status' => 'waiting',
            'skip_count' => 0,
        ]);

        $this->actingAs($staff, 'staff');

        $this->post(route('queue-dashboard.assignments.store', absolute: false), [
            'booking_id' => $bookingId,
            'table_id' => $ids['table_id'],
        ])->assertSessionHasErrors('table_id');

        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'table_id' => null,
            'status' => 'waiting',
        ]);
    }

    public function test_staff_can_assign_skipped_booking_to_table(): void
    {
        $staff = $this->actingStaff();
        $ids = $this->seedTierTableCustomer();

        $bookingId = (int) DB::table('bookings')->insertGetId([
            'customer_id' => $ids['customer_id'],
            'tier_id' => $ids['tier_id'],
            'table_id' => null,
            'queue_no' => 'Q0100',
            'guest_count' => 2,
            'expected_time' => now()->addHour(),
            'status' => 'skipped',
            'skip_count' => 1,
        ]);

        $this->actingAs($staff, 'staff');

        $response = $this->post(route('queue-dashboard.assignments.store', absolute: false), [
            'booking_id' => $bookingId,
            'table_id' => $ids['table_id'],
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'table_id' => $ids['table_id'],
            'status' => 'called',
        ]);

        $this->assertDatabaseHas('tables', [
            'id' => $ids['table_id'],
            'status' => 'occupied',
        ]);
    }
}
