<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use App\Models\StockUsage;
use App\Models\UsageDetail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StockUsageController extends Controller
{
    /** ໜ້າລາຍການວັດຖຸດິບ + ປະຫວັດການເບີກ */
    public function index(): Response
    {
        $ingredients = Ingredient::query()
            ->orderBy('ing_name')
            ->get()
            ->map(fn (Ingredient $i): array => [
                'id' => $i->id,
                'ing_name' => $i->ing_name,
                'ing_unit' => $i->ing_unit,
                'ing_quantity' => (float) $i->ing_quantity,
            ])
            ->all();

        $usageRows = UsageDetail::query()
            ->with(['stockUsage.staff', 'ingredient'])
            ->orderByDesc('id')
            ->get()
            ->map(fn (UsageDetail $d): array => [
                'id' => $d->id,
                'ing_id' => $d->ing_id,
                'usage_date' => $d->stockUsage?->usage_date?->format('d/m, H:iA') ?? '—',
                'usage_date_iso' => $d->stockUsage?->usage_date?->toDateString(),
                'ingredient_name' => $d->ingredient?->ing_name ?? '—',
                'usage_qty' => (float) $d->usage_qty,
                'ing_quantity' => (float) ($d->ingredient?->ing_quantity ?? 0),
                'ing_unit' => $d->ingredient?->ing_unit ?? '',
                'staff_name' => trim(($d->stockUsage?->staff?->name ?? '').' '.($d->stockUsage?->staff?->surname ?? '')) ?: '—',
                'usage_detail' => $d->stockUsage?->usage_detail ?? '',
            ])
            ->all();

        return Inertia::render('Admin/Inventory', [
            'ingredients' => $ingredients,
            'usageRows' => $usageRows,
        ]);
    }

    /** ບັນທຶກການເບີກ — ກວດສະຕ໋ອກແລ້ວຕັດ ing_quantity */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ing_id' => ['required', 'integer', 'exists:ingredients,id'],
            'usage_qty' => ['required', 'numeric', 'gt:0'],
            'usage_detail' => ['nullable', 'string', 'max:1000'],
        ]);

        $staffId = $request->user('staff')?->id;
        abort_if($staffId === null, 403);

        DB::transaction(function () use ($data, $staffId): void {
            $ingredient = Ingredient::query()->lockForUpdate()->findOrFail($data['ing_id']);
            $qty = (float) $data['usage_qty'];
            $current = (float) $ingredient->ing_quantity;

            if ($qty > $current) {
                throw ValidationException::withMessages([
                    'usage_qty' => sprintf(
                        'ວັດຖຸດິບ «%s» ບໍ່ພຽງພໍ: ຕ້ອງການ %s %s ແຕ່ຄົງເຫຼືອ %s %s.',
                        $ingredient->ing_name,
                        rtrim(rtrim(number_format($qty, 2, '.', ''), '0'), '.'),
                        $ingredient->ing_unit,
                        rtrim(rtrim(number_format($current, 2, '.', ''), '0'), '.'),
                        $ingredient->ing_unit
                    ),
                ]);
            }

            $usage = StockUsage::query()->create([
                'staff_id' => $staffId,
                'usage_date' => now(),
                'usage_detail' => $data['usage_detail'] ?? null,
            ]);

            UsageDetail::query()->create([
                'usage_id' => $usage->id,
                'ing_id' => $ingredient->id,
                'usage_qty' => $qty,
            ]);

            $ingredient->decrement('ing_quantity', $qty);
        });

        return redirect()->route('admin.inventory')->with('success', 'ເບີກວັດຖຸດິບສຳເລັດແລ້ວ');
    }

    /** ແກ້ໄຂຈຳນວນເບີກ — ປັບສະຕ໋ອກຕາມຄວາມຕ່າງ */
    public function update(Request $request, UsageDetail $usageDetail): RedirectResponse
    {
        $data = $request->validate([
            'usage_qty' => ['required', 'numeric', 'gt:0'],
            'usage_detail' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($data, $usageDetail): void {
            $detail = UsageDetail::query()->with('stockUsage')->lockForUpdate()->findOrFail($usageDetail->id);
            $ingredient = Ingredient::query()->lockForUpdate()->findOrFail($detail->ing_id);

            $oldQty = (float) $detail->usage_qty;
            $newQty = (float) $data['usage_qty'];
            $availableForUpdate = (float) $ingredient->ing_quantity + $oldQty;

            if ($newQty > $availableForUpdate) {
                throw ValidationException::withMessages([
                    'usage_qty' => sprintf(
                        'ວັດຖຸດິບ «%s» ບໍ່ພຽງພໍ: ຕ້ອງການ %s %s ແຕ່ເບີກໄດ້ສູງສຸດ %s %s (ຄົງເຫຼືອໃນສາງ + ຄືນຈາກລາຍການນີ້).',
                        $ingredient->ing_name,
                        rtrim(rtrim(number_format($newQty, 2, '.', ''), '0'), '.'),
                        $ingredient->ing_unit,
                        rtrim(rtrim(number_format($availableForUpdate, 2, '.', ''), '0'), '.'),
                        $ingredient->ing_unit
                    ),
                ]);
            }

            $delta = $newQty - $oldQty;
            if ($delta > 0) {
                $ingredient->decrement('ing_quantity', $delta);
            } elseif ($delta < 0) {
                $ingredient->increment('ing_quantity', abs($delta));
            }

            $detail->update(['usage_qty' => $newQty]);
            $detail->stockUsage?->update(['usage_detail' => $data['usage_detail'] ?? null]);
        });

        return redirect()->route('admin.inventory')->with('success', 'ແກ້ໄຂປະຫວັດການເບີກສຳເລັດແລ້ວ');
    }

    /** ລຶບປະຫວັດ — ຄືນສະຕ໋ອກເຂົ້າວັດຖຸດິບ */
    public function destroy(UsageDetail $usageDetail): RedirectResponse
    {
        DB::transaction(function () use ($usageDetail): void {
            $detail = UsageDetail::query()->with('stockUsage')->lockForUpdate()->findOrFail($usageDetail->id);
            $ingredient = Ingredient::query()->lockForUpdate()->findOrFail($detail->ing_id);

            $ingredient->increment('ing_quantity', (float) $detail->usage_qty);

            $usage = $detail->stockUsage;
            $detail->delete();

            if ($usage && ! $usage->usageDetails()->exists()) {
                $usage->delete();
            }
        });

        return redirect()->route('admin.inventory')->with('success', 'ລຶບປະຫວັດການເບີກສຳເລັດແລ້ວ');
    }
}
