<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BuffetTier;
use App\Models\Menu;
use App\Models\MenuCatg;
use App\Models\Payment;
use App\Models\Service;
use App\Services\Reports\QueueBookingReportService;
use App\Services\Reports\QueueStatisticsReportService;
use App\Support\PaymentMethod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(
        private readonly QueueStatisticsReportService $queueStatisticsReport,
        private readonly QueueBookingReportService $queueBookingReport,
    ) {}

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
            'service',
            'menu',
            'ingredient_usage',
            'ingredient_purchase',
            'ingredient_import',
        ];
    }

    /**
     * ອ່ານພາຣາມິເຕີກັ່ນຕອງລາຍງານຈາກ URL ແລະ ບັງຄັບປະເພດທີ່ອະນຸຍາດເທົ່ານັ້ນ.
     *
     * @return array{
     *     type: string,
     *     from: string,
     *     to: string,
     *     status_filter: string,
     *     category_id: string,
     *     payment_method: string,
     *     tier_id: string,
     *     queue_status: string,
     *     search_query: string,
     *     purchase_status: string,
     *     supplier_id: string,
     *     zone: string
     * }
     */
    private function parseReportQuery(Request $request): array
    {
        $type = (string) $request->query('type', 'income');
        if (! in_array($type, $this->allowedTypes(), true)) {
            $type = 'income';
        }

        $zone = (string) $request->query('zone', '');
        if ($zone !== '' && ! in_array($zone, ['standard', 'vip'], true)) {
            $zone = '';
        }

        return [
            'type' => $type,
            'from' => (string) $request->query('from', Carbon::now()->startOfMonth()->toDateString()),
            'to' => (string) $request->query('to', Carbon::now()->toDateString()),
            'status_filter' => (string) $request->query('status_filter', 'all'),
            'category_id' => (string) $request->query('category_id', 'all'),
            'payment_method' => (string) $request->query('payment_method', 'all'),
            'tier_id' => (string) $request->query('tier_id', 'all'),
            'queue_status' => (string) $request->query('queue_status', 'all'),
            'search_query' => (string) $request->query('search_query', ''),
            'purchase_status' => (string) $request->query('purchase_status', 'all'),
            'supplier_id' => (string) $request->query('supplier_id', 'all'),
            'zone' => $zone,
        ];
    }

    public function index(Request $request): Response
    {
        $q = $this->parseReportQuery($request);

        $payload = $this->reportPayload(
            $q['type'],
            $q['from'],
            $q['to'],
            $q['status_filter'],
            $q['category_id'],
            $q['payment_method'],
            $q['tier_id'],
            $q['queue_status'],
            $q['search_query'],
            $q['purchase_status'],
            $q['supplier_id'],
            $q['zone'],
        );

        return Inertia::render('Admin/Reports', [
            'initialType' => $q['type'],
            'initialFrom' => $q['from'],
            'initialTo' => $q['to'],
            'initialStatusFilter' => $q['status_filter'],
            'initialCategoryId' => $q['category_id'],
            'initialPaymentMethod' => $q['payment_method'],
            'initialTierId' => $q['tier_id'],
            'initialQueueStatus' => $q['queue_status'],
            'initialSearchQuery' => $q['search_query'],
            'initialPurchaseStatus' => $q['purchase_status'],
            'initialSupplierId' => $q['supplier_id'],
            'initialTableZone' => $q['zone'],
            'menuCategories' => $this->menuCategoryOptions(),
            'buffetTiers' => $this->buffetTierOptions(),
            'supplierOptions' => $this->supplierOptions(),
            'initialRows' => $payload['rows'],
            'initialSummary' => $payload['summary'],
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $q = $this->parseReportQuery($request);

        return response()->json($this->reportPayload(
            $q['type'],
            $q['from'],
            $q['to'],
            $q['status_filter'],
            $q['category_id'],
            $q['payment_method'],
            $q['tier_id'],
            $q['queue_status'],
            $q['search_query'],
            $q['purchase_status'],
            $q['supplier_id'],
            $q['zone'],
        ));
    }

    /**
     * ກະຈາຍໄປຟັງຊັນສ້າງ payload ຕາມປະເພດລາຍງານ — ຜົນລັບເປັນ { rows, summary } ທຸກປະເພດ.
     *
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
        string $tableZone = '',
    ): array {
        if ($type === 'income') {
            return $this->incomePayload($from, $to, $paymentMethod, $tierId, $tableZone);
        }

        if ($type === 'queue_statistics') {
            return $this->queueStatisticsReport->build($from, $to, $queueStatus);
        }

        if (in_array($type, ['queue_booking', 'queue_progress'], true)) {
            return $this->queueBookingReport->build($from, $to, $tableZone);
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

        if ($type === 'service') {
            return $this->serviceReportPayload($from, $to, $tierId, $queueStatus, $tableZone);
        }

        return [
            'rows' => [],
            'summary' => ['total' => 0, 'count' => 0, 'label' => 'No data yet'],
        ];
    }

    /**
     * ລາຍງານລາຍຮັບ — ກັ່ນຕອງຕາມປະເພດການຊຳລະ ແລະ ບຸບເຟ້; ສະຫຼຸບຍອດລວມກົງກັບແຖວທີ່ກັ່ນແລ້ວ.
     *
     * @param  'all'|PaymentMethod::*  $paymentMethod
     * @param  'all'|numeric-string  $tierId
     * @param  ''|'standard'|'vip'  $tableZone
     * @return array{rows: array<int, array<string,mixed>>, summary: array<string,mixed>}
     */
    private function incomePayload(string $from, string $to, string $paymentMethod = 'all', string $tierId = 'all', string $tableZone = ''): array
    {
        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();

        $methodNorm = PaymentMethod::isValid($paymentMethod) ? $paymentMethod : 'all';
        $tierNorm = ($tierId !== '' && $tierId !== 'all' && is_numeric($tierId)) ? (int) $tierId : null;
        $zoneNorm = strtolower(trim($tableZone));
        if ($zoneNorm !== '' && ! in_array($zoneNorm, ['standard', 'vip'], true)) {
            $zoneNorm = '';
        }

        $query = Payment::query()
            ->selectRaw('payments.id as payment_id, payments.payment_time, payments.method, payments.total_amount')
            ->selectRaw('services.id as service_id')
            ->selectRaw('bookings.guest_count, buffet_tiers.tier_name, bookings.table_id, bookings.tier_id')
            ->selectRaw('staffs.name as staff_name, staffs.surname as staff_surname')
            ->selectRaw('tables.table_no')
            ->join('services', 'services.id', '=', 'payments.service_id')
            ->join('bookings', 'bookings.id', '=', 'services.booking_id')
            ->leftJoin('buffet_tiers', 'buffet_tiers.id', '=', 'bookings.tier_id')
            ->leftJoin('tables', 'tables.id', '=', 'bookings.table_id')
            ->leftJoin('staffs', 'staffs.id', '=', 'payments.staff_id')
            ->whereBetween('payments.payment_time', [$fromDate, $toDate]);

        if ($methodNorm !== 'all') {
            $query->where('payments.method', $methodNorm);
        }

        if ($tierNorm !== null) {
            $query->where('bookings.tier_id', $tierNorm);
        }

        $this->applyIncomeReportTableZoneFilter($query, $zoneNorm);

        $rows = $query
            ->orderByDesc('payments.payment_time')
            ->get()
            ->map(function ($row): array {
                $staffFullName = trim((string) (($row->staff_name ?? '').' '.($row->staff_surname ?? '')));

                return [
                    'payment_id' => (int) $row->payment_id,
                    'payment_time' => optional($row->payment_time)->format('Y-m-d H:i') ?? '—',
                    'service_id' => (int) ($row->service_id ?? 0),
                    'table_no' => $row->table_no ?? '—',
                    'tier_name' => $row->tier_name ?? '—',
                    'guest_count' => (int) ($row->guest_count ?? 0),
                    'method' => $row->method,
                    'closed_by' => $staffFullName !== '' ? $staffFullName : '—',
                    'total_amount' => (float) ($row->total_amount ?? 0),
                ];
            })
            ->values()
            ->all();

        $voidedQuery = Payment::query()
            ->onlyTrashed()
            ->join('services', 'services.id', '=', 'payments.service_id')
            ->join('bookings', 'bookings.id', '=', 'services.booking_id')
            ->whereBetween('payments.payment_time', [$fromDate, $toDate]);

        if ($methodNorm !== 'all') {
            $voidedQuery->where('payments.method', $methodNorm);
        }

        if ($tierNorm !== null) {
            $voidedQuery->where('bookings.tier_id', $tierNorm);
        }

        $this->applyIncomeReportTableZoneFilter($voidedQuery, $zoneNorm);

        return [
            'rows' => $rows,
            'summary' => [
                'total' => array_sum(array_column($rows, 'total_amount')),
                'count' => count($rows),
                'voided_total' => (float) $voidedQuery->sum('payments.total_amount'),
                'voided_count' => (int) $voidedQuery->count(),
                'label' => 'Income report',
            ],
        ];
    }

    /**
     * ກຣອງລາຍງານລາຍຮັບຕາມໂຊນໂຕະ (service_detail → tables) ກົງກັບໜ້າປະຫວັດຊຳລະ.
     *
     * @param  Builder<Payment>|\Illuminate\Database\Query\Builder  $query
     */
    private function applyIncomeReportTableZoneFilter($query, string $zoneNorm): void
    {
        if ($zoneNorm === '' || $zoneNorm === 'all') {
            return;
        }

        if ($zoneNorm === 'vip') {
            $query->whereExists(function ($sub): void {
                $sub->select(DB::raw(1))
                    ->from('service_detail')
                    ->join('tables', 'tables.id', '=', 'service_detail.table_id')
                    ->whereColumn('service_detail.service_id', 'services.id')
                    ->where(function ($q): void {
                        $q->where('tables.is_vip_zone', true)
                            ->orWhere('tables.zone', 'vip');
                    });
            });

            return;
        }

        if ($zoneNorm === 'standard') {
            $query->whereNotExists(function ($sub): void {
                $sub->select(DB::raw(1))
                    ->from('service_detail')
                    ->join('tables', 'tables.id', '=', 'service_detail.table_id')
                    ->whereColumn('service_detail.service_id', 'services.id')
                    ->where(function ($q): void {
                        $q->where('tables.is_vip_zone', true)
                            ->orWhere('tables.zone', 'vip');
                    });
            });
        }
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
    ): array {
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
     * ລາຍງານບໍລິການ (Service session): 1 service_id = 1 ແຖວ
     *
     * @param  'all'|numeric-string  $tierId
     * @param  'all'|'paid'|'unpaid'  $servicePaymentStatus
     * @param  ''|'standard'|'vip'  $tableZone
     * @return array{rows: array<int, array<string,mixed>>, summary: array<string,mixed>}
     */
    private function serviceReportPayload(
        string $from,
        string $to,
        string $tierId = 'all',
        string $servicePaymentStatus = 'all',
        string $tableZone = '',
    ): array {
        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();
        $tierNorm = ($tierId !== '' && $tierId !== 'all' && is_numeric($tierId)) ? (int) $tierId : null;
        $statusNorm = in_array($servicePaymentStatus, ['all', 'paid', 'unpaid'], true) ? $servicePaymentStatus : 'all';
        $zoneNorm = strtolower(trim($tableZone));
        if ($zoneNorm !== '' && ! in_array($zoneNorm, ['standard', 'vip'], true)) {
            $zoneNorm = '';
        }

        // Eager load ຄົບໃນຄັ້ງດຽວເພື່ອບໍ່ໃຊ້ N+1 ຕອນແປງແຖວ.
        $rows = Service::query()
            ->with([
                'booking.customer',
                'booking.buffetTier',
                'serviceDetails.table',
                'payment.staff',
            ])
            ->whereBetween('services.start_time', [$fromDate, $toDate])
            ->when($tierNorm !== null, fn ($q) => $q->whereHas('booking', fn ($bq) => $bq->where('tier_id', $tierNorm)))
            ->when($statusNorm === 'paid', fn ($q) => $q->whereHas('payment'))
            ->when($statusNorm === 'unpaid', fn ($q) => $q->whereDoesntHave('payment'))
            ->when($zoneNorm === 'vip', function ($q): void {
                $q->whereHas('serviceDetails.table', function ($tableQuery): void {
                    $tableQuery->where(function ($sub): void {
                        $sub->where('tables.is_vip_zone', true)
                            ->orWhere('tables.zone', 'vip');
                    });
                });
            })
            ->when($zoneNorm === 'standard', function ($q): void {
                $q->whereDoesntHave('serviceDetails', function ($sd): void {
                    $sd->whereHas('table', function ($tableQuery): void {
                        $tableQuery->where(function ($sub): void {
                            $sub->where('tables.is_vip_zone', true)
                                ->orWhere('tables.zone', 'vip');
                        });
                    });
                });
            })
            ->orderByDesc('services.start_time')
            ->get()
            ->map(function (Service $row): array {
                $booking = $row->booking;
                $payment = $row->payment;
                $start = $row->start_time ? Carbon::parse($row->start_time) : null;
                $end = $row->end_time ? Carbon::parse($row->end_time) : null;
                $duration = ($start && $end) ? max(0, $start->diffInMinutes($end)) : null;
                $isPaid = $payment !== null;
                $guestCount = (int) ($booking?->guest_count ?? 0);
                $tierPrice = (float) ($booking?->buffetTier?->price ?? 0);
                $fallbackTotal = $guestCount > 0 ? $guestCount * $tierPrice : $tierPrice;
                $staffFullName = trim((string) (($payment?->staff?->name ?? '').' '.($payment?->staff?->surname ?? '')));
                $tableNos = $row->serviceDetails
                    ->map(fn ($detail): string => (string) ($detail->table?->table_no ?? ''))
                    ->filter()
                    ->unique()
                    ->values()
                    ->all();

                return [
                    'service_id' => (int) $row->id,
                    'queue_no' => $booking?->queue_no ?? '—',
                    'table_no' => $tableNos !== [] ? implode(' + ', $tableNos) : '—',
                    'customer_name' => $booking?->customer?->name ?: ($booking?->customer_name ?: '—'),
                    'tier_name' => $booking?->buffetTier?->tier_name ?? '—',
                    'guest_count' => $guestCount,
                    'start_time' => $start?->format('Y-m-d H:i') ?? '—',
                    'end_time' => $end?->format('Y-m-d H:i') ?? '—',
                    'duration_min' => $duration,
                    'payment_status' => $isPaid ? 'paid' : 'unpaid',
                    'payment_method' => $payment?->method ?? '—',
                    'total_amount' => (float) ($payment?->total_amount ?? $fallbackTotal),
                    'closed_by' => $staffFullName !== '' ? $staffFullName : '—',
                ];
            })
            ->values()
            ->all();

        $paidCount = count(array_filter($rows, fn ($r) => $r['payment_status'] === 'paid'));
        $durations = array_values(array_filter(array_map(fn ($r) => $r['duration_min'], $rows), fn ($v) => is_numeric($v)));
        $avgDuration = count($durations) > 0 ? (int) round(array_sum($durations) / count($durations)) : 0;

        return [
            'rows' => $rows,
            'summary' => [
                'total_services' => count($rows),
                'paid_count' => $paidCount,
                'unpaid_count' => count($rows) - $paidCount,
                'avg_duration_min' => $avgDuration,
                'total_amount' => array_sum(array_column($rows, 'total_amount')),
                'label' => 'Service report',
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
