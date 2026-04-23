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
        $redirectTo = $request->query('redirect_to');
        if (is_string($redirectTo) && str_starts_with($redirectTo, '/')) {
            $request->session()->put('url.intended', $redirectTo);
        }

        return Inertia::render('Auth/Login', [
            'status' => session('status'),
            'guard' => 'customer',
        ]);
    }

    public function createStaff(): Response
    {
        return Inertia::render('Auth/Login', [
            'status' => session('status'),
            'guard' => 'staff',
        ]);
    }

    public function storeCustomer(LoginRequest $request): RedirectResponse
    {
        return $this->storeByGuard($request, 'customer', route('customer.home', absolute: false));
    }

    public function storeStaff(LoginRequest $request): RedirectResponse
    {
        // ປ່ຽນເສັ້ນທາງໄປໜ້າ Dashboard ສໍາລັບພະນັກງານ
        $request->authenticate('staff');
        $request->session()->regenerate();

        $staff = Auth::guard('staff')->user();
        $target = $staff?->role === 'manager'
            ? route('admin.dashboard', absolute: false)
            : route('staff.dashboard', absolute: false);

        return redirect()->intended($target);
    }

    private function storeByGuard(LoginRequest $request, string $guard, string $redirectTo): RedirectResponse
    {
        $request->authenticate($guard);
        $request->session()->regenerate();

        return redirect()->intended($redirectTo);
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
