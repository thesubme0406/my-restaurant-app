<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStaffIsManager
{
    public function handle(Request $request, Closure $next): Response
    {
        $staff = $request->user('staff');

        if (! $staff || $staff->role !== 'manager') {
            abort(403);
        }

        return $next($request);
    }
}
