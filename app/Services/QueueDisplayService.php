<?php

namespace App\Services;

use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class QueueDisplayService
{
    /** @var list<string> */
    public const WAIT_STATUSES = Booking::STATUSES_WAITLIST;

    /** Waitlist + called-but-not-seated — matches admin dashboard «ຄິວລໍຖ້າ» panel. */
    public const ACTIVE_QUEUE_STATUSES = [
        ...Booking::STATUSES_WAITLIST,
        Booking::STATUS_CALLING,
    ];

    /**
     * @return array{
     *   date: string,
     *   updated_at: string,
     *   now_calling: ?array{id: int, queue_no: string, customer_name: string, guest_count: int, called_at: ?string, table_no: ?string},
     *   calling_history: list<array{id: int, queue_no: string, customer_name: string, guest_count: int, called_at: ?string, table_no: ?string}>,
     *   now_serving: ?string,
     *   up_next: list<string>,
     *   waiting_rows: list<array{id: int, position: int, queue_no: string, customer_name: string, guest_count: int, status: string, queued_at: ?string}>
     * }
     */
    public function todayBoard(): array
    {
        $today = Carbon::today()->toDateString();

        $waiting = $this->waitingTodayQuery($today)
            ->limit(5)
            ->get();

        $activeCalling = $this->activeCallingQuery($today)
            ->limit(5)
            ->get();

        $waitingRows = $waiting->map(function (Booking $booking, int $index): array {
            return [
                'id' => (int) $booking->id,
                'position' => $index + 1,
                'queue_no' => $this->formatQueueNo($booking),
                'customer_name' => trim((string) ($booking->resolved_customer_name ?? $booking->customer_name ?? '')) ?: '—',
                'guest_count' => (int) ($booking->guest_count ?? 0),
                'status' => (string) ($booking->status ?? 'waiting'),
                'queued_at' => $booking->queued_at?->toIso8601String(),
                'is_vip' => (bool) ($booking->is_vip ?? false),
            ];
        })->values()->all();

        $callingRows = $activeCalling
            ->map(fn (Booking $booking): array => $this->mapCallingRow($booking))
            ->values()
            ->all();

        $nowCalling = $callingRows[0] ?? null;
        $callingHistory = array_slice($callingRows, 1);

        return [
            'date' => Carbon::today()->format('d/m/Y'),
            'updated_at' => now()->toIso8601String(),
            'now_calling' => $nowCalling,
            'calling_history' => $callingHistory,
            'now_serving' => $nowCalling !== null ? $nowCalling['queue_no'] : null,
            'up_next' => array_column($waitingRows, 'queue_no'),
            'waiting_rows' => $waitingRows,
        ];
    }

    public function waitingCountToday(): int
    {
        return $this->waitingContextToday()['count'];
    }

    /**
     * @return array<int, int> booking id => 1-based position in today's waiting line
     */
    public function waitingPositionsToday(): array
    {
        return $this->waitingContextToday()['positions'];
    }

    /**
     * Single query for today's active queue line count and positions (reserve polling).
     * Counts calling (not yet seated) + waitlist — same as admin dashboard queue panel.
     *
     * @return array{count: int, calling_count: int, positions: array<int, int>, calling_positions: array<int, int>}
     */
    public function waitingContextToday(): array
    {
        $today = Carbon::today()->toDateString();

        $calling = $this->dashboardCallingTodayQuery($today)->get(['id']);
        $waiting = $this->waitingTodayQuery($today)->get(['id']);

        $callingPositions = [];
        foreach ($calling as $index => $booking) {
            $callingPositions[(int) $booking->id] = $index + 1;
        }

        $positions = [];
        $callingCount = $calling->count();
        foreach ($waiting as $index => $booking) {
            $positions[(int) $booking->id] = $callingCount + $index + 1;
        }

        return [
            'count' => $callingCount + $waiting->count(),
            'calling_count' => $callingCount,
            'positions' => $positions,
            'calling_positions' => $callingPositions,
        ];
    }

    /**
     * @param  Collection<int, Booking>  $customerTodayQueues
     * @param  array{count: int, calling_count: int, positions: array<int, int>, calling_positions: array<int, int>}  $waitingContext
     */
    public function customerQueueFlow(Collection $customerTodayQueues, array $waitingContext): array
    {
        $positions = $waitingContext['positions'] ?? [];
        $callingPositions = $waitingContext['calling_positions'] ?? [];

        $isCalled = $customerTodayQueues->contains(
            fn (Booking $b): bool => (string) $b->status === Booking::STATUS_CALLING
        );

        $aheadOfCustomer = null;
        $yourPosition = null;

        if ($customerTodayQueues->isNotEmpty()) {
            $firstCustomerQueueId = (int) $customerTodayQueues->first()->id;

            if ($isCalled) {
                $yourPosition = $callingPositions[$firstCustomerQueueId] ?? null;
                $aheadOfCustomer = 0;
            } else {
                $customerPosition = $positions[$firstCustomerQueueId] ?? null;
                if ($customerPosition !== null) {
                    $yourPosition = $customerPosition;
                    $aheadOfCustomer = max(0, $customerPosition - 1);
                }
            }
        }

        $totalQueue = $waitingContext['count'] ?? (count($positions) + count($callingPositions));
        $progressPct = 0;
        if ($isCalled) {
            $progressPct = 100;
        } elseif ($aheadOfCustomer !== null && $totalQueue > 0) {
            $progressPct = (int) round((($totalQueue - $aheadOfCustomer) / $totalQueue) * 100);
            $progressPct = max(0, min(100, $progressPct));
        }

        return [
            'ahead_of_you' => $aheadOfCustomer,
            'your_position' => $yourPosition,
            'progress_pct' => $progressPct,
            'is_called' => $isCalled,
        ];
    }

    public function formatQueueNo(Booking $booking): string
    {
        return $booking->queue_no ?: ('Q'.str_pad((string) $booking->id, 4, '0', STR_PAD_LEFT));
    }

    /**
     * @return array{id: int, queue_no: string, customer_name: string, guest_count: int, called_at: ?string, table_no: ?string}
     */
    private function mapCallingRow(Booking $booking): array
    {
        $tableNo = $booking->assigned_table_no ?? $booking->table?->table_no ?? null;

        return [
            'id' => (int) $booking->id,
            'queue_no' => $this->formatQueueNo($booking),
            'customer_name' => trim((string) ($booking->resolved_customer_name ?? $booking->customer_name ?? '')) ?: '—',
            'guest_count' => (int) ($booking->guest_count ?? 0),
            'called_at' => $booking->called_at?->toIso8601String(),
            'table_no' => $tableNo ? (string) $tableNo : null,
            'is_vip' => (bool) ($booking->is_vip ?? false),
        ];
    }

    private function waitingTodayQuery(string $today): Builder
    {
        return Booking::query()
            ->select([
                'bookings.id',
                'bookings.queue_no',
                'bookings.guest_count',
                'bookings.status',
                'bookings.expected_time',
                'bookings.queued_at',
                'bookings.customer_name',
                'bookings.is_vip',
            ])
            ->selectRaw('COALESCE(customers.name, bookings.customer_name) as resolved_customer_name')
            ->leftJoin('customers', 'customers.id', '=', 'bookings.customer_id')
            ->whereDate('bookings.expected_time', $today)
            ->whereNull('bookings.table_id')
            ->whereIn('bookings.status', self::WAIT_STATUSES)
            ->orderByRaw('case when bookings.queued_at is null then 1 else 0 end')
            ->orderBy('bookings.queued_at')
            ->orderBy('bookings.id');
    }

    /** ຄິວເອີ້ນແລ້ວ (ຍັງບໍ່ check-in) — ກອງ skip_count ແບບ admin dashboard. */
    private function dashboardCallingTodayQuery(string $today): Builder
    {
        return Booking::query()
            ->whereDate('expected_time', $today)
            ->where('status', Booking::STATUS_CALLING)
            ->whereNull('table_id')
            ->where(function (Builder $query): void {
                $query->whereNull('skip_count')->orWhere('skip_count', 0);
            })
            ->orderByDesc('called_at')
            ->orderByDesc('id');
    }

    /** ຄິວທີ່ຖືກເອີ້ນແລ້ວ ແຕ່ຍັງບໍ່ check-in — ສະແດງຢູ່ບອດຈົນກວ່າຈະຈັບຄິວໃສ່ໂຕະ ຫຼື ຍົກເລີກ */
    private function activeCallingQuery(string $today): Builder
    {
        return Booking::query()
            ->select([
                'bookings.id',
                'bookings.queue_no',
                'bookings.guest_count',
                'bookings.called_at',
                'bookings.customer_name',
                'bookings.table_id',
                'bookings.is_vip',
            ])
            ->selectRaw('COALESCE(customers.name, bookings.customer_name) as resolved_customer_name')
            ->selectRaw('tables.table_no as assigned_table_no')
            ->leftJoin('customers', 'customers.id', '=', 'bookings.customer_id')
            ->leftJoin('tables', 'tables.id', '=', 'bookings.table_id')
            ->whereDate('bookings.expected_time', $today)
            ->where('bookings.status', Booking::STATUS_CALLING)
            ->whereNull('bookings.table_id')
            ->where(function (Builder $query): void {
                $query->whereNull('bookings.skip_count')->orWhere('bookings.skip_count', 0);
            })
            ->orderByDesc('bookings.called_at')
            ->orderByDesc('bookings.id');
    }
}
