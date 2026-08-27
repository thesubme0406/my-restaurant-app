<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Support\PhoneNumber;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SupplierController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'contact_tel' => PhoneNumber::digits((string) $request->input('contact_tel', '')),
        ]);

        $data = $request->validate([
            'sup_name' => ['required', 'string', 'max:100'],
            'contact_tel' => PhoneNumber::rules(),
            'contact_person' => ['required', 'string', 'max:50'],
            'sup_address' => ['required', 'string', 'max:255'],
        ], PhoneNumber::messages());

        Supplier::query()->create($data);

        return redirect()->route('admin.master-data', ['section' => 'suppliers']);
    }

    public function update(Request $request, Supplier $supplier): RedirectResponse
    {
        $request->merge([
            'contact_tel' => PhoneNumber::digits((string) $request->input('contact_tel', '')),
        ]);

        $data = $request->validate([
            'sup_name' => ['required', 'string', 'max:100'],
            'contact_tel' => PhoneNumber::rules(),
            'contact_person' => ['required', 'string', 'max:50'],
            'sup_address' => ['required', 'string', 'max:255'],
        ], PhoneNumber::messages());

        $supplier->update($data);

        return redirect()->route('admin.master-data', ['section' => 'suppliers']);
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        if ($supplier->purchaseOrders()->exists()) {
            throw ValidationException::withMessages([
                'supplier' => 'ບໍ່ສາມາດລຶບຜູ້ສະໜອງນີ້ໄດ້ ເນື່ອງຈາກມີຂໍ້ມູນການສັ່ງຊື້ເຊື່ອມຢູ່.',
            ]);
        }

        try {
            $supplier->delete();
        } catch (QueryException) {
            throw ValidationException::withMessages([
                'supplier' => 'ບໍ່ສາມາດລຶບຜູ້ສະໜອງນີ້ໄດ້ ເນື່ອງຈາກມີຂໍ້ມູນອ້າງອີງ.',
            ]);
        }

        return redirect()->route('admin.master-data', ['section' => 'suppliers']);
    }
}
