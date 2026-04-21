<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BuffetTier;
use App\Models\Table;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReserveController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Customer/Reserve', $this->payload($request));
    }

    public function stats(Request $request): JsonResponse
    {
        return response()->json($this->payload($request));
    }

    /**
     * @return array{
     *   waiting_count: int,
     *   estimated_wait_minutes: int,
     *   active_queues: array<int, array<string,mixed>>,
     *   booking_history: array<int, array<string,mixed>>,
     *   buffet_tiers: array<int, array{id: int, label: string}>,
     *   customer_profile: array{name: string, phone: string}
     * }
     */
    private function payload(Request $request): array
    {
        $customer = $request->user('customer');
        abort_if($customer === null, 403);
        $today = Carbon::today();

        $activeStatuses = ['pending', 'confirmed'];

        // Global "ຄິວລໍຖ້າ" for today: all bookings on this queue_day, still unseated, pending or confirmed only.
        $waitingCount = Booking::query()
            ->where('queue_day', $today->toDateString())
            ->whereNull('table_id')
            ->whereIn('status', ['pending', 'confirmed'])
            ->count();

        $availableTableCount = max(
            1,
            Table::query()->whereIn('status', ['available', 'occupied'])->count()
        );
        $avgServeMinutesPerTable = 4;
        $estimatedWaitMinutes = (int) ceil(($waitingCount / $availableTableCount) * $avgServeMinutesPerTable);

        $activeQueues = Booking::query()
            ->with(['buffetTier', 'customer'])
            ->where(function ($query) use ($customer): void {
                $query->where('customer_id', $customer->id)
                    ->orWhere('phone', $customer->phone);
            })
            ->whereNull('table_id')
            ->whereIn('status', $activeStatuses)
            ->orderBy('expected_time')
            ->orderBy('id')
            ->get();

        $allTodayActive = Booking::query()
            ->where('queue_day', $today->toDateString())
            ->whereNull('table_id')
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('expected_time')
            ->orderBy('id')
            ->get(['id']);

        $positions = [];
        foreach ($allTodayActive as $index => $booking) {
            $positions[(int) $booking->id] = $index + 1;
        }

        $activeQueuePayload = $activeQueues
            ->map(function (Booking $booking) use ($positions, $availableTableCount, $avgServeMinutesPerTable, $customer): array {
                $position = $positions[(int) $booking->id] ?? 1;
                $perQueueEstimated = (int) ceil(($position / $availableTableCount) * $avgServeMinutesPerTable);
                $tier = $booking->buffetTier;
                $buffetTierLabel = $tier !== null
                    ? number_format((float) $tier->price).' ກີບ '.trim((string) $tier->tier_name)
                    : '—';

                return [
                    'id' => $booking->id,
                    'queue_no' => $booking->queue_no ?: ('Q'.str_pad((string) $booking->id, 3, '0', STR_PAD_LEFT)),
                    'status' => (string) $booking->status,
                    'guest_count' => (int) ($booking->guest_count ?? 0),
                    'estimated_wait_time' => max($perQueueEstimated, 0),
                    'customer_name' => (string) ($booking->customer_name ?: ($booking->customer?->name ?? $customer->name)),
                    'phone' => (string) ($booking->phone ?? $booking->customer?->phone ?? $customer->phone ?? ''),
                    'buffet_tier_label' => $buffetTierLabel,
                    'expected_time' => $booking->expected_time?->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        $history = Booking::query()
            ->with(['buffetTier', 'customer'])
            ->where(function ($query) use ($customer): void {
                $query->where('customer_id', $customer->id)
                    ->orWhere('phone', $customer->phone);
            })
            ->where(function ($query) use ($activeStatuses): void {
                $query->whereNotIn('status', $activeStatuses)
                    ->orWhereNotNull('table_id');
            })
            ->orderByDesc('id')
            ->get()
            ->map(function (Booking $booking) use ($customer): array {
                $tier = $booking->buffetTier;
                $buffetTierLabel = $tier !== null
                    ? number_format((float) $tier->price).' ກີບ '.trim((string) $tier->tier_name)
                    : '—';

                return [
                    'id' => $booking->id,
                    'queue_no' => $booking->queue_no ?: ('Q'.str_pad((string) $booking->id, 3, '0', STR_PAD_LEFT)),
                    'customer_name' => (string) ($booking->customer_name ?: ($booking->customer?->name ?? $customer->name)),
                    'phone' => (string) ($booking->phone ?? $booking->customer?->phone ?? $customer->phone ?? ''),
                    'guest_count' => (int) ($booking->guest_count ?? 0),
                    'date' => $booking->expected_time?->format('d/m/y') ?? '—',
                    'time' => $booking->expected_time?->format('g:iA') ?? '—',
                    'status' => (string) ($booking->status ?? 'pending'),
                    'buffet_tier_label' => $buffetTierLabel,
                    'expected_time' => $booking->expected_time?->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        return [
            'waiting_count' => $waitingCount,
            'estimated_wait_minutes' => max($estimatedWaitMinutes, 0),
            'active_queues' => $activeQueuePayload,
            'booking_history' => $history,
            'buffet_tiers' => BuffetTier::query()
                ->orderBy('price')
                ->orderBy('tier_name')
                ->get()
                ->map(fn (BuffetTier $tier): array => [
                    'id' => (int) $tier->id,
                    'label' => trim((string) $tier->tier_name).' - '.number_format((float) $tier->price).' ກີບ',
                ])
                ->values()
                ->all(),
            'customer_profile' => [
                'name' => (string) ($customer->name ?? ''),
                'phone' => (string) ($customer->phone ?? ''),
            ],
        ];
    }
}
