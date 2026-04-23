<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BuffetTier;
use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\MenuCatg;
use App\Models\News;
use App\Models\Service;
use App\Models\Staff;
use App\Models\Supplier;
use App\Models\Table;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MasterDataController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $section = $request->query('section', 'staff');
        $allowed = [
            'staff',
            'buffet_menu',
            'food_menu',
            'food_categories',
            'tables',
            'news',
            'ingredients_master',
            'suppliers',
            'tier_menu_binding',
        ];
        if (! is_string($section) || ! in_array($section, $allowed, true)) {
            $section = 'staff';
        }

        $staffRows = [];
        if ($section === 'staff') {
            $staffRows = Staff::query()
                ->orderByDesc('id')
                ->get()
                ->map(fn (Staff $s): array => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'surname' => $s->surname,
                    'username' => $s->username,
                    'phone' => $s->phone,
                    'role' => $s->role,
                    'address' => $s->address ?? '',
                    'created_at' => $s->created_at?->toIso8601String(),
                ])
                ->all();
        }

        $buffetTierRows = [];
        if ($section === 'buffet_menu') {
            $buffetTierRows = BuffetTier::query()
                ->orderBy('id')
                ->get()
                ->map(fn (BuffetTier $t): array => [
                    'id' => $t->id,
                    'tier_name' => $t->tier_name,
                    'price' => (float) $t->price,
                    'description' => $t->description ?? '',
                    /* Root-relative URL so the browser always hits this app (avoids APP_URL / host mismatch). */
                    'image_url' => $t->image ? '/storage/'.ltrim($t->image, '/') : null,
                ])
                ->all();
        }

        $foodCategoryRows = [];
        if ($section === 'food_categories') {
            $foodCategoryRows = MenuCatg::query()
                ->orderBy('id')
                ->get()
                ->map(fn (MenuCatg $c): array => [
                    'id' => $c->id,
                    'catg_name' => $c->catg_name,
                    'image_url' => $c->image ? '/storage/'.ltrim($c->image, '/') : null,
                ])
                ->all();
        }

        $tableRows = [];
        if ($section === 'tables') {
            // ສະຖານະນັ່ງຄິວສະແດງຕາມບໍລິການຄ້າງຊຳລະ (ກົງແຜງຄິວ) — ບໍ່ໃຊ້ແຕ່ຄ່າ usage_status ໃນຖານຂໍ້ມູນທີ່ອາດເກີນ.
            $occupiedTableSet = Service::activeUnpaidOccupiedTableIdSet();
            $tableRows = Table::query()
                ->orderBy('zone')
                ->orderBy('table_no')
                ->get()
                ->map(function (Table $t) use ($occupiedTableSet): array {
                    $derivedOccupied = isset($occupiedTableSet[(int) $t->id]);

                    return [
                        'id' => $t->id,
                        'table_no' => $t->table_no,
                        'capacity' => (int) $t->capacity,
                        'zone' => $t->zone ?? 'standard',
                        'readiness' => $t->readiness ?? 'ready',
                        'usage_status' => $derivedOccupied ? 'occupied' : 'available',
                    ];
                })
                ->all();
        }

        $newsRows = [];
        $newsStaffOptions = [];
        if ($section === 'news') {
            $newsRows = News::query()
                ->with('staff')
                ->orderByDesc('id')
                ->get()
                ->map(fn (News $n): array => [
                    'id' => $n->id,
                    'staff_id' => $n->staff_id,
                    'staff_name' => trim((string) (($n->staff?->name ?? '').' '.($n->staff?->surname ?? ''))) ?: null,
                    'title' => $n->title,
                    'content' => $n->content,
                    'image_url' => $n->image ? '/storage/'.ltrim($n->image, '/') : null,
                    'status' => $n->status,
                ])
                ->all();

            $newsStaffOptions = Staff::query()
                ->orderBy('name')
                ->orderBy('surname')
                ->get()
                ->map(fn (Staff $s): array => [
                    'id' => $s->id,
                    'label' => trim($s->name.' '.$s->surname),
                ])
                ->all();
        }

        $ingredientRows = [];
        if ($section === 'ingredients_master') {
            $ingredientRows = Ingredient::query()
                ->orderBy('ing_name')
                ->get()
                ->map(fn (Ingredient $i): array => [
                    'id' => $i->id,
                    'ing_name' => $i->ing_name,
                    'ing_unit' => $i->ing_unit,
                    'ing_quantity' => (float) $i->ing_quantity,
                    'ing_min' => (float) $i->ing_min,
                ])
                ->all();
        }

        $supplierRows = [];
        if ($section === 'suppliers') {
            $supplierRows = Supplier::query()
                ->orderBy('sup_name')
                ->get()
                ->map(fn (Supplier $s): array => [
                    'id' => $s->id,
                    'sup_name' => $s->sup_name,
                    'contact_tel' => $s->contact_tel,
                    'contact_person' => $s->contact_person,
                    'sup_address' => $s->sup_address,
                ])
                ->all();
        }

        $foodMenuRows = [];
        $foodMenuCategories = [];
        if ($section === 'food_menu') {
            $foodMenuCategories = MenuCatg::query()
                ->orderBy('catg_name')
                ->get()
                ->map(fn (MenuCatg $c): array => [
                    'id' => $c->id,
                    'category_name' => $c->catg_name,
                ])
                ->all();

            $foodMenuRows = Menu::query()
                ->with('category')
                ->orderBy('id')
                ->get()
                ->map(fn (Menu $m): array => [
                    'id' => $m->id,
                    'name' => $m->name,
                    'name_en' => $m->name_en,
                    'description' => $m->description ?? '',
                    'category_id' => $m->category_id,
                    'category_name' => $m->category?->catg_name ?? '',
                    'is_active' => (bool) $m->is_active,
                    'image_url' => $m->image ? '/storage/'.ltrim($m->image, '/') : null,
                ])
                ->all();
        }

        $tierLinkBuffetTiers = [];
        $tierLinkMenus = [];
        $tierMenuLinks = [];
        $selectedTierId = null;
        if ($section === 'tier_menu_binding') {
            $tierLinkBuffetTiers = BuffetTier::query()
                ->orderBy('id')
                ->get()
                ->map(fn (BuffetTier $t): array => [
                    'id' => $t->id,
                    'tier_name' => $t->tier_name,
                    'price' => (float) $t->price,
                ])
                ->all();

            $tierLinkMenus = Menu::query()
                ->with('category')
                ->orderBy('category_id')
                ->orderBy('name')
                ->get()
                ->map(fn (Menu $m): array => [
                    'id' => $m->id,
                    'name' => $m->name,
                    'name_en' => $m->name_en,
                    'description' => $m->description ?? '',
                    'category_id' => $m->category_id,
                    'category_name' => $m->category?->catg_name ?? '',
                    'is_active' => (bool) $m->is_active,
                    'image_url' => $m->image ? '/storage/'.ltrim($m->image, '/') : null,
                ])
                ->all();

            $linkRows = DB::table('buffet_tier_menu')->select('buffet_tier_id', 'menu_id')->orderBy('menu_id')->get();
            foreach ($linkRows as $row) {
                $tid = (int) $row->buffet_tier_id;
                if (! isset($tierMenuLinks[$tid])) {
                    $tierMenuLinks[$tid] = [];
                }
                $tierMenuLinks[$tid][] = (int) $row->menu_id;
            }

            $tierIdParam = $request->query('tier_id');
            if (is_numeric($tierIdParam)) {
                $tid = (int) $tierIdParam;
                if (BuffetTier::query()->whereKey($tid)->exists()) {
                    $selectedTierId = $tid;
                }
            }
        }

        return Inertia::render('Admin/MasterData', [
            'section' => $section,
            'staff' => $staffRows,
            'buffetTiers' => $buffetTierRows,
            'foodMenus' => $foodMenuRows,
            'foodMenuCategories' => $foodMenuCategories,
            'foodCategories' => $foodCategoryRows,
            'tables' => $tableRows,
            'news' => $newsRows,
            'newsStaff' => $newsStaffOptions,
            'ingredients' => $ingredientRows,
            'suppliers' => $supplierRows,
            'tierLinkBuffetTiers' => $tierLinkBuffetTiers,
            'tierLinkMenus' => $tierLinkMenus,
            'tierMenuLinks' => $tierMenuLinks,
            'selectedTierId' => $selectedTierId,
        ]);
    }
}
