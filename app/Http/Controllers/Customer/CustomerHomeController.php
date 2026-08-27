<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\BuffetTier;
use App\Models\Menu;
use App\Services\QueueDisplayService;
use App\Support\PublicStorageUrl;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class CustomerHomeController extends Controller
{
    public function __construct(private readonly QueueDisplayService $queueDisplay) {}

    public function __invoke(): Response
    {
        $tiers = BuffetTier::query()
            ->orderBy('price')
            ->orderBy('id')
            ->with([
                'menus' => function ($query): void {
                    $query
                        ->where('menus.is_active', true)
                        ->with('category')
                        ->orderBy('menus.category_id')
                        ->orderBy('menus.name');
                },
            ])
            ->get();

        $buffetTiersWithMenus = $tiers->map(function (BuffetTier $tier): array {
            /** @var list<array{id: int, name: string, description: string, image_url: string|null, category_name: string}> $menus */
            $menus = $tier->menus->map(function (Menu $m): array {
                return [
                    'id' => $m->id,
                    'name' => $m->name,
                    'name_en' => $m->name_en ? strtoupper(trim((string) $m->name_en)) : '',
                    'description' => $m->description ?? '',
                    'image_url' => PublicStorageUrl::from($m->image),
                    'category_name' => $m->category?->catg_name ?? '',
                ];
            })->values()->all();

            return [
                'id' => $tier->id,
                'tier_name' => $tier->tier_name,
                'price' => (float) $tier->price,
                'description' => $tier->description ?? '',
                'image_url' => PublicStorageUrl::from($tier->image),
                'menus' => $menus,
            ];
        })->values()->all();

        // ນັບຄິວລໍຖ້າຕາມ logic ດຽວກັບ admin dashboard «ຄິວລໍຖ້າ» (calling + waitlist, ຍັງບໍ່ໄດ້ໂຕະ)
        $waitingQueueCount = $this->queueDisplay->waitingCountToday();

        return Inertia::render('Customer/Home', [
            'buffetTiersWithMenus' => $buffetTiersWithMenus,
            'waitingQueueCount' => $waitingQueueCount,
            'currentDateTime' => Carbon::now()->toIso8601String(),
        ]);
    }
}
