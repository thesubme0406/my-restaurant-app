<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\News;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CustomerNewsPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_sees_only_published_news_on_news_page(): void
    {
        $customer = Customer::query()->create([
            'name' => 'Pat',
            'phone' => '02055553333',
            'password' => Hash::make('password'),
        ]);

        $staff = Staff::query()->create([
            'name' => 'Admin',
            'surname' => 'User',
            'username' => 'admin01',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'phone' => '02077774444',
        ]);

        News::query()->create([
            'staff_id' => $staff->id,
            'title' => 'ໂປຣໂມຊັ່ນທົດລອງ',
            'content' => "ແຖວ 1\nແຖວ 2\nແຖວ 3\nແຖວ 4\nແຖວ 5",
            'image' => null,
            'status' => 'draft',
            'published_at' => null,
        ]);

        $published = News::query()->create([
            'staff_id' => $staff->id,
            'title' => 'ຂ່າວທີ່ເຜີຍແຜ່ແລ້ວ',
            'content' => 'ເນື້ອຫາຄົບ',
            'image' => null,
            'status' => 'published',
            'published_at' => now()->subDay(),
        ]);

        $this->actingAs($customer, 'customer');

        $this->get(route('customer.news'))
            ->assertOk()
            ->assertInertia(fn ($p) => $p
                ->component('Customer/NewsPage')
                ->has('posts', 1)
                ->where('posts.0.id', $published->id)
                ->where('posts.0.title', 'ຂ່າວທີ່ເຜີຍແຜ່ແລ້ວ')
                ->where('posts.0.author_code', 'admin01')
                ->where('posts.0.author_name', 'Admin User'));
    }

    public function test_customer_news_published_api_returns_json(): void
    {
        $customer = Customer::query()->create([
            'name' => 'Pat',
            'phone' => '02055554444',
            'password' => Hash::make('password'),
        ]);

        $staff = Staff::query()->create([
            'name' => 'Line',
            'surname' => 'Cook',
            'username' => 'cook01',
            'password' => Hash::make('password'),
            'role' => 'staff',
            'phone' => '02077775555',
        ]);

        News::query()->create([
            'staff_id' => $staff->id,
            'title' => 'API ທົດລອງ',
            'content' => 'Hello',
            'image' => null,
            'status' => 'published',
            'published_at' => now(),
        ]);

        $this->actingAs($customer, 'customer');

        $this->getJson(route('customer.news.published-api'))
            ->assertOk()
            ->assertJsonPath('data.0.title', 'API ທົດລອງ')
            ->assertJsonPath('data.0.author_code', 'cook01');
    }
}
