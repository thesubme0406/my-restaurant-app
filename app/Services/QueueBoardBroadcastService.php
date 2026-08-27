<?php

namespace App\Services;

use App\Events\QueueBoardUpdated;

class QueueBoardBroadcastService
{
    public function __construct(private readonly QueueDisplayService $queueDisplay) {}

    public function dispatch(): void
    {
        if (config('broadcasting.default') === 'null') {
            return;
        }

        broadcast(new QueueBoardUpdated($this->queueDisplay->todayBoard()));
    }
}
