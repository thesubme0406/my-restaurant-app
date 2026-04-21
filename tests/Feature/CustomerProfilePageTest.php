<?php

namespace Tests\Feature;

use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CustomerProfilePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_view_profile_page(): void
    {
        $customer = Customer::query()->create([
            'name' => 'Sokdy',
            'phone' => '02011110004',
            'password' => Hash::make('password'),
        ]);

        $this->actingAs($customer, 'customer');

        $this->get(route('customer.profile'))
            ->assertOk()
            ->assertInertia(fn ($p) => $p
                ->component('Customer/CustomerProfilePage')
                ->where('profile.name', 'Sokdy')
                ->where('profile.phone', '02011110004'));
    }

    public function test_customer_can_update_name(): void
    {
        $customer = Customer::query()->create([
            'name' => 'Sokdy',
            'phone' => '02011110004',
            'password' => Hash::make('password'),
        ]);

        $this->actingAs($customer, 'customer');

        $this->patch(route('customer.profile.update'), [
            'name' => 'Sokdy Updated',
            'phone' => '02011110004',
        ])->assertRedirect(route('customer.profile'));

        $this->assertSame('Sokdy Updated', $customer->fresh()->name);
    }

    public function test_password_change_requires_current_password(): void
    {
        $customer = Customer::query()->create([
            'name' => 'Pat',
            'phone' => '02022220002',
            'password' => Hash::make('secret-old'),
        ]);

        $this->actingAs($customer, 'customer');

        $this->from(route('customer.profile'))
            ->patch(route('customer.profile.update'), [
                'name' => 'Pat',
                'phone' => '02022220002',
                'current_password' => 'wrong',
                'password' => 'NewPassword1!',
                'password_confirmation' => 'NewPassword1!',
            ])
            ->assertSessionHasErrors('current_password');

        $this->assertTrue(Hash::check('secret-old', $customer->fresh()->password));
    }

    public function test_customer_can_change_password_with_current_password(): void
    {
        $customer = Customer::query()->create([
            'name' => 'Pat',
            'phone' => '02022220003',
            'password' => Hash::make('secret-old'),
        ]);

        $this->actingAs($customer, 'customer');

        $this->patch(route('customer.profile.update'), [
            'name' => 'Pat',
            'phone' => '02022220003',
            'current_password' => 'secret-old',
            'password' => 'NewPassword1!',
            'password_confirmation' => 'NewPassword1!',
        ])->assertRedirect(route('customer.profile'));

        $this->assertTrue(Hash::check('NewPassword1!', $customer->fresh()->password));
    }
}
