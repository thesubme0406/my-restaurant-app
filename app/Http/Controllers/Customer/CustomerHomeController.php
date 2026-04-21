<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\BuffetTier;
use App\Models\Menu;
use Inertia\Inertia;
use Inertia\Response;

class CustomerHomeController extends Controller
{
    private function publicImageUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return '/storage/'.ltrim($path, '/');
    }

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
                    'image_url' => $this->publicImageUrl($m->image),
                    'category_name' => $m->category?->catg_name ?? '',
                ];
            })->values()->all();

            return [
                'id' => $tier->id,
                'tier_name' => $tier->tier_name,
                'price' => (float) $tier->price,
                'description' => $tier->description ?? '',
                'image_url' => $this->publicImageUrl($tier->image),
                'menus' => $menus,
            ];
        })->values()->all();

        return Inertia::render('Customer/Home', [
            'buffetTiersWithMenus' => $buffetTiersWithMenus,
        ]);
    }
}
