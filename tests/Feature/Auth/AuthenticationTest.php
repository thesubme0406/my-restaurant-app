<?php

namespace Tests\Feature\Auth;

use App\Models\Customer;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_staff_can_authenticate_using_the_login_screen(): void
    {
        $staff = Staff::query()->create([
            'name' => 'Test',
            'surname' => 'Staff',
            'username' => 'tst_'.substr(uniqid(), -8),
            'password' => 'password',
            'role' => 'staff',
            'phone' => '02099'.(string) random_int(100000, 999999),
        ]);

        $response = $this->post('/login', [
            'account_type' => 'staff',
            'phone' => $staff->phone,
            'password' => 'password',
        ]);

        $this->assertAuthenticated('staff');
        $response->assertRedirect(route('staff.dashboard', absolute: false));
    }

    public function test_customer_can_authenticate_using_the_login_screen(): void
    {
        $customer = Customer::query()->create([
            'phone' => '02088'.(string) random_int(100000, 999999),
            'name' => 'Test Customer',
            'password' => 'password',
        ]);

        $response = $this->post('/login', [
            'account_type' => 'customer',
            'phone' => $customer->phone,
            'password' => 'password',
        ]);

        $this->assertAuthenticated('customer');
        $response->assertRedirect(route('customer.dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $staff = Staff::query()->create([
            'name' => 'Test',
            'surname' => 'Staff',
            'username' => 'tst_'.substr(uniqid(), -8),
            'password' => 'password',
            'role' => 'staff',
            'phone' => '02099'.(string) random_int(100000, 999999),
        ]);

        $this->post('/login', [
            'account_type' => 'staff',
            'phone' => $staff->phone,
            'password' => 'wrong-password',
        ]);

        $this->assertFalse(Auth::guard('staff')->check());
        $this->assertFalse(Auth::guard('customer')->check());
    }

    public function test_staff_can_logout(): void
    {
        $staff = Staff::query()->create([
            'name' => 'Test',
            'surname' => 'Staff',
            'username' => 'tst_'.substr(uniqid(), -8),
            'password' => 'password',
            'role' => 'staff',
            'phone' => '02099'.(string) random_int(100000, 999999),
        ]);

        $response = $this->actingAs($staff, 'staff')->post('/logout');

        $this->assertFalse(Auth::guard('staff')->check());
        $response->assertRedirect('/');
    }

    public function test_manager_staff_is_redirected_to_admin_dashboard_after_login(): void
    {
        $manager = Staff::query()->create([
            'name' => 'Mgr',
            'surname' => 'Test',
            'username' => 'mgr_'.substr(uniqid(), -8),
            'password' => 'password',
            'role' => 'manager',
            'phone' => '02077'.(string) random_int(100000, 999999),
        ]);

        $response = $this->post('/login', [
            'account_type' => 'staff',
            'phone' => $manager->phone,
            'password' => 'password',
        ]);

        $this->assertAuthenticated('staff');
        $response->assertRedirect(route('admin.dashboard', absolute: false));
    }
}
