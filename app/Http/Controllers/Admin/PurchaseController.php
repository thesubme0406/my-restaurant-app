<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use App\Models\PoDetail;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
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
                'ing_min' => (float) $i->ing_min,
            ])
            ->all();

        $suppliers = Supplier::query()
            ->orderBy('sup_name')
            ->get()
            ->map(fn (Supplier $s): array => [
                'id' => $s->id,
                'sup_name' => $s->sup_name,
            ])
            ->all();

        return Inertia::render('Admin/Purchase', [
            'ingredients' => $ingredients,
            'suppliers' => $suppliers,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'sup_id' => ['required', 'integer', 'exists:suppliers,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.ing_id' => ['required', 'integer', 'exists:ingredients,id'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
        ]);

        $staffId = $request->user('staff')?->id;
        abort_if($staffId === null, 403);

        DB::transaction(function () use ($data, $staffId): void {
            // ສັ່ງຊື້ = ບັນທຶກ PO ຢ່າງດຽວ; ສະຕ໋ອກວັດຖຸດິບເພີ່ມຕອນນຳເຂົ້າ (StockIn) ເທົ່ານັ້ນ
            $po = PurchaseOrder::query()->create([
                'staff_id' => $staffId,
                'sup_id' => $data['sup_id'],
                'po_date' => now(),
                'po_status' => 'Pending',
            ]);

            foreach ($data['items'] as $item) {
                PoDetail::query()->create([
                    'po_id' => $po->id,
                    'ing_id' => $item['ing_id'],
                    'quantity' => $item['quantity'],
                ]);
            }
        });

        return redirect()->route('admin.purchase')->with('success', 'ບັນທຶກຄຳສັ່ງຊື້ສຳເລັດແລ້ວ');
    }
}
