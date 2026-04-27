<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function createCustomer(Request $request): Response
    {
        return Inertia::render('Auth/Login', [
            'status' => session('status'),
            'isStaffLogin' => false,
            'redirectTo' => $request->string('redirect_to')->toString(),
        ]);
    }

    public function createStaff(): Response
    {
        return Inertia::render('Auth/Login', [
            'status' => session('status'),
            'isStaffLogin' => true,
            'redirectTo' => '',
        ]);
    }

    public function storeCustomer(LoginRequest $request): RedirectResponse
    {
        $request->authenticate('customer');

        $request->session()->regenerate();

        $redirectTo = $request->string('redirect_to')->toString();
        if ($redirectTo !== '' && str_starts_with($redirectTo, '/')) {
            return redirect()->to($redirectTo);
        }

        return redirect()->intended(route('customer.home', absolute: false));
    }

    public function storeStaff(LoginRequest $request): RedirectResponse
    {
        $request->authenticate('staff');

        $request->session()->regenerate();

        // ປ່ຽນເສັ້ນທາງໄປໜ້າ Dashboard ຕາມບົດບາດພະນັກງານ
        return redirect()->intended(
            Auth::guard('staff')->user()?->role === 'manager'
                ? route('admin.dashboard', absolute: false)
                : route('staff.dashboard', absolute: false)
        );
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        foreach (['staff', 'customer'] as $guard) {
            Auth::guard($guard)->logout();
        }

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
