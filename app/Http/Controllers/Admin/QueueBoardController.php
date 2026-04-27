<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class QueueBoardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/QueueBoard', $this->payload());
    }

    public function data(): JsonResponse
    {
        return response()->json($this->payload());
    }

    /**
     * ບອດຄິວສຳລັບໜ້າຈໍ TV: ສະແດງສະເພາະຄິວຂອງມື້ນີ້.
     *
     * @return array<string,mixed>
     */
    private function payload(): array
    {
        $today = Carbon::today()->toDateString();
        $waitStatuses = ['waiting', 'pending', 'confirmed'];

        $waiting = Booking::query()
            ->whereDate('expected_time', $today)
            ->whereNull('table_id')
            ->whereIn('status', $waitStatuses)
            ->orderByRaw('case when queued_at is null then 1 else 0 end')
            ->orderBy('queued_at')
            ->orderBy('id')
            ->get(['id', 'queue_no', 'guest_count', 'status', 'expected_time', 'queued_at']);

        $calledNow = Booking::query()
            ->whereDate('expected_time', $today)
            ->where('status', 'called')
            ->whereNotNull('called_at')
            ->orderByDesc('called_at')
            ->orderByDesc('id')
            ->first(['id', 'queue_no', 'called_at']);

        $waitingRows = $waiting->map(function (Booking $booking, int $index): array {
            return [
                'position' => $index + 1,
                'queue_no' => $booking->queue_no ?: ('Q'.str_pad((string) $booking->id, 4, '0', STR_PAD_LEFT)),
                'guest_count' => (int) ($booking->guest_count ?? 0),
                'status' => (string) ($booking->status ?? 'waiting'),
                'queued_at' => $booking->queued_at?->toIso8601String(),
            ];
        })->values()->all();

        return [
            'board' => [
                'date' => Carbon::today()->format('d/m/Y'),
                'updated_at' => now()->toIso8601String(),
                'total_waiting' => count($waitingRows),
                'now_serving' => $calledNow?->queue_no ?? null,
                'up_next' => array_slice(array_column($waitingRows, 'queue_no'), 0, 5),
                'waiting_rows' => $waitingRows,
            ],
        ];
    }
}

