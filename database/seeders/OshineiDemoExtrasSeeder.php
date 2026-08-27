<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\News;
use App\Models\Payment;
use App\Models\Service;
use App\Models\Staff;
use App\Models\Table;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

/**
 * Post-seed polish: profile/news images, voided payments, unpaid services,
 * inactive menus, low-stock ingredients, and sample activity logs.
 */
class OshineiDemoExtrasSeeder extends Seeder
{
    /** @var list<string> */
    private const NEWS_ASSETS = [
        'images/news.png',
        'images/foodshowing.jpg',
        'images/sushi.png',
    ];

    /** @var list<string> */
    private const STAFF_ASSETS = [
        'images/oshinei-logo.png',
        'images/sushi.png',
        'images/foodshowing.jpg',
    ];

    public function run(): void
    {
        $this->seedStaffImages();
        $this->seedNewsImages();
        $this->seedInactiveMenus();
        $this->seedLowStockIngredients();
        $this->seedUnpaidServices();
        $this->seedVoidedPayments();
        $this->seedActivityLogs();

        $this->command?->info('OshineiDemoExtrasSeeder: images, voided payments, unpaid services, and activity logs ready.');
    }

    private function seedStaffImages(): void
    {
        Storage::disk('public')->makeDirectory('staff');

        $staffRows = Staff::query()->orderBy('id')->get();
        foreach ($staffRows as $index => $staff) {
            $asset = self::STAFF_ASSETS[$index % count(self::STAFF_ASSETS)];
            $path = $this->copyPublicAsset($asset, 'staff/staff-'.$staff->id.'.png');
            if ($path !== null) {
                $staff->update(['image' => $path]);
            }
        }
    }

    private function seedNewsImages(): void
    {
        Storage::disk('public')->makeDirectory('news');

        $publishedNews = News::query()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->orderByDesc('published_at')
            ->get();

        foreach ($publishedNews as $index => $item) {
            $asset = self::NEWS_ASSETS[$index % count(self::NEWS_ASSETS)];
            $path = $this->copyPublicAsset($asset, 'news/news-'.$item->id.'.png');
            if ($path !== null) {
                $item->update(['image' => $path]);
            }
        }
    }

    private function seedInactiveMenus(): void
    {
        $inactiveNames = ['Mineral Water', 'Dorayaki', 'Crab Roll'];
        Menu::query()
            ->whereIn('name_en', $inactiveNames)
            ->update(['is_active' => false]);
    }

    private function seedLowStockIngredients(): void
    {
        Ingredient::query()->where('ing_name', 'Salmon')->update(['ing_quantity' => 4, 'ing_min' => 8]);
        Ingredient::query()->where('ing_name', 'Wasabi')->update(['ing_quantity' => 6, 'ing_min' => 10]);
    }

    private function seedUnpaidServices(): void
    {
        $staffId = (int) (Staff::query()->where('role', 'manager')->orderBy('id')->value('id') ?? 0);
        $customer = Customer::query()->orderBy('id')->first();
        $tierId = (int) (DB::table('buffet_tiers')->orderBy('id')->value('id') ?? 0);
        $table = Table::query()->where('readiness', 'ready')->where('usage_status', 'available')->orderBy('id')->first();

        if ($staffId <= 0 || $customer === null || $tierId <= 0 || $table === null) {
            return;
        }

        $today = Carbon::now()->startOfDay();
        $queuedAt = $today->copy()->addHours(13)->addMinutes(10);

        $booking = Booking::query()->create([
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'phone' => $customer->phone,
            'tier_id' => $tierId,
            'table_id' => $table->id,
            'queue_no' => 'Q0099',
            'is_vip' => false,
            'queue_day' => $today->toDateString(),
            'guest_count' => 2,
            'expected_time' => $today->copy()->addHours(13),
            'queued_at' => $queuedAt,
            'called_at' => $queuedAt->copy()->addMinutes(12),
            'dining_finished_at' => null,
            'paid_at' => null,
            'status' => 'called',
            'skip_count' => 0,
        ]);

        $startTime = $queuedAt->copy()->addMinutes(12);
        $service = Service::query()->create([
            'booking_id' => $booking->id,
            'start_time' => $startTime,
            'end_time' => null,
            'status' => 'in_service',
            'service_code' => 'SV'.str_pad((string) $booking->id, 5, '0', STR_PAD_LEFT),
        ]);

        DB::table('service_detail')->insert([
            'service_id' => $service->id,
            'table_id' => $table->id,
        ]);

        $table->update(['usage_status' => 'occupied']);
    }

    private function seedVoidedPayments(): void
    {
        $managerId = (int) (Staff::query()->where('role', 'manager')->orderBy('id')->value('id') ?? 0);
        if ($managerId <= 0) {
            return;
        }

        $payments = Payment::query()
            ->orderByDesc('payment_time')
            ->limit(3)
            ->get();

        foreach ($payments->take(2) as $index => $payment) {
            $payment->update([
                'deletion_reason' => $index === 0
                    ? 'ລູກຄ້າຂໍຍົກເລີກບິນ (demo)'
                    : 'ປ້ອນຈຳນວນເງິນຜິດ — void ເພື່ອບັນທຶກໃໝ່ (demo)',
                'deleted_by_staff_id' => $managerId,
            ]);
            $payment->delete();
        }
    }

    private function seedActivityLogs(): void
    {
        $manager = Staff::query()->where('role', 'manager')->orderBy('id')->first();
        if ($manager === null) {
            return;
        }

        $samples = [
            ['action' => 'DELETE_PAYMENT', 'details' => ['note' => 'Voided duplicate payment (demo seed)']],
            ['action' => 'RESTORE_PAYMENT', 'details' => ['note' => 'Restored payment after review (demo seed)']],
            ['action' => 'ADJUST_PAYMENT', 'details' => ['note' => 'Adjusted transfer amount (demo seed)']],
            ['action' => 'LOGIN', 'details' => ['username' => $manager->username]],
        ];

        foreach ($samples as $index => $sample) {
            ActivityLog::query()->create([
                'staff_id' => $manager->id,
                'action' => $sample['action'],
                'details' => $sample['details'],
                'ip_address' => '127.0.0.1',
                'created_at' => now()->subDays(3 - $index)->subHours($index),
            ]);
        }
    }

    private function copyPublicAsset(string $publicRelative, string $storagePath): ?string
    {
        $source = public_path($publicRelative);
        if (! is_file($source)) {
            return null;
        }

        $dir = dirname($storagePath);
        if ($dir !== '.' && $dir !== '') {
            Storage::disk('public')->makeDirectory($dir);
        }

        File::copy($source, Storage::disk('public')->path($storagePath));

        return $storagePath;
    }
}
