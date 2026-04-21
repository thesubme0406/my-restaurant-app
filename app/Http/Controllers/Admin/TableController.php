<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Table;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TableController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'table_no' => ['required', 'string', 'max:10', Rule::unique('tables', 'table_no')],
            'capacity' => ['required', 'integer', 'min:1', 'max:127'],
            'zone' => ['nullable', 'string', Rule::in(['standard', 'vip'])],
            'status' => ['required', 'string', Rule::in(['available', 'occupied', 'maintenance'])],
        ]);

        $data['capacity'] = (int) $data['capacity'];
        $data['zone'] = $data['zone'] ?? 'standard';

        Table::query()->create($data);

        return redirect()->route('admin.master-data', ['section' => 'tables']);
    }

    public function update(Request $request, Table $table): RedirectResponse
    {
        $data = $request->validate([
            'table_no' => ['required', 'string', 'max:10', Rule::unique('tables', 'table_no')->ignore($table->id)],
            'capacity' => ['required', 'integer', 'min:1', 'max:127'],
            'zone' => ['nullable', 'string', Rule::in(['standard', 'vip'])],
            'status' => ['required', 'string', Rule::in(['available', 'occupied', 'maintenance'])],
        ]);

        $data['capacity'] = (int) $data['capacity'];
        $data['zone'] = $data['zone'] ?? 'standard';

        $table->update($data);

        return redirect()->route('admin.master-data', ['section' => 'tables']);
    }

    public function destroy(Table $table): RedirectResponse
    {
        if ($table->serviceDetails()->exists()) {
            throw ValidationException::withMessages([
                'table' => 'ບໍ່ສາມາດລຶບໂຕະນີ້ໄດ້ ເນື່ອງຈາກມີບໍລິການເຊື່ອມກັບໂຕະນີ້.',
            ]);
        }

        try {
            $table->delete();
        } catch (QueryException) {
            throw ValidationException::withMessages([
                'table' => 'ບໍ່ສາມາດລຶບໂຕະນີ້ໄດ້ ເນື່ອງຈາກມີຂໍ້ມູນອ້າງອີງ.',
            ]);
        }

        return redirect()->route('admin.master-data', ['section' => 'tables']);
    }
}
