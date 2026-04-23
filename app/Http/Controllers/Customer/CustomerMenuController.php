<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BuffetTier;
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class CustomerMenuController extends Controller
{
    private function menuImageUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return '/storage/'.ltrim($path, '/');
    }

    private function tierImageUrl(?string $path): ?string
    {
        return $this->menuImageUrl($path);
    }

    /**
     * English subtitle for category section headers (Lao name stays from DB).
     */
    private function categoryLabelEn(string $catgName): string
    {
        return match ($catgName) {
            'Sashimi' => 'Sashimi Menu',
            'Sushi' => 'Sushi & Sashimi Menu',
            'Drinks' => 'Drinks Menu',
            'Dessert' => 'Dessert Menu',
            default => 'Menu',
        };
    }

    public function index(Request $request): Response
    {
        $customer = $request->user('customer');

        $bookingTierId = null;
        if ($customer !== null) {
            $bookingTierId = Booking::query()
                ->where(function ($q) use ($customer): void {
                    $q->where('customer_id', $customer->id)
                        ->orWhere('phone', $customer->phone);
                })
                ->whereIn('status', ['pending', 'confirmed', 'waiting', 'called'])
                ->whereNull('table_id')
                ->orderByDesc('id')
                ->value('tier_id');
        }

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

        $buffetTiers = $tiers->map(function (BuffetTier $tier): array {
            $menus = $tier->menus;
            $grouped = $menus
                ->groupBy('category_id')
                ->map(function ($items) {
                    /** @var Collection<int, Menu> $items */
                    $first = $items->first();
                    $catName = $first?->category?->catg_name ?? '—';

                    return [
                        'category_id' => (int) ($first?->category_id ?? 0),
                        'category_name' => $catName,
                        'category_name_en' => $this->categoryLabelEn($catName),
                        'items' => $items->map(function (Menu $m): array {
                            return [
                                'id' => $m->id,
                                'name' => $m->name,
                                'name_en' => $m->name_en ? strtoupper(trim((string) $m->name_en)) : '',
                                'image_url' => $this->menuImageUrl($m->image),
                            ];
                        })->values()->all(),
                    ];
                })
                ->values()
                ->sortBy('category_id')
                ->values()
                ->all();

            return [
                'id' => $tier->id,
                'tier_name' => $tier->tier_name,
                'price' => (float) $tier->price,
                'description' => (string) ($tier->description ?? ''),
                'image_url' => $this->tierImageUrl($tier->image),
                'menu_count' => $menus->count(),
                'categories' => $grouped,
            ];
        })->values()->all();

        $tierIds = collect($buffetTiers)->pluck('id')->all();
        $requested = $request->query('tier');
        $requestedId = is_numeric($requested) ? (int) $requested : null;

        $initialTierId = $tiers->isEmpty()
            ? null
            : (in_array($requestedId, $tierIds, true)
                ? $requestedId
                : (in_array((int) $bookingTierId, $tierIds, true)
                    ? (int) $bookingTierId
                    : (int) $tiers->first()->id));

        return Inertia::render('Customer/MenuPage', [
            'buffetTiers' => $buffetTiers,
            'initialTierId' => $initialTierId,
            'buffetTimeLimitHours' => 2,
        ]);
    }
}
