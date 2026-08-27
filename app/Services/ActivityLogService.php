<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Staff;
use Illuminate\Http\Request;

class ActivityLogService
{
    /**
     * @param  array<string, mixed>  $details
     */
    public static function record(?Staff $staff, string $action, array $details, ?Request $request = null): ActivityLog
    {
        return ActivityLog::query()->create([
            'staff_id' => $staff?->id,
            'action' => $action,
            'details' => $details,
            'ip_address' => $request?->ip(),
            'created_at' => now(),
        ]);
    }
}
