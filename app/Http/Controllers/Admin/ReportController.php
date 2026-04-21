<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
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
        ];
    }

    public function index(Request $request): Response
    {
        $type = (string) $request->query('type', 'income');
        $from = (string) $request->query('from', Carbon::now()->startOfMonth()->toDateString());
        $to = (string) $request->query('to', Carbon::now()->toDateString());
        $statusFilter = (string) $request->query('status_filter', 'all');
        $categoryId = (string) $request->query('category_id', 'all');

        if (! in_array($type, $this->allowedTypes(), true)) {
            $type = 'income';
        }

        $payload = $this->reportPayload($type, $from, $to, $statusFilter, $categoryId);

        return Inertia::render('Admin/Reports', [
            'initialType' => $type,
            'initialFrom' => $from,
            'initialTo' => $to,
            'initialStatusFilter' => $statusFilter,
            'initialCategoryId' => $categoryId,
            'menuCategories' => $this->menuCategoryOptions(),
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

        if (! in_array($type, $this->allowedTypes(), true)) {
            $type = 'income';
        }

        return response()->json($this->reportPayload($type, $from, $to, $statusFilter, $categoryId));
    }

    /**
     * @return array{rows: array<int, array<string,mixed>>, summary: array<string,mixed>}
     */
    private function reportPayload(string $type, string $from, string $to, string $statusFilter = 'all', string $categoryId = 'all'): array
    {
        if ($type === 'income') {
            return $this->incomePayload($from, $to);
        }

        if ($type === 'queue_statistics') {
            return $this->queueStatisticsPayload($from, $to);
        }

        if (in_array($type, ['queue_booking', 'queue_progress'], true)) {
            return $this->bookingReportPayload($from, $to);
        }

        if ($type === 'menu') {
            return $this->menuReportPayload($statusFilter, $categoryId);
        }

        if ($type === 'ingredient_usage') {
            return $this->usageReportPayload($from, $to);
        }

        if ($type === 'ingredient_purchase') {
            return $this->ingredientPurchasePayload($from, $to);
        }

        return [
            'rows' => [],
            'summary' => ['total' => 0, 'count' => 0, 'label' => 'No data yet'],
        ];
    }

    /**
     * @return array{rows: array<int, array<string,mixed>>, summary: array<string,mixed>}
     */
    private function incomePayload(string $from, string $to): array
    {
        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();

        $rows = Payment::query()
            ->selectRaw('payments.id as payment_id, payments.payment_time, payments.method, payments.total_amount')
            ->selectRaw('services.id as service_id')
            ->selectRaw('bookings.guest_count, buffet_tiers.tier_name, bookings.table_id')
            ->selectRaw('tables.table_no')
            ->join('services', 'services.id', '=', 'payments.service_id')
            ->join('bookings', 'bookings.id', '=', 'services.booking_id')
            ->leftJoin('buffet_tiers', 'buffet_tiers.id', '=', 'bookings.tier_id')
            ->leftJoin('tables', 'tables.id', '=', 'bookings.table_id')
            ->whereBetween('payments.payment_time', [$fromDate, $toDate])
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
    private function queueStatisticsPayload(string $from, string $to): array
    {
        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();
        $hasCreatedAt = Schema::hasColumn('bookings', 'created_at');
        $bookingTimeCol = $hasCreatedAt ? 'bookings.created_at' : 'bookings.expected_time';

        $rows = Booking::query()
            ->selectRaw('bookings.id, bookings.queue_no, bookings.guest_count, bookings.expected_time, bookings.status')
            ->selectRaw("{$bookingTimeCol} as booking_time")
            ->selectRaw('bookings.customer_name as booking_customer_name')
            ->selectRaw('customers.name as customer_name')
            ->selectRaw('services.start_time as service_start_time')
            ->leftJoin('customers', 'customers.id', '=', 'bookings.customer_id')
            ->leftJoin('services', 'services.booking_id', '=', 'bookings.id')
            ->whereBetween($bookingTimeCol, [$fromDate, $toDate])
            ->orderByDesc('bookings.id')
            ->get()
            ->map(function ($row): array {
                $bookingAt = $row->booking_time ? Carbon::parse($row->booking_time) : null;
                $serviceAt = $row->service_start_time ? Carbon::parse($row->service_start_time) : null;
                $isNonCompleted = in_array((string) $row->status, ['skipped', 'cancelled'], true);
                $actualMinutes = (! $isNonCompleted && $bookingAt && $serviceAt)
                    ? max($bookingAt->diffInMinutes($serviceAt), 0)
                    : null;
                $estimatedMinutes = $bookingAt && $row->expected_time
                    ? max($bookingAt->diffInMinutes(Carbon::parse($row->expected_time)), 0)
                    : null;

                return [
                    'queue_no' => $row->queue_no,
                    'customer_name' => $row->customer_name ?: ($row->booking_customer_name ?: 'N/A'),
                    'guest_count' => (int) ($row->guest_count ?? 0),
                    'booking_time' => $bookingAt?->format('Y-m-d H:i') ?? '—',
                    'estimated_wait_minutes' => $estimatedMinutes,
                    'actual_wait_minutes' => $actualMinutes,
                    'status' => (string) $row->status,
                ];
            })
            ->values()
            ->all();

        $actuals = array_values(array_filter(array_column($rows, 'actual_wait_minutes'), fn ($v) => $v !== null));
        $nonCompleted = array_filter($rows, fn ($r) => in_array($r['status'], ['skipped', 'cancelled'], true));

        return [
            'rows' => $rows,
            'summary' => [
                'total_queue' => count($rows),
                'avg_wait_minutes' => count($actuals) ? round(array_sum($actuals) / count($actuals), 1) : 0,
                'non_completed' => count($nonCompleted),
                'label' => 'Queue statistics',
            ],
        ];
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
     * @return array{rows: array<int, array<string,mixed>>, summary: array<string,mixed>}
     */
    private function menuReportPayload(string $statusFilter, string $categoryId): array
    {
        $menuCategoryColumn = Schema::hasColumn('menus', 'category_id') ? 'menus.category_id' : 'menus.catg_id';
        $normalizedStatus = in_array($statusFilter, ['all', 'active', 'inactive'], true) ? $statusFilter : 'all';

        $query = Menu::query()
            ->selectRaw('menus.id, menus.name, menus.image, menus.is_active')
            ->selectRaw('menu_catg.id as category_id, menu_catg.catg_name as category_name')
            ->leftJoin('menu_catg', 'menu_catg.id', '=', $menuCategoryColumn)
            ->orderBy('menus.id');

        if ($normalizedStatus === 'active') {
            $query->where('menus.is_active', true);
        } elseif ($normalizedStatus === 'inactive') {
            $query->where('menus.is_active', false);
        }

        if ($categoryId !== 'all' && is_numeric($categoryId)) {
            $query->where('menu_catg.id', (int) $categoryId);
        }

        $rows = $query->get()
            ->map(fn ($row): array => [
                'id' => (int) $row->id,
                'menu_code' => str_pad((string) $row->id, 3, '0', STR_PAD_LEFT),
                'menu_name' => $row->name ?? '—',
                'category_name' => $row->category_name ?? '—',
                'is_active' => (bool) ($row->is_active ?? false),
                'status_label' => (bool) ($row->is_active ?? false) ? 'ເປີດໃຊ້ງານ' : 'ປິດໃຊ້ງານ',
                'image_url' => $row->image ? '/storage/'.ltrim((string) $row->image, '/') : null,
            ])
            ->values()
            ->all();

        $activeCount = count(array_filter($rows, fn ($row) => (bool) $row['is_active']));

        return [
            'rows' => $rows,
            'summary' => [
                'total_menus' => count($rows),
                'active_menus' => $activeCount,
                'inactive_menus' => count($rows) - $activeCount,
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
    private function ingredientPurchasePayload(string $from, string $to): array
    {
        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();

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
            ->groupBy(
                'purchase_orders.id',
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

                return [
                    'id' => (int) ($row->po_id ?? 0),
                    'purchase_code' => str_pad((string) $displayId, 4, '0', STR_PAD_LEFT),
                    'purchase_date' => $displayDate ? Carbon::parse($displayDate)->format('m/d/Y') : '—',
                    'supplier_name' => $row->supplier_name ?? '—',
                    'total_price' => $total,
                    'po_status' => $rawStatus,
                    'po_status_label' => match ($rawStatus) {
                        'Received', 'Completed' => 'ເຄື່ອງເຂົ້າແລ້ວ',
                        'Ordered' => 'ກຳລັງຈັດສົ່ງ',
                        default => 'ກຳລັງລໍຖ້າ',
                    },
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
                'label' => 'Ingredient purchase report',
            ],
        ];
    }
}

