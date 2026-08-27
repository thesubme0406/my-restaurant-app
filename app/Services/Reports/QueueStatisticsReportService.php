<?php

namespace App\Services\Reports;

use App\Models\Booking;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

/**
 * ສ້າງ payload ລາຍງານສະຖິຕິຄິວ — ແຍກອອກຈາກ ReportController ເພື່ອອ່ານງ່າຍ.
 */
class QueueStatisticsReportService
{
    /**
     * @param  'all'|'completed'|'skipped'|'cancelled'|'other'  $queueStatusFilter
     * @return array{rows: array<int, array<string,mixed>>, summary: array<string,mixed>}
     */
    public function build(string $from, string $to, string $queueStatusFilter = 'all'): array
    {
        $fromDate = ($from !== '' && strtotime($from) !== false)
            ? Carbon::parse($from)->startOfDay()
            : Carbon::now()->startOfMonth()->startOfDay();
        $toDate = ($to !== '' && strtotime($to) !== false)
            ? Carbon::parse($to)->endOfDay()
            : Carbon::now()->endOfDay();
        $hasCreatedAt = Schema::hasColumn('bookings', 'created_at');
        $bookingTimeCol = $hasCreatedAt ? 'bookings.created_at' : 'bookings.expected_time';
        $hasQueuedAt = Schema::hasColumn('bookings', 'queued_at');
        $hasQueueDay = Schema::hasColumn('bookings', 'queue_day');
        $hasSkipCount = Schema::hasColumn('bookings', 'skip_count');
        $fromDateStr = $fromDate->toDateString();
        $toDateStr = $toDate->toDateString();

        $bookings = Booking::query()
            ->select([
                'bookings.id',
                'bookings.queue_no',
                'bookings.guest_count',
                'bookings.expected_time',
                'bookings.status',
            ])
            ->when($hasSkipCount, fn ($q) => $q->addSelect('bookings.skip_count'))
            ->when($hasQueuedAt, fn ($q) => $q->addSelect('bookings.queued_at'))
            ->when($hasQueueDay, fn ($q) => $q->addSelect('bookings.queue_day'))
            ->selectRaw("{$bookingTimeCol} as booking_time_raw")
            ->selectRaw('COALESCE(customers.name, bookings.customer_name) as resolved_customer_name')
            ->leftJoin('customers', 'customers.id', '=', 'bookings.customer_id')
            ->when(
                $hasQueueDay,
                fn ($q) => $q->where(function ($q2) use ($fromDateStr, $toDateStr, $fromDate, $toDate, $bookingTimeCol): void {
                    $q2->whereBetween('bookings.queue_day', [$fromDateStr, $toDateStr])
                        ->orWhere(function ($q3) use ($fromDate, $toDate, $bookingTimeCol): void {
                            $q3->whereNull('bookings.queue_day')
                                ->whereBetween($bookingTimeCol, [$fromDate, $toDate]);
                        });
                }),
                fn ($q) => $q->whereBetween($bookingTimeCol, [$fromDate, $toDate])
            )
            ->orderByDesc('bookings.id')
            ->get();

        $completedTotal = 0;
        $cancelledTotal = 0;
        $skipEventsTotal = 0;
        foreach ($bookings as $booking) {
            $outcome = $this->outcomeBucket($booking);
            if ($outcome === 'completed') {
                $completedTotal++;
            } elseif ($outcome === 'cancelled') {
                $cancelledTotal++;
            }
            $skipEventsTotal += $this->skipEvents($booking);
        }

        $statusNorm = in_array($queueStatusFilter, ['all', 'completed', 'skipped', 'cancelled', 'other'], true)
            ? $queueStatusFilter
            : 'all';

        if ($statusNorm === 'all') {
            $rows = $this->buildDailyOutcomeRows($bookings, $hasQueueDay, $hasQueuedAt);
        } else {
            $rows = $this->buildFilteredStatusRows($bookings, $statusNorm, $hasQueueDay, $hasQueuedAt);
        }

        return [
            'rows' => $rows,
            'summary' => [
                'total_queue' => $completedTotal + $cancelledTotal,
                'completed_total' => $completedTotal,
                'cancelled_total' => $cancelledTotal,
                'skipped_total' => $skipEventsTotal,
                'skip_events_total' => $skipEventsTotal,
                'queue_status_filter' => $statusNorm,
                'label' => 'Queue statistics',
            ],
        ];
    }

