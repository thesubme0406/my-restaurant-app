<?php

namespace Tests\Feature;

use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CustomerContactPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_view_contact_page(): void
    {
        $customer = Customer::query()->create([
            'name' => 'Pat',
            'phone' => '02055556666',
            'password' => Hash::make('password'),
        ]);

        $this->actingAs($customer, 'customer');

        $this->get(route('customer.contact'))
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('Customer/ContactPage'));
    }
}
