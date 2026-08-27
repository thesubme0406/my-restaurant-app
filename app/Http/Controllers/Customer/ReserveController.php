<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BuffetTier;
use App\Services\QueueDisplayService;
use App\Support\BuffetTierLabel;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReserveController extends Controller
{
    public function __construct(private readonly QueueDisplayService $queueDisplay) {}

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
     *   queue_flow: array<string,mixed>,
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
        $todayString = $today->toDateString();
        $activeStatuses = QueueDisplayService::ACTIVE_QUEUE_STATUSES;
        $board = $this->queueDisplay->todayBoard();
        $waitingContext = $this->queueDisplay->waitingContextToday();

        $activeQueues = Booking::query()
            ->with(['buffetTier', 'customer'])
            ->where(function ($query) use ($customer): void {
                $query->where('customer_id', $customer->id)
                    ->orWhere('phone', $customer->phone);
            })
            ->whereDate('expected_time', '>=', $todayString)
            ->whereNull('table_id')
            ->whereIn('status', $activeStatuses)
            ->orderByRaw('case when queued_at is null then 1 else 0 end')
            ->orderBy('expected_time')
            ->orderBy('queued_at')
            ->orderBy('id')
            ->get();

        $activeQueuePayload = $activeQueues
            ->map(function (Booking $booking) use ($customer): array {
                return [
                    'id' => $booking->id,
                    'queue_no' => $this->queueDisplay->formatQueueNo($booking),
                    'is_vip' => (bool) ($booking->is_vip ?? false),
                    'status' => (string) $booking->status,
                    'guest_count' => (int) ($booking->guest_count ?? 0),
                    'customer_name' => (string) ($booking->customer_name ?: ($booking->customer?->name ?? $customer->name)),
                    'phone' => (string) ($booking->phone ?? $booking->customer?->phone ?? $customer->phone ?? ''),
                    'buffet_tier_label' => BuffetTierLabel::forBooking($booking->buffetTier),
                    'expected_time' => $booking->expected_time?->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        $todayCustomerQueues = $activeQueues
            ->filter(fn (Booking $booking): bool => $booking->expected_time?->toDateString() === $todayString)
            ->sortBy([
                fn (Booking $booking): int => $booking->queued_at === null ? 1 : 0,
                fn (Booking $booking): int => $booking->queued_at?->getTimestamp() ?? PHP_INT_MAX,
                fn (Booking $booking): int => (int) $booking->id,
            ])
            ->values();

        $customerFlow = $this->queueDisplay->customerQueueFlow($todayCustomerQueues, $waitingContext);

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
                return [
                    'id' => $booking->id,
                    'queue_no' => $this->queueDisplay->formatQueueNo($booking),
                    'is_vip' => (bool) ($booking->is_vip ?? false),
                    'customer_name' => (string) ($booking->customer_name ?: ($booking->customer?->name ?? $customer->name)),
                    'phone' => (string) ($booking->phone ?? $booking->customer?->phone ?? $customer->phone ?? ''),
                    'guest_count' => (int) ($booking->guest_count ?? 0),
                    'date' => $booking->expected_time?->format('d/m/y') ?? '—',
                    'time' => $booking->expected_time?->format('g:iA') ?? '—',
                    'status' => (string) ($booking->status ?? 'pending'),
                    'buffet_tier_label' => BuffetTierLabel::forBooking($booking->buffetTier),
                    'expected_time' => $booking->expected_time?->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        return [
            'waiting_count' => $waitingContext['count'],
            'queue_flow' => array_merge($board, $customerFlow),
            'active_queues' => $activeQueuePayload,
            'booking_history' => $history,
            'buffet_tiers' => BuffetTier::query()
                ->orderBy('price')
                ->orderBy('tier_name')
                ->get()
                ->map(fn (BuffetTier $tier): array => [
                    'id' => (int) $tier->id,
                    'label' => BuffetTierLabel::forSelect($tier),
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
