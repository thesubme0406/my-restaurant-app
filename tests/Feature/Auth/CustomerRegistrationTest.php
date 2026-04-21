<?php

namespace Tests\Feature\Auth;

use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class CustomerRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $this->get('/register')->assertOk();
    }

    public function test_customer_can_register_and_is_redirected_to_dashboard(): void
    {
        $response = $this->post('/register', [
            'name' => 'New Customer',
            'phone' => '02012349999',
            'password' => 'SecurePass1!',
            'password_confirmation' => 'SecurePass1!',
        ]);

        $this->assertDatabaseHas('customers', [
            'phone' => '02012349999',
            'name' => 'New Customer',
        ]);

        $this->assertAuthenticated('customer');
        $this->assertSame('02012349999', Auth::guard('customer')->user()->phone);

        $response->assertRedirect(route('dashboard'));
    }

    public function test_registration_rejects_duplicate_phone(): void
    {
        Customer::query()->create([
            'name' => 'Existing',
            'phone' => '02099998888',
            'password' => 'SecurePass1!',
        ]);

        $this->post('/register', [
            'name' => 'Another',
            'phone' => '02099998888',
            'password' => 'SecurePass1!',
            'password_confirmation' => 'SecurePass1!',
        ])->assertSessionHasErrors('phone');

        $this->assertGuest('customer');
    }
}
