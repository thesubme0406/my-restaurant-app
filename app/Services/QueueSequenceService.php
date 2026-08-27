<?php

namespace App\Services;

use App\Models\Booking;

final class QueueSequenceService
{
    /**
     * Next queue number for the given calendar day and series (Q… or V…).
     * Call inside a DB transaction; uses row locks on matching queue_no rows.
     */
    public static function allocateNextQueueNo(string $queueDay, bool $isVip): string
    {
        $prefix = $isVip ? 'V' : 'Q';
        $pattern = $prefix.'%';

        $queueNos = Booking::query()
            ->where('queue_day', $queueDay)
            ->where('queue_no', 'like', $pattern)
            ->lockForUpdate()
            ->pluck('queue_no');

        $maxSuffix = 0;
        foreach ($queueNos as $queueNo) {
            if (! is_string($queueNo)) {
                continue;
            }
            $quoted = preg_quote($prefix, '/');
            if (preg_match('/^'.$quoted.'-?(\d+)$/', $queueNo, $matches) === 1) {
                $maxSuffix = max($maxSuffix, (int) $matches[1]);
            }
        }

        return $prefix.str_pad((string) ($maxSuffix + 1), 4, '0', STR_PAD_LEFT);
    }
}
