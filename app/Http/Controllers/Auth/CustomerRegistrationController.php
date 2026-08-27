<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Support\PhoneNumber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class CustomerRegistrationController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'phone' => PhoneNumber::digits((string) $request->input('phone', '')),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'phone' => array_merge(PhoneNumber::rules(), ['unique:customers,phone']),
            'password' => ['required', 'confirmed', Password::defaults()],
        ], PhoneNumber::messages());

        $customer = Customer::query()->create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'password' => $validated['password'],
        ]);

        Auth::guard('customer')->login($customer);

        $request->session()->regenerate();

        return redirect()->intended(route('customer.home', absolute: false));
    }
}
