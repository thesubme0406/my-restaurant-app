<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    // ຂໍ້ມູນທົ່ວໄຊຕ໌: auth (staff/customer) + flash success
    public function share(Request $request): array
    {
        $staff = $request->user('staff');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $this->resolveAuthUser($request),
                'is_staff_manager' => $staff !== null && $staff->role === 'manager',
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
            ],
        ];
    }

    // ຜູ້ລັອກອິນປັດຈຸບັນ (guard staff ຫຼື customer)
    private function resolveAuthUser(Request $request): ?array
    {
        if ($staff = $request->user('staff')) {
            // ຮູບໂປຣໄຟລ໌ — ໃຫ້ວົງມົນເທິງຂວາສະແດງຫຼັງອັບເດດ (?v= ກັນບຣາວເຊີແຄຊຮູບເກົ່າ)
            $image = null;
            if (! empty($staff->image)) {
                $url = Storage::url($staff->image);
                $v = $staff->updated_at?->getTimestamp() ?? $staff->id;
                $image = str_contains($url, '?') ? "{$url}&v={$v}" : "{$url}?v={$v}";
            }

            return [
                'id' => $staff->id,
                'name' => trim($staff->name.' '.$staff->surname),
                'phone' => $staff->phone,
                'role' => $staff->role,
                'guard' => 'staff',
                'image' => $image,
            ];
        }

        if ($customer = $request->user('customer')) {
            return [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'role' => 'customer',
                'guard' => 'customer',
            ];
        }

        return null;
    }
}
