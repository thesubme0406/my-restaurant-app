<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Support\PhoneNumber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CustomerProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $customer = $request->user('customer');
        abort_if($customer === null, 403);

        return Inertia::render('Customer/CustomerProfilePage', [
            'profile' => [
                'name' => $customer->name,
                'phone' => $customer->phone,
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        /** @var Customer|null $customer */
        $customer = $request->user('customer');
        abort_if($customer === null, 403);

        $request->merge([
            'phone' => PhoneNumber::digits((string) $request->input('phone', '')),
        ]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'phone' => array_merge(PhoneNumber::rules(), [Rule::unique('customers', 'phone')->ignore($customer->id)]),
            'current_password' => ['nullable', 'string'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ], PhoneNumber::messages());

        if ($data['password'] ?? null) {
            $current = $data['current_password'] ?? '';
            if ($current === '' || ! Hash::check($current, $customer->password)) {
                throw ValidationException::withMessages([
                    'current_password' => 'ລະຫັດປັດຈຸບັນບໍ່ຖືກຕ້ອງ.',
                ]);
            }
        }

        $oldPhone = $customer->phone;

        $customer->name = $data['name'];
        $customer->phone = $data['phone'];
        if (! empty($data['password'])) {
            $customer->password = $data['password'];
        }
        $customer->save();

        if ($customer->phone !== $oldPhone) {
            Auth::guard('customer')->login($customer->fresh());
            $request->session()->regenerate();
        }

        return redirect()->route('customer.profile')->with('success', 'ບັນທຶກຂໍ້ມູນສຳເລັດແລ້ວ.');
    }
}