    /**
     * @param  iterable<int, object>  $bookings
     * @return array<int, array<string, mixed>>
     */
    private function buildDailyOutcomeRows(iterable $bookings, bool $hasQueueDay, bool $hasQueuedAt): array
    {
        $byDay = [];
        foreach ($bookings as $booking) {
            $outcome = $this->outcomeBucket($booking);
            $skipEvents = $this->skipEvents($booking);
            if ($outcome === null && $skipEvents === 0) {
                continue;
            }

            $dayKey = $this->dayKey($booking, $hasQueueDay, $hasQueuedAt);
            if (! isset($byDay[$dayKey])) {
                $byDay[$dayKey] = [
                    'summary_date' => $dayKey,
                    'completed_count' => 0,
                    'cancelled_count' => 0,
                    'skipped_count' => 0,
                ];
            }
            if ($outcome === 'completed') {
                $byDay[$dayKey]['completed_count']++;
            } elseif ($outcome === 'cancelled') {
                $byDay[$dayKey]['cancelled_count']++;
            }
            $byDay[$dayKey]['skipped_count'] += $skipEvents;
        }
        krsort($byDay);

        return array_map(static function (array $row): array {
            $completed = (int) $row['completed_count'];
            $cancelled = (int) $row['cancelled_count'];

            return [
                'summary_date' => $row['summary_date'],
                'completed_count' => $completed,
                'cancelled_count' => $cancelled,
                'skipped_count' => (int) $row['skipped_count'],
                'day_total' => $completed + $cancelled,
            ];
        }, array_values($byDay));
    }

    /**
     * @param  iterable<int, object>  $bookings
     * @return array<int, array<string, mixed>>
     */
    private function buildFilteredStatusRows(
        iterable $bookings,
        string $statusNorm,
        bool $hasQueueDay,
        bool $hasQueuedAt,
    ): array {
        $byDay = [];
        foreach ($bookings as $booking) {
            if ($statusNorm === 'skipped') {
                $metric = $this->skipEvents($booking);
                if ($metric <= 0) {
                    continue;
                }
            } elseif ($statusNorm === 'other') {
                if ($this->outcomeBucket($booking) !== null) {
                    continue;
                }
                $metric = 1;
            } elseif ($this->outcomeBucket($booking) !== $statusNorm) {
                continue;
            } else {
                $metric = 1;
            }

            $dayKey = $this->dayKey($booking, $hasQueueDay, $hasQueuedAt);
            if (! isset($byDay[$dayKey])) {
                $byDay[$dayKey] = [
                    'summary_date' => $dayKey,
                    'status_count' => 0,
                ];
            }
            $byDay[$dayKey]['status_count'] += $metric;
        }
        krsort($byDay);

        return array_map(static function (array $row): array {
            return [
                'summary_date' => $row['summary_date'],
                'status_count' => (int) $row['status_count'],
            ];
        }, array_values($byDay));
    }

    private function dayKey(object $booking, bool $hasQueueDay, bool $hasQueuedAt): string
    {
        if ($hasQueueDay && ($booking->queue_day ?? null)) {
            return Carbon::parse($booking->queue_day)->toDateString();
        }
        if (isset($booking->booking_time_raw) && $booking->booking_time_raw) {
            return Carbon::parse($booking->booking_time_raw)->toDateString();
        }
        if ($hasQueuedAt && ($booking->queued_at ?? null)) {
            return Carbon::parse($booking->queued_at)->toDateString();
        }
        if ($booking->expected_time ?? null) {
            return Carbon::parse($booking->expected_time)->toDateString();
        }

        return '—';
    }

    /**
     * @return 'completed'|'cancelled'|null
     */
    private function outcomeBucket(object $booking): ?string
    {
        $status = strtolower(trim((string) ($booking->status ?? '')));
        $skipCount = (int) ($booking->skip_count ?? 0);

        if ($status === 'cancelled' || $skipCount >= Booking::AUTO_CANCEL_AFTER_SKIP_COUNT) {
            return 'cancelled';
        }

        if ($status === 'completed' || $status === 'finished') {
            return 'completed';
        }

        return null;
    }

    private function skipEvents(object $booking): int
    {
        return max(0, (int) ($booking->skip_count ?? 0));
    }
}
