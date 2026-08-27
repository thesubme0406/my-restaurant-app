<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\PhoneNumber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function index(Request $request): Response
    {
        $staff = $request->user('staff');
        abort_if($staff === null, 403);

        return Inertia::render('Admin/Profile', [
            'profile' => [
                'id' => $staff->id,
                'staff_code' => 'EMP'.str_pad((string) $staff->id, 3, '0', STR_PAD_LEFT),
                'name' => $staff->name,
                'surname' => $staff->surname,
                'full_name' => trim($staff->name.' '.$staff->surname),
                'username' => $staff->username,
                'role' => $staff->role,
                'address' => $staff->address,
                'phone' => $staff->phone,
                'image' => $staff->image ? Storage::url($staff->image) : null,
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $staff = $request->user('staff');
        abort_if($staff === null, 403);

        $request->merge([
            'phone' => PhoneNumber::digits((string) $request->input('phone', '')),
        ]);

        $data = $request->validate([
            'username' => ['required', 'string', 'max:25', 'regex:/^[A-Za-z0-9._-]+$/', Rule::unique('staffs', 'username')->ignore($staff->id)],
            'address' => ['nullable', 'string', 'max:2000'],
            'phone' => array_merge(PhoneNumber::rules(), [Rule::unique('staffs', 'phone')->ignore($staff->id)]),
            'image' => ['nullable', 'image', 'max:4096'],
            'old_password' => ['nullable', 'string'],
            'new_password' => ['nullable', 'string', 'min:8', 'max:255', 'confirmed'],
        ], PhoneNumber::messages());

        $updates = [
            'username' => $data['username'],
            'address' => $data['address'] ?? null,
            'phone' => $data['phone'],
        ];

        if ($request->hasFile('image')) {
            if (! empty($staff->image)) {
                Storage::disk('public')->delete($staff->image);
            }
            $updates['image'] = $request->file('image')->store('staff-profiles', 'public');
        }

        $newPassword = $data['new_password'] ?? null;
        if (! empty($newPassword)) {
            $oldPassword = (string) ($data['old_password'] ?? '');
            if (! Hash::check($oldPassword, $staff->password)) {
                return back()->withErrors([
                    'old_password' => 'ລະຫັດຜ່ານເກົ່າບໍ່ຖືກຕ້ອງ',
                ]);
            }
            $updates['password'] = Hash::make($newPassword);
        }

        $staff->update($updates);

        return back()->with('success', 'ອັບເດດຂໍ້ມູນໂປຣໄຟລ໌ສຳເລັດແລ້ວ');
    }
}
