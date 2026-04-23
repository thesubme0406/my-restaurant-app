<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use App\Models\PurchaseOrder;
use App\Models\StockIn;
use App\Models\StockInDetail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StockInController extends Controller
{
    public function index(): Response
    {
        $orders = PurchaseOrder::query()
            ->with(['supplier', 'poDetails.ingredient', 'stockIn.stockInDetails.ingredient'])
            ->orderByDesc('id')
            ->get();

        $ingIds = $orders->flatMap(fn (PurchaseOrder $po) => $po->poDetails->pluck('ing_id'))->unique()->values();
        $latestCostByIngId = self::latestImportCostByIngredientId($ingIds);

        $purchaseOrders = $orders->map(fn (PurchaseOrder $po): array => [
                'id' => $po->id,
                'po_no' => str_pad((string) $po->id, 3, '0', STR_PAD_LEFT),
                'po_date' => $po->po_date?->format('d/m/y'),
                'supplier_name' => $po->supplier?->sup_name ?? '—',
                'po_status' => $po->po_status,
                'item_count' => $po->poDetails->count(),
                'is_imported' => in_array($po->po_status, ['Received', 'Completed'], true) && $po->stockIn !== null,
                'items' => $po->poDetails->map(fn ($d): array => [
                    'ing_id' => $d->ing_id,
                    'ing_name' => $d->ingredient?->ing_name ?? '—',
                    'ing_unit' => $d->ingredient?->ing_unit ?? '',
                    'quantity' => (float) $d->quantity,
                    'cost_price' => $latestCostByIngId->get($d->ing_id, '0'),
                ])->values()->all(),
                'imported_items' => $po->stockIn
                    ? $po->stockIn->stockInDetails->map(fn ($d): array => [
                        'ing_id' => $d->ing_id,
                        'ing_name' => $d->ingredient?->ing_name ?? '—',
                        'ing_unit' => $d->ingredient?->ing_unit ?? '',
                        'quantity' => (float) $d->quantity,
                        'cost_price' => (float) $d->cost_price,
                    ])->values()->all()
                    : [],
                'imported_total_price' => $po->stockIn ? (float) $po->stockIn->total_price : 0,
            ])
            ->all();

        return Inertia::render('Admin/Import', [
            'purchaseOrders' => $purchaseOrders,
        ]);
    }

    /**
     * ລາຄາຕົ້ນທຶນລ່າສຸດຕໍ່ວັດຖຸດິບ (ຈາກການນຳເຂົ້າຄັ້ງຫຼ້າສຸດ) — ໃຊ້ເປັນຄ່າເລີ່ມຕົ້ນໃນແບບຟອມ, ຜູ້ໃຊ້ແກ້ໄດ້ຕາມປົກກະຕິ.
     *
     * @param  Collection<int, int>  $ingIds
     * @return Collection<int, string>
     */
    private static function latestImportCostByIngredientId(Collection $ingIds): Collection
    {
        if ($ingIds->isEmpty()) {
            return collect();
        }

        return StockInDetail::query()
            ->from('stock_in_details as sid')
            ->join('stock_ins as si', 'si.id', '=', 'sid.imp_id')
            ->whereIn('sid.ing_id', $ingIds->all())
            ->orderByDesc('si.import_date')
            ->orderByDesc('si.id')
            ->orderByDesc('sid.id')
            ->get(['sid.ing_id', 'sid.cost_price'])
            ->unique('ing_id')
            ->mapWithKeys(fn ($row): array => [
                (int) $row->ing_id => self::normalizeMoneyInputString($row->cost_price),
            ]);
    }

    private static function normalizeMoneyInputString(mixed $value): string
    {
        if ($value === null || $value === '' || ! is_numeric($value)) {
            return '0';
        }

        $n = (float) $value;
        if ($n <= 0) {
            return '0';
        }

        $s = rtrim(rtrim(number_format($n, 10, '.', ''), '0'), '.');

        return $s === '' ? '0' : $s;
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'po_id' => ['required', 'integer', 'exists:purchase_orders,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.ing_id' => ['required', 'integer', 'exists:ingredients,id'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.cost_price' => ['required', 'numeric', 'gte:0'],
        ]);

        $staffId = $request->user('staff')?->id;
        abort_if($staffId === null, 403);

        DB::transaction(function () use ($data, $staffId): void {
            $po = PurchaseOrder::query()->with('poDetails')->lockForUpdate()->findOrFail($data['po_id']);

            // ກວດບໍ່ໃຫ້ນຳເຂົ້າຊ້ຳ — ສະຕ໋ອກຕ້ອງຂຶ້ນຄັ້ງດຽວຕໍ່ PO
            if ($po->stockIn()->exists() || in_array($po->po_status, ['Received', 'Completed'], true)) {
                throw ValidationException::withMessages([
                    'po_id' => 'ໃບສັ່ງຊື້ນີ້ນຳເຂົ້າແລ້ວ ບໍ່ສາມາດນຳເຂົ້າຊ້ຳໄດ້.',
                ]);
            }

            $validIngIds = $po->poDetails->pluck('ing_id')->all();
            foreach ($data['items'] as $item) {
                if (! in_array($item['ing_id'], $validIngIds, true)) {
                    throw ValidationException::withMessages([
                        'items' => 'ມີວັດຖຸດິບບໍ່ກົງກັບໃບສັ່ງຊື້ທີ່ເລືອກ.',
                    ]);
                }
            }

            $totalPrice = collect($data['items'])->sum(fn ($item) => (float) $item['quantity'] * (float) $item['cost_price']);

            $stockIn = StockIn::query()->create([
                'po_id' => $po->id,
                'staff_id' => $staffId,
                'total_price' => $totalPrice,
                'import_date' => now(),
            ]);

            foreach ($data['items'] as $item) {
                StockInDetail::query()->create([
                    'imp_id' => $stockIn->id,
                    'ing_id' => $item['ing_id'],
                    'quantity' => $item['quantity'],
                    'cost_price' => $item['cost_price'],
                ]);

                // ເພີ່ມສະຕ໋ອກວັດຖຸດິບຕາມຈຳນວນທີ່ນຳເຂົ້າ
                Ingredient::query()
                    ->whereKey($item['ing_id'])
                    ->increment('ing_quantity', (float) $item['quantity']);
            }

            $po->update(['po_status' => 'Received']);
        });

        return redirect()->route('admin.import')->with('success', 'ນຳເຂົ້າວັດຖຸດິບສຳເລັດແລ້ວ');
    }
}
