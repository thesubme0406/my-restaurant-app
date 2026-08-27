<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\QueueDisplayService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class QueueBoardController extends Controller
{
    public function __construct(private readonly QueueDisplayService $queueDisplay) {}

    public function index(): Response
    {
        return $this->display();
    }

    public function display(): Response
    {
        return Inertia::render('Admin/QueueBoard', $this->payload());
    }

    public function data(): JsonResponse
    {
        return response()->json($this->payload());
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(): array
    {
        $reverb = config('broadcasting.connections.reverb');

        return [
            'board' => $this->queueDisplay->todayBoard(),
            'broadcast' => [
                'enabled' => config('broadcasting.default') !== 'null',
                'reverb' => [
                    'key' => $reverb['key'] ?? null,
                    'host' => $reverb['options']['host'] ?? 'localhost',
                    'port' => (int) ($reverb['options']['port'] ?? 8080),
                    'scheme' => $reverb['options']['scheme'] ?? 'http',
                ],
            ],
        ];
    }
}
