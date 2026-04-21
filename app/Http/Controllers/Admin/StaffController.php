<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class StaffController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:25'],
            'surname' => ['required', 'string', 'max:25'],
            'username' => ['required', 'string', 'max:25', 'regex:/^[A-Za-z0-9._-]+$/', Rule::unique('staffs', 'username')],
            'phone' => ['required', 'string', 'regex:/^[0-9]{8,15}$/', Rule::unique('staffs', 'phone')],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            'role' => ['required', Rule::in(['manager', 'staff'])],
            'address' => ['nullable', 'string', 'max:2000'],
        ], [
            'phone.regex' => 'ເບີໂທຕ້ອງເປັນເລກເທົ່ານັ້ນ (8–15 ຫຼັກ).',
        ]);

        $data['password'] = Hash::make($data['password']);

        Staff::query()->create($data);

        return redirect()->route('admin.master-data', ['section' => 'staff']);
    }

    public function update(Request $request, Staff $staff): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:25'],
            'surname' => ['required', 'string', 'max:25'],
            'username' => ['required', 'string', 'max:25', 'regex:/^[A-Za-z0-9._-]+$/', Rule::unique('staffs', 'username')->ignore($staff->id)],
            'phone' => ['required', 'string', 'regex:/^[0-9]{8,15}$/', Rule::unique('staffs', 'phone')->ignore($staff->id)],
            'password' => ['nullable', 'string', 'min:8', 'max:255'],
            'role' => ['required', Rule::in(['manager', 'staff'])],
            'address' => ['nullable', 'string', 'max:2000'],
        ], [
            'phone.regex' => 'ເບີໂທຕ້ອງເປັນເລກເທົ່ານັ້ນ (8–15 ຫຼັກ).',
        ]);

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $staff->update($data);

        return redirect()->route('admin.master-data', ['section' => 'staff']);
    }

    public function destroy(Request $request, Staff $staff): RedirectResponse
    {
        $actor = $request->user('staff');
        if ($actor !== null && (int) $actor->id === (int) $staff->id) {
            throw ValidationException::withMessages([
                'staff' => 'ບໍ່ສາມາດລຶບບັນຊີຂອງທ່ານເອງໄດ້.',
            ]);
        }

        try {
            $staff->delete();
        } catch (QueryException) {
            throw ValidationException::withMessages([
                'staff' => 'ບໍ່ສາມາດລຶບພະນັກງານນີ້ໄດ້ ເນື່ອງຈາກມີຂໍ້ມູນອ້າງອີງ.',
            ]);
        }

        return redirect()->route('admin.master-data', ['section' => 'staff']);
    }
}
