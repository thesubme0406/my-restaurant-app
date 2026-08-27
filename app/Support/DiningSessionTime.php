<?php

namespace App\Support;

use Carbon\CarbonInterface;

/**
 * Projected dining end time for service slips — start + configured session hours.
 * Does not persist to DB until payment/completion flows set end_time explicitly.
 */
class DiningSessionTime
{
    public static function projectedEnd(CarbonInterface $startTime, ?float $hours = null): CarbonInterface
    {
        $hours = $hours ?? (float) config('app.dining_session_hours', 2);

        return $startTime->copy()->addHours($hours);
    }

    public static function sessionHours(): float
    {
        return (float) config('app.dining_session_hours', 2);
    }
}
