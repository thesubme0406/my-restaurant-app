<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BuffetTier;
use App\Models\Menu;
use App\Models\MenuCatg;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * @return list<string>
     */
    private function allowedTypes(): array
    {
        return [
            'income',
            'queue_statistics',
            'queue_booking',
            'queue_progress',
            'menu',
            'ingredient_usage',
            'ingredient_purchase',
            'ingredient_import',
        ];
    }

    public function index(Request $request): Response
    {
        $type = (string) $request->query('type', 'income');
        $from = (string) $request->query('from', Carbon::now()->startOfMonth()->toDateString());
        $to = (string) $request->query('to', Carbon::now()->toDateString());
        $statusFilter = (string) $request->query('status_filter', 'all');
        $categoryId = (string) $request->query('category_id', 'all');
        $paymentMethod = (string) $request->query('payment_method', 'all');
        $tierId = (string) $request->query('tier_id', 'all');
        $queueStatus = (string) $request->query('queue_status', 'all');
        $searchQuery = (string) $request->query('search_query', '');
        $purchaseStatus = (string) $request->query('purchase_status', 'all');
        $supplierId = (string) $request->query('supplier_id', 'all');

        if (! in_array($type, $this->allowedTypes(), true)) {
            $type = 'income';
        }

        $payload = $this->reportPayload(
            $type,
            $from,
            $to,
            $statusFilter,
            $categoryId,
            $paymentMethod,
            $tierId,
            $queueStatus,
            $searchQuery,
            $purchaseStatus,
            $supplierId,
            ''
        );

        return Inertia::render('Admin/Reports', [
            'initialType' => $type,
            'initialFrom' => $from,
            'initialTo' => $to,
            'initialStatusFilter' => $statusFilter,
            'initialCategoryId' => $categoryId,
            'initialPaymentMethod' => $paymentMethod,
            'initialTierId' => $tierId,
            'initialQueueStatus' => $queueStatus,
            'initialSearchQuery' => $searchQuery,
            'initialPurchaseStatus' => $purchaseStatus,
            'initialSupplierId' => $supplierId,
            'menuCategories' => $this->menuCategoryOptions(),
            'buffetTiers' => $this->buffetTierOptions(),
            'supplierOptions' => $this->supplierOptions(),
            'initialRows' => $payload['rows'],
            'initialSummary' => $payload['summary'],
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $type = (string) $request->query('type', 'income');
        $from = (string) $request->query('from', Carbon::now()->startOfMonth()->toDateString());
        $to = (string) $request->query('to', Carbon::now()->toDateString());
        $statusFilter = (string) $request->query('status_filter', 'all');
        $categoryId = (string) $request->query('category_id', 'all');
        $paymentMethod = (string) $request->query('payment_method', 'all');
        $tierId = (string) $request->query('tier_id', 'all');
        $queueStatus = (string) $request->query('queue_status', 'all');
        $searchQuery = (string) $request->query('search_query', '');
        $purchaseStatus = (string) $request->query('purchase_status', 'all');
        $supplierId = (string) $request->query('supplier_id', 'all');

        if (! in_array($type, $this->allowedTypes(), true)) {
            $type = 'income';
        }

        return response()->json($this->reportPayload(
            $type,
            $from,
            $to,
            $statusFilter,
            $categoryId,
            $paymentMethod,
            $tierId,
            $queueStatus,
            $searchQuery,
            $purchaseStatus,
            $supplierId,
            ''
        ));
    }

    /**
     * @return array{rows: array<int, array<string,mixed>>, summary: array<string,mixed>}
     */
    private function reportPayload(
        string $type,
        string $from,
        string $to,
        string $statusFilter = 'all',
        string $categoryId = 'all',
        string $paymentMethod = 'all',
        string $tierId = 'all',
        string $queueStatus = 'all',
        string $searchQuery = '',
        string $purchaseStatus = 'all',
        string $supplierId = 'all',
    ): array {
        if ($type === 'income') {
            return $this->incomePayload($from, $to, $paymentMethod, $tierId);
        }

        if ($type === 'queue_statistics') {
            return $this->queueStatisticsPayload($from, $to, $queueStatus);
        }

        if (in_array($type, ['queue_booking', 'queue_progress'], true)) {
            return $this->bookingReportPayload($from, $to);
        }

        if ($type === 'menu') {
            return $this->menuReportPayload($statusFilter, $categoryId, $tierId, $searchQuery, $from, $to);
        }

        if ($type === 'ingredient_usage') {
            return $this->usageReportPayload($from, $to);
        }

        if ($type === 'ingredient_purchase') {
            return $this->ingredientPurchasePayload($from, $to, $purchaseStatus, $supplierId);
        }

        if ($type === 'ingredient_import') {
            return $this->ingredientImportPayload($from, $to, $supplierId);
        }

        return [
            'rows' => [],
            'summary' => ['total' => 0, 'count' => 0, 'label' => 'No data yet'],
        ];
    }

    /**
     * @return array{rows: array<int, array<string,mixed>>, summary: array<string,mixed>}
     */
    /**
     * ລາຍງານລາຍຮັບ — ກັ່ນຕອງຕາມປະເພດການຊຳລະ ແລະ ບຸບເຟ້; ສະຫຼຸບຍອດລວມກົງກັບແຖວທີ່ກັ່ນແລ້ວ
     *
     * @param  'all'|'cash'|'transfer'  $paymentMethod
     * @param  'all'|numeric-string  $tierId
     */
    private function incomePayload(string $from, string $to, string $paymentMethod = 'all', string $tierId = 'all'): array
    {
        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();

        $methodNorm = in_array($paymentMethod, ['cash', 'transfer'], true) ? $paymentMethod : 'all';
        $tierNorm = ($tierId !== '' && $tierId !== 'all' && is_numeric($tierId)) ? (int) $tierId : null;

        $query = Payment::query()
            ->selectRaw('payments.id as payment_id, payments.payment_time, payments.method, payments.total_amount')
            ->selectRaw('services.id as service_id')
            ->selectRaw('bookings.guest_count, buffet_tiers.tier_name, bookings.table_id, bookings.tier_id')
            ->selectRaw('tables.table_no')
            ->join('services', 'services.id', '=', 'payments.service_id')
            ->join('bookings', 'bookings.id', '=', 'services.booking_id')
            ->leftJoin('buffet_tiers', 'buffet_tiers.id', '=', 'bookings.tier_id')
            ->leftJoin('tables', 'tables.id', '=', 'bookings.table_id')
            ->whereBetween('payments.payment_time', [$fromDate, $toDate]);

        if ($methodNorm !== 'all') {
            $query->where('payments.method', $methodNorm);
        }

        if ($tierNorm !== null) {
            $query->where('bookings.tier_id', $tierNorm);
        }

        $rows = $query
            ->orderByDesc('payments.payment_time')
            ->get()
            ->map(fn ($row): array => [
                'payment_id' => (int) $row->payment_id,
                'payment_time' => optional($row->payment_time)->format('Y-m-d H:i') ?? '—',
                'table_no' => $row->table_no ?? '—',
                'tier_name' => $row->tier_name ?? '—',
                'guest_count' => (int) ($row->guest_count ?? 0),
                'method' => $row->method,
                'total_amount' => (float) ($row->total_amount ?? 0),
            ])
            ->values()
            ->all();

        return [
            'rows' => $rows,
            'summary' => [
                'total' => array_sum(array_column($rows, 'total_amount')),
                'count' => count($rows),
                'label' => 'Income report',
            ],
        ];
    }

    /**
     * @return array{rows: array<int, array<string,mixed>>, summary: array<string,mixed>}
     */
    /**
     * ສະຫຼຸບສະຖິຕິຄິວແຍກຕາມສະຖານະ — ແຕ່ລະຄິວນັບ 1 ຄັ້ງ; ມື້ລວມຕາມວັນທີເຂົ້າຄິວ (queued_at ຫຼື expected_time)
     *
     * @param  'all'|'completed'|'skipped'|'cancelled'|'other'  $queueStatusFilter
     */
    private function queueStatisticsPayload(string $from, string $to, string $queueStatusFilter = 'all'): array
    {
        // ວັນທີເລີ່ມ/ສິ້ນ — ຖ້າວ່າງໃຫ້ໃຊ້ເດືອນນີ້ຄື backend ຫຼັກ
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
        $fromDateStr = $fromDate->toDateString();
        $toDateStr = $toDate->toDateString();

        // ຈັດກຸ່ມສະຖານະ: ສຳເລັດລວມທັງ completed ແລະ finished (ຫຼັງກິນຈົບ)
        $bucket = static function (string $status): string {
            $s = strtolower(trim($status));
            if ($s === 'skipped') {
                return 'skipped';
            }
            if ($s === 'cancelled') {
                return 'cancelled';
            }
            if ($s === 'completed' || $s === 'finished') {
                return 'completed';
            }

            return 'other';
        };

        $bookingQuery = Booking::query()
            ->select([
                'bookings.id',
                'bookings.queue_no',
                'bookings.guest_count',
                'bookings.expected_time',
                'bookings.status',
            ])
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
            ->orderByDesc('bookings.id');

        $bookings = $bookingQuery->get();

        $totals = ['completed' => 0, 'skipped' => 0, 'cancelled' => 0, 'other' => 0];
        foreach ($bookings as $b) {
            $totals[$bucket((string) $b->status)]++;
        }

        $statusNorm = in_array($queueStatusFilter, ['all', 'completed', 'skipped', 'cancelled', 'other'], true)
            ? $queueStatusFilter
            : 'all';

        if ($statusNorm === 'all') {
            // ສະຫຼຸບຕໍ່ມື້: ນັບຄິວແຍກສະຖານະ (ວັນອ້າງອີງ = queue_day ຖ້າມີ)
            $byDay = [];
            foreach ($bookings as $b) {
                $dayKey = $this->queueStatisticDayKey($b, $hasQueueDay, $hasQueuedAt);
                if (! isset($byDay[$dayKey])) {
                    $byDay[$dayKey] = [
                        'summary_date' => $dayKey,
                        'completed_count' => 0,
                        'skipped_count' => 0,
                        'cancelled_count' => 0,
                        'other_count' => 0,
                        'day_total' => 0,
                    ];
                }
                $bk = $bucket((string) $b->status);
                $byDay[$dayKey][$bk === 'completed' ? 'completed_count' : ($bk === 'skipped' ? 'skipped_count' : ($bk === 'cancelled' ? 'cancelled_count' : 'other_count'))]++;
                $byDay[$dayKey]['day_total']++;
            }
            krsort($byDay);
            $rows = array_map(static function (array $row): array {
                return [
                    'summary_date' => $row['summary_date'],
                    'completed_count' => (int) $row['completed_count'],
                    'skipped_count' => (int) $row['skipped_count'],
                    'cancelled_count' => (int) $row['cancelled_count'],
                    'other_count' => (int) $row['other_count'],
                    'day_total' => (int) $row['day_total'],
                ];
            }, array_values($byDay));
        } else {
            // ສະຫຼຸບຕໍ່ມື້ສະເພາະສະຖານະທີ່ເລືອກ — ສະແດງແຕ່ຕົວເລກ (ຈຳນວນຄິວ/ມື້)
            $byDay = [];
            foreach ($bookings as $b) {
                if ($bucket((string) $b->status) !== $statusNorm) {
                    continue;
                }
                $dayKey = $this->queueStatisticDayKey($b, $hasQueueDay, $hasQueuedAt);
                if (! isset($byDay[$dayKey])) {
                    $byDay[$dayKey] = [
                        'summary_date' => $dayKey,
                        'status_count' => 0,
                    ];
                }
                $byDay[$dayKey]['status_count']++;
            }
            krsort($byDay);
            $rows = array_map(static function (array $row): array {
                return [
                    'summary_date' => $row['summary_date'],
                    'status_count' => (int) $row['status_count'],
                ];
            }, array_values($byDay));
        }

        return [
            'rows' => $rows,
            'summary' => [
                'total_queue' => $bookings->count(),
                'completed_total' => $totals['completed'],
                'skipped_total' => $totals['skipped'],
                'cancelled_total' => $totals['cancelled'],
                'other_total' => $totals['other'],
                'non_completed' => $totals['skipped'] + $totals['cancelled'],
                'queue_status_filter' => $statusNorm,
                'label' => 'Queue statistics',
            ],
        ];
    }

    /**
     * ວັນອ້າງອີງສຳລັບຕາຕະລາງສະຖິຕິຄິວຕໍ່ມື້ (ໃຫ້ກົງກັບ queue_day ຂອງລະບົບຄິວ)
     */
    private function queueStatisticDayKey(object $booking, bool $hasQueueDay, bool $hasQueuedAt): string
    {
        if ($hasQueueDay && ($booking->queue_day ?? null)) {
            return Carbon::parse($booking->queue_day)->toDateString();
        }
        if ($hasQueuedAt && ($booking->queued_at ?? null)) {
            return Carbon::parse($booking->queued_at)->toDateString();
        }
        if ($booking->expected_time ?? null) {
            return Carbon::parse($booking->expected_time)->toDateString();
        }
        if (isset($booking->booking_time_raw) && $booking->booking_time_raw) {
            return Carbon::parse($booking->booking_time_raw)->toDateString();
        }

        return '—';
    }

    /**
     * @return array{rows: array<int, array<string,mixed>>, summary: array<string,mixed>}
     */
    private function bookingReportPayload(string $from, string $to): array
    {
        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();
        $today = Carbon::today()->startOfDay();
        $hasCreatedAt = Schema::hasColumn('bookings', 'created_at');

        $rows = Booking::query()
            ->selectRaw('bookings.id, bookings.queue_no, bookings.guest_count, bookings.expected_time, bookings.status')
            ->selectRaw('bookings.customer_name as booking_customer_name, bookings.phone as booking_phone')
            ->selectRaw($hasCreatedAt ? 'bookings.created_at as booking_created_at' : 'NULL as booking_created_at')
            ->selectRaw('customers.name as customer_name, customers.phone as customer_phone')
            ->selectRaw('buffet_tiers.tier_name')
            ->leftJoin('customers', 'customers.id', '=', 'bookings.customer_id')
            ->leftJoin('buffet_tiers', 'buffet_tiers.id', '=', 'bookings.tier_id')
            ->whereDate('bookings.expected_time', '>=', $today)
            ->whereBetween('bookings.expected_time', [$fromDate, $toDate])
            ->orderBy('bookings.expected_time')
            ->get()
            ->map(function ($row): array {
                $expectedAt = $row->expected_time ? Carbon::parse($row->expected_time) : null;
                $status = strtolower((string) ($row->status ?? ''));
                $createdAt = $row->booking_created_at ? Carbon::parse($row->booking_created_at) : null;
                $displayDate = $expectedAt?->format('Y-m-d') ?? $createdAt?->format('Y-m-d') ?? 'N/A';
                $displayTime = $expectedAt?->format('H:i') ?? $createdAt?->format('H:i') ?? 'N/A';

                return [
                    'queue_no' => $row->queue_no ?: ('BK-'.$row->id),
                    'booking_date' => $displayDate,
                    'expected_time' => $displayTime,
                    'customer_name' => $row->customer_name ?: ($row->booking_customer_name ?: 'N/A'),
                    'guest_count' => (int) ($row->guest_count ?? 0),
                    'tier_name' => $row->tier_name ?? 'N/A',
                    'phone' => $row->customer_phone ?: ($row->booking_phone ?: 'N/A'),
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

    /**
     * @return array<int, array{id: int, name: string}>
     */
    private function menuCategoryOptions(): array
    {
        return MenuCatg::query()
            ->orderBy('catg_name')
            ->get()
            ->map(fn (MenuCatg $category): array => [
                'id' => (int) $category->id,
                'name' => $category->catg_name,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id: int, name: string}>
     */
    private function buffetTierOptions(): array
    {
        return BuffetTier::query()
            ->orderBy('id')
            ->get()
            ->map(fn (BuffetTier $tier): array => [
                'id' => (int) $tier->id,
                'name' => (string) $tier->tier_name,
            ])
            ->values()
            ->all();
    }

    /**
     * ລາຍງານເມນູ — 1 ເມນູ = 1 ແຖວ (tiers ຖືກລວມໃນຖັນດຽວ); ກັ່ນຕອງສະຖານະ, ປະເພດ, Tier, search
     *
     * @return array{rows: array<int, array<string,mixed>>, summary: array<string,mixed>}
     */
    private function menuReportPayload(
        string $statusFilter,
        string $categoryId,
        string $tierId = 'all',
        string $searchQuery = '',
        string $from = '',
        string $to = '',
    ): array
    {
        $menuCategoryColumn = Schema::hasColumn('menus', 'category_id') ? 'category_id' : 'catg_id';
        $normalizedStatus = in_array($statusFilter, ['all', 'active', 'inactive'], true) ? $statusFilter : 'all';
        $tierNorm = ($tierId !== '' && $tierId !== 'all' && is_numeric($tierId)) ? (int) $tierId : null;
        $searchNorm = trim($searchQuery);
        $hasCreatedAt = Schema::hasColumn('menus', 'created_at');
        $fromDate = ($from !== '' && strtotime($from) !== false) ? Carbon::parse($from)->startOfDay() : null;
        $toDate = ($to !== '' && strtotime($to) !== false) ? Carbon::parse($to)->endOfDay() : null;

        $query = Menu::query()
            ->with([
                'category:id,catg_name',
                'buffetTiers:id,tier_name',
            ])
            ->orderBy('id');

        if ($normalizedStatus === 'active') {
            $query->where('is_active', true);
        } elseif ($normalizedStatus === 'inactive') {
            $query->where('is_active', false);
        }

        if ($categoryId !== 'all' && is_numeric($categoryId)) {
            $query->where($menuCategoryColumn, (int) $categoryId);
        }

        if ($tierNorm !== null) {
            $query->whereHas('buffetTiers', fn ($q) => $q->where('buffet_tiers.id', $tierNorm));
        }

        if ($searchNorm !== '') {
            $query->where(function ($q) use ($searchNorm): void {
                $q->where('name', 'like', "%{$searchNorm}%")
                    ->orWhere('name_en', 'like', "%{$searchNorm}%")
                    ->orWhereRaw('CAST(id AS CHAR) like ?', ["%{$searchNorm}%"]);
            });
        }

        if ($hasCreatedAt && $fromDate !== null) {
            $query->where('created_at', '>=', $fromDate);
        }
        if ($hasCreatedAt && $toDate !== null) {
            $query->where('created_at', '<=', $toDate);
        }

        $rows = $query->get()
            ->map(function (Menu $row): array {
                $tiers = $row->buffetTiers
                    ->pluck('tier_name')
                    ->filter()
                    ->unique()
                    ->values()
                    ->all();

                return [
                    'id' => (int) $row->id,
                    'menu_code' => str_pad((string) $row->id, 3, '0', STR_PAD_LEFT),
                    'menu_name' => $row->name ?? '—',
                    'category_name' => $row->category?->catg_name ?? '—',
                    'tier_name' => count($tiers) > 0 ? implode(', ', $tiers) : '—',
                    'tier_names' => $tiers,
                    'is_active' => (bool) ($row->is_active ?? false),
                    'status_label' => (bool) ($row->is_active ?? false) ? 'ເປີດໃຊ້ງານ' : 'ປິດໃຊ້ງານ',
                    'image_url' => $row->image ? '/storage/'.ltrim((string) $row->image, '/') : null,
                ];
            })
            ->values()
            ->all();

        $activeUnique = collect($rows)->filter(fn (array $row): bool => (bool) ($row['is_active'] ?? false))->count();

        return [
            'rows' => $rows,
            'summary' => [
                'total_rows' => count($rows),
                'active_menus' => (int) $activeUnique,
                'inactive_menus' => count($rows) - (int) $activeUnique,
                'label' => 'Menu report',
            ],
        ];
    }

    /**
     * @return array{rows: array<int, array<string,mixed>>, summary: array<string,mixed>}
     */
    private function usageReportPayload(string $from, string $to): array
    {
        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();

        $rows = \DB::table('usage_detail')
            ->selectRaw('usage_detail.id')
            ->selectRaw('usage_detail.usage_qty')
            ->selectRaw('stock_usage.usage_date')
            ->selectRaw('ingredients.ing_name as ingredient_name, ingredients.ing_unit as unit, ingredients.ing_quantity as remaining_qty')
            ->selectRaw('staffs.name as staff_name, staffs.surname as staff_surname')
            ->join('stock_usage', 'stock_usage.id', '=', 'usage_detail.usage_id')
            ->join('ingredients', 'ingredients.id', '=', 'usage_detail.ing_id')
            ->join('staffs', 'staffs.id', '=', 'stock_usage.staff_id')
            ->whereBetween('stock_usage.usage_date', [$fromDate, $toDate])
            ->orderByDesc('stock_usage.usage_date')
            ->orderByDesc('usage_detail.id')
            ->get()
            ->map(function ($row): array {
                $staffFullName = trim((string) ($row->staff_name.' '.$row->staff_surname));

                return [
                    'id' => (int) $row->id,
                    'ingredient_name' => $row->ingredient_name ?? '—',
                    'usage_date' => $row->usage_date ? Carbon::parse($row->usage_date)->format('m/d/Y') : '—',
                    'used_qty' => (float) ($row->usage_qty ?? 0),
                    'unit' => $row->unit ?? '—',
                    'remaining_qty' => (float) ($row->remaining_qty ?? 0),
                    'staff_name' => $staffFullName !== '' ? $staffFullName : '—',
                ];
            })
            ->values()
            ->all();

        return [
            'rows' => $rows,
            'summary' => [
                'total_rows' => count($rows),
                'total_used_qty' => array_sum(array_column($rows, 'used_qty')),
                'label' => 'Raw material usage report',
            ],
        ];
    }

    /**
     * @return array{rows: array<int, array<string,mixed>>, summary: array<string,mixed>}
     */
    private function ingredientPurchasePayload(string $from, string $to, string $purchaseStatus = 'all', string $supplierId = 'all'): array
    {
        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();
        $statusNorm = in_array($purchaseStatus, ['all', 'pending', 'received'], true) ? $purchaseStatus : 'all';
        $supplierNorm = ($supplierId !== '' && $supplierId !== 'all' && is_numeric($supplierId)) ? (int) $supplierId : null;

        $rows = DB::table('purchase_orders')
            ->selectRaw('purchase_orders.id as po_id, purchase_orders.po_status, purchase_orders.po_date')
            ->selectRaw('stock_ins.id as stock_in_id, stock_ins.total_price, stock_ins.import_date')
            ->selectRaw('suppliers.sup_name as supplier_name')
            ->selectRaw('staffs.name as staff_name, staffs.surname as staff_surname')
            ->selectRaw('SUM(stock_in_details.quantity * stock_in_details.cost_price) as calculated_total')
            ->leftJoin('stock_ins', 'stock_ins.po_id', '=', 'purchase_orders.id')
            ->leftJoin('stock_in_details', 'stock_in_details.imp_id', '=', 'stock_ins.id')
            ->leftJoin('suppliers', 'suppliers.id', '=', 'purchase_orders.sup_id')
            ->leftJoin('staffs', 'staffs.id', '=', 'purchase_orders.staff_id')
            ->whereBetween(DB::raw('COALESCE(stock_ins.import_date, purchase_orders.po_date)'), [$fromDate, $toDate])
            ->when(
                $statusNorm === 'received',
                fn ($q) => $q->whereIn('purchase_orders.po_status', ['Received', 'Completed'])
            )
            ->when(
                $statusNorm === 'pending',
                fn ($q) => $q->whereNotIn('purchase_orders.po_status', ['Received', 'Completed'])
            )
            ->when($supplierNorm !== null, fn ($q) => $q->where('purchase_orders.sup_id', $supplierNorm))
            ->groupBy(
                'purchase_orders.id',
                'purchase_orders.sup_id',
                'purchase_orders.po_status',
                'purchase_orders.po_date',
                'stock_ins.id',
                'stock_ins.total_price',
                'stock_ins.import_date',
                'suppliers.sup_name',
                'staffs.name',
                'staffs.surname'
            )
            ->orderByDesc(DB::raw('COALESCE(stock_ins.import_date, purchase_orders.po_date)'))
            ->orderByDesc('purchase_orders.id')
            ->get()
            ->map(function ($row): array {
                $rawStatus = (string) ($row->po_status ?? '');
                $staffFullName = trim((string) (($row->staff_name ?? '').' '.($row->staff_surname ?? '')));
                $total = (float) (($row->total_price ?? 0) ?: ($row->calculated_total ?? 0));
                $displayDate = $row->import_date ?: $row->po_date;
                $displayId = $row->stock_in_id ?? $row->po_id;

                $isReceived = in_array($rawStatus, ['Received', 'Completed'], true);

                return [
                    'id' => (int) ($row->po_id ?? 0),
                    'purchase_code' => str_pad((string) $displayId, 4, '0', STR_PAD_LEFT),
                    'purchase_date' => $displayDate ? Carbon::parse($displayDate)->format('m/d/Y') : '—',
                    'supplier_name' => $row->supplier_name ?? '—',
                    'total_price' => $total,
                    'po_status' => $isReceived ? 'received' : 'pending',
                    'po_status_label' => $isReceived ? 'ເຄື່ອງເຂົ້າແລ້ວ' : 'ກຳລັງລໍຖ້າ',
                    'buyer_name' => $staffFullName !== '' ? $staffFullName : '—',
                ];
            })
            ->values()
            ->all();

        return [
            'rows' => $rows,
            'summary' => [
                'total_orders' => count($rows),
                'total_amount' => array_sum(array_column($rows, 'total_price')),
                'purchase_status_filter' => $statusNorm,
                'supplier_id_filter' => $supplierNorm ?? 'all',
                'label' => 'Ingredient purchase report',
            ],
        ];
    }

    /**
     * @return array{rows: array<int, array<string,mixed>>, summary: array<string,mixed>}
     */
    private function ingredientImportPayload(string $from, string $to, string $supplierId = 'all'): array
    {
        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();
        $supplierNorm = ($supplierId !== '' && $supplierId !== 'all' && is_numeric($supplierId)) ? (int) $supplierId : null;

        $rows = DB::table('stock_ins')
            ->selectRaw('stock_ins.id as import_id, stock_ins.import_date')
            ->selectRaw('stock_in_details.id as detail_id, stock_in_details.quantity, stock_in_details.cost_price')
            ->selectRaw('ingredients.id as ingredient_id, ingredients.ing_name as ingredient_name, ingredients.ing_unit as unit')
            ->selectRaw('suppliers.id as supplier_id, suppliers.sup_name as supplier_name')
            ->leftJoin('stock_in_details', 'stock_in_details.imp_id', '=', 'stock_ins.id')
            ->leftJoin('ingredients', 'ingredients.id', '=', 'stock_in_details.ing_id')
            ->leftJoin('purchase_orders', 'purchase_orders.id', '=', 'stock_ins.po_id')
            ->leftJoin('suppliers', 'suppliers.id', '=', 'purchase_orders.sup_id')
            ->whereBetween('stock_ins.import_date', [$fromDate, $toDate])
            ->when($supplierNorm !== null, fn ($q) => $q->where('suppliers.id', $supplierNorm))
            ->orderByDesc('stock_ins.import_date')
            ->orderByDesc('stock_ins.id')
            ->orderBy('stock_in_details.id')
            ->get()
            ->map(function ($row): array {
                $qty = (float) ($row->quantity ?? 0);
                $cost = (float) ($row->cost_price ?? 0);

                return [
                    'id' => (int) ($row->detail_id ?? 0),
                    'import_date' => $row->import_date ? Carbon::parse($row->import_date)->format('m/d/Y H:i') : '—',
                    'import_id' => str_pad((string) ($row->import_id ?? 0), 4, '0', STR_PAD_LEFT),
                    'ingredient_name' => $row->ingredient_name ?? '—',
                    'quantity' => $qty,
                    'unit' => $row->unit ?? '—',
                    'quantity_with_unit' => trim(rtrim(rtrim(number_format($qty, 2, '.', ''), '0'), '.').' '.($row->unit ?? '')),
                    'supplier_name' => $row->supplier_name ?? '—',
                    'cost_per_unit' => $cost,
                    'line_total' => $qty * $cost,
                ];
            })
            ->values()
            ->all();

        return [
            'rows' => $rows,
            'summary' => [
                'total_rows' => count($rows),
                'total_import_amount' => array_sum(array_column($rows, 'line_total')),
                'unique_imports' => count(array_unique(array_column($rows, 'import_id'))),
                'label' => 'Ingredient import report',
            ],
        ];
    }

    /**
     * @return array<int, array{id: int, name: string}>
     */
    private function supplierOptions(): array
    {
        return DB::table('suppliers')
            ->select('id', 'sup_name')
            ->orderBy('sup_name')
            ->get()
            ->map(fn ($row): array => [
                'id' => (int) $row->id,
                'name' => (string) $row->sup_name,
            ])
            ->values()
            ->all();
    }

}

