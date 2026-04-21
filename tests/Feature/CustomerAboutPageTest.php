<?php

namespace Tests\Feature;

use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CustomerAboutPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_view_about_page(): void
    {
        $customer = Customer::query()->create([
            'name' => 'Pat',
            'phone' => '02055557777',
            'password' => Hash::make('password'),
        ]);

        $this->actingAs($customer, 'customer');

        $this->get(route('customer.about'))
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('Customer/AboutPage'));
    }
}
