<?php

namespace App\Services\Reports;

use App\Models\Booking;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

/**
 * ສ້າງ payload ລາຍງານການຈອງຄິວ — ແຍກອອກຈາກ ReportController ເພື່ອອ່ານງ່າຍ.
 */
class QueueBookingReportService
{
    /**
     * @return array{rows: array<int, array<string,mixed>>, summary: array<string,mixed>}
     */
    public function build(string $from, string $to, string $tableZone = ''): array
    {
        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();
        $hasCreatedAt = Schema::hasColumn('bookings', 'created_at');
        $hasIsVip = Schema::hasColumn('bookings', 'is_vip');
        $zoneNorm = strtolower(trim($tableZone));
        if ($zoneNorm !== '' && ! in_array($zoneNorm, ['standard', 'vip'], true)) {
            $zoneNorm = '';
        }

        $query = Booking::query()
            ->selectRaw('bookings.id, bookings.queue_no, bookings.guest_count, bookings.expected_time, bookings.status')
            ->selectRaw('bookings.customer_name as booking_customer_name, bookings.phone as booking_phone')
            ->selectRaw($hasCreatedAt ? 'bookings.created_at as booking_created_at' : 'NULL as booking_created_at')
            ->selectRaw($hasIsVip ? 'bookings.is_vip' : '0 as is_vip')
            ->selectRaw('customers.name as customer_name, customers.phone as customer_phone')
            ->selectRaw('buffet_tiers.tier_name')
            ->leftJoin('customers', 'customers.id', '=', 'bookings.customer_id')
            ->leftJoin('buffet_tiers', 'buffet_tiers.id', '=', 'bookings.tier_id')
            ->where(function ($q) use ($fromDate, $toDate, $hasCreatedAt): void {
                $q->whereBetween('bookings.expected_time', [$fromDate, $toDate]);
                if ($hasCreatedAt) {
                    $q->orWhere(function ($inner) use ($fromDate, $toDate): void {
                        $inner->whereNull('bookings.expected_time')
                            ->whereBetween('bookings.created_at', [$fromDate, $toDate]);
                    });
                }
            });

        $this->applyBookingZoneFilter($query, $zoneNorm, $hasIsVip);

        $rows = $query->get()
            ->sort(fn ($a, $b): int => $this->compareForDisplay($a, $b))
            ->values()
            ->map(function ($row) use ($hasIsVip): array {
                $expectedAt = $row->expected_time ? Carbon::parse($row->expected_time) : null;
                $status = strtolower((string) ($row->status ?? ''));
                $createdAt = $row->booking_created_at ? Carbon::parse($row->booking_created_at) : null;
                $displayDate = $expectedAt?->format('Y-m-d') ?? $createdAt?->format('Y-m-d') ?? 'N/A';
                $isVip = $this->rowIsVip($row, $hasIsVip);

                return [
                    'queue_no' => $row->queue_no ?: ('BK-'.$row->id),
                    'booking_date' => $displayDate,
                    'customer_name' => $row->customer_name ?: ($row->booking_customer_name ?: 'N/A'),
                    'guest_count' => (int) ($row->guest_count ?? 0),
                    'tier_name' => $row->tier_name ?? 'N/A',
                    'phone' => $row->customer_phone ?: ($row->booking_phone ?: 'N/A'),
                    'is_vip' => $isVip,
                    'zone' => $isVip ? 'vip' : 'standard',
                    'zone_label' => $isVip ? 'ໂຊນ VIP' : 'ໂຊນທຳມະດາ',
                    'status' => $status !== '' ? $status : 'pending',
                ];
            })
            ->values()
            ->all();

        $pendingCount = count(array_filter($rows, fn ($r) => in_array($r['status'], ['pending', 'waiting'], true)));
        $confirmedCount = count(array_filter($rows, fn ($r) => in_array($r['status'], ['confirmed', 'called', 'checked-in'], true)));

        return [
            'rows' => $rows,
            'summary' => [
                'total_guests' => array_sum(array_column($rows, 'guest_count')),
                'pending_count' => $pendingCount,
                'confirmed_count' => $confirmedCount,
                'label' => 'Booking queue report',
            ],
        ];
    }

    private function rowIsVip(object $row, bool $hasIsVipColumn): bool
    {
        if ($hasIsVipColumn && (bool) ($row->is_vip ?? false)) {
            return true;
        }

        $queueNo = strtoupper(trim((string) ($row->queue_no ?? '')));

        return $queueNo !== '' && str_starts_with($queueNo, 'V');
    }

    /**
     * @param  Builder<Booking>  $query
     */
    private function applyBookingZoneFilter($query, string $zoneNorm, bool $hasIsVipColumn): void
    {
        if ($zoneNorm === '' || $zoneNorm === 'all') {
            return;
        }

        if ($zoneNorm === 'vip') {
            $query->where(function ($q) use ($hasIsVipColumn): void {
                if ($hasIsVipColumn) {
                    $q->where('bookings.is_vip', true);
                }
                $q->orWhereRaw("UPPER(TRIM(COALESCE(bookings.queue_no, ''))) LIKE 'V%'");
            });

            return;
        }

        if ($zoneNorm === 'standard') {
            $query->where(function ($q) use ($hasIsVipColumn): void {
                if ($hasIsVipColumn) {
                    $q->where(function ($inner): void {
                        $inner->where('bookings.is_vip', false)
                            ->orWhereNull('bookings.is_vip');
                    });
                }
                $q->where(function ($inner): void {
                    $inner->whereNull('bookings.queue_no')
                        ->orWhereRaw("UPPER(TRIM(bookings.queue_no)) NOT LIKE 'V%'");
                });
            });
        }
    }

    private function compareForDisplay(object $a, object $b): int
    {
        $priorityA = $this->statusPriority((string) ($a->status ?? ''));
        $priorityB = $this->statusPriority((string) ($b->status ?? ''));
        if ($priorityA !== $priorityB) {
            return $priorityA <=> $priorityB;
        }

        $timeA = $a->expected_time ? Carbon::parse($a->expected_time)->timestamp : PHP_INT_MAX;
        $timeB = $b->expected_time ? Carbon::parse($b->expected_time)->timestamp : PHP_INT_MAX;
        if ($timeA !== $timeB) {
            return $timeA <=> $timeB;
        }

        return strcmp((string) ($a->queue_no ?? ''), (string) ($b->queue_no ?? ''));
    }

    private function statusPriority(string $status): int
    {
        $normalized = strtolower(trim($status));

        if (in_array($normalized, ['waiting', 'pending', 'confirmed'], true)) {
            return 0;
        }

        if ($normalized === 'skipped') {
            return 1;
        }

        if (in_array($normalized, ['called', 'checked-in'], true)) {
            return 2;
        }

        if (in_array($normalized, ['completed', 'finished'], true)) {
            return 3;
        }

        if ($normalized === 'cancelled') {
            return 4;
        }

        return 2;
    }
}
