<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $staff = $request->user('staff');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $this->resolveAuthUser($request),
                'is_staff_manager' => $staff !== null && $staff->role === 'manager',
            ],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resolveAuthUser(Request $request): ?array
    {
        if ($staff = $request->user('staff')) {
            return [
                'id' => $staff->id,
                'name' => trim($staff->name.' '.$staff->surname),
                'phone' => $staff->phone,
                'role' => $staff->role,
                'guard' => 'staff',
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
