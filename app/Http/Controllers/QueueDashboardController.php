<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BuffetTier;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Table;
use App\Services\QueueBoardBroadcastService;
use App\Services\QueueSequenceService;
use App\Support\DiningSessionTime;
use App\Support\PhoneNumber;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

// ແຜງຄິວ + ໂຕະ (Inertia partial reload)
class QueueDashboardController extends Controller
{
    public function __construct(private readonly QueueBoardBroadcastService $queueBoardBroadcast) {}

    /** @var array<int, Service>|null ບໍລິການ in_service ຍັງບໍ່ຊຳລະ ຕໍ່ໂຕະ (ແຄຊຕໍ່ request). */
    private ?array $activeUnpaidServiceMapCache = null;

    /**
     * ແຜ່ງໂຕະ → ບໍລິການທີ່ຍັງເປີດຢູ່ (in_service, ຍັງບໍ່ມີ payment).
     * ໃຊ້ກຳນົດສີແດງ «ມີລູກຄ້າ» — ບໍ່ສັບສົນກັບ readiness (ໂຕະພ້ອມ/ປິດປັບປຸງໃນຮ້ານ).
     *
     * @return array<int, Service>
     */
    private function activeUnpaidServiceByTableId(): array
    {
        if ($this->activeUnpaidServiceMapCache !== null) {
            return $this->activeUnpaidServiceMapCache;
        }

        $map = [];
        $services = Service::query()
            ->with(['booking.customer', 'booking.buffetTier', 'serviceDetails'])
            ->where('status', 'in_service')
            ->whereDoesntHave('payment')
            ->get();

        foreach ($services as $service) {
            foreach ($service->serviceDetails as $detail) {
                $tableId = (int) $detail->table_id;
                if ($tableId > 0 && ! isset($map[$tableId])) {
                    $map[$tableId] = $service;
                }
            }
        }

        return $this->activeUnpaidServiceMapCache = $map;
    }

    public function index(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => fn () => $this->stats(),
            'zones' => fn () => $this->zonesPayload(),
            'queue' => fn () => $this->waitingQueuePayload(),
            'skippedQueue' => fn () => $this->skippedQueuePayload(),
            'availableTables' => fn () => $this->availableTablesPayload(),
            'buffetTiers' => fn () => BuffetTier::query()->orderBy('id')->get(['id', 'tier_name', 'price']),
            'diningSessionHours' => DiningSessionTime::sessionHours(),
        ]);
    }

    // ຕົວເລກໂຕະ + ຄິວ (ແຜງເທິງ)
    private function stats(): array
    {
        // ເຊັກຈຳນວນໂຕະຫວ່າງ/ມີລູກຄ້າຈາກບໍລິການ in_service ຈິງ — ບໍ່ໃຊ້ usage_status ເພື່ອບໍ່ສັບສົນກັບ readiness (ປິດປັບປຸງ).
        $occupiedIds = array_keys($this->activeUnpaidServiceByTableId());
        $vacantReadyQuery = Table::query()->where('readiness', 'ready');
        if ($occupiedIds !== []) {
            $vacantReadyQuery->whereNotIn('id', $occupiedIds);
        }

        return [
            'totalCapacity' => (int) Table::query()->sum('capacity'),
            'availableTables' => (int) $vacantReadyQuery->count(),
            'occupiedTables' => count($occupiedIds),
            // ນັບຄິວລໍຖ້າ: ແຕ່ລະແຖວ = 1 ຄິວ (ບໍ່ຊ້ຳກັບຄິວອື່ນ).
            'waitingQueue' => (int) Booking::query()->dashboardWaitingToday()->count(),
            // ນັບຈຳນວນຄິວທີ່ຖືກຂ້າມ: ແຕ່ລະແຖວ = 1 ຄິວ (ບໍ່ນັບຕາມ skip_count ຫຼາຍຄັ້ງ).
            'skippedQueue' => (int) Booking::query()->dashboardSkippedToday()->count(),
        ];
    }

    // ໂຕະຈັດຕາມໂຊນ — ສີແດງ/ຂຽວ/ເທົາ: maintenance=readiness not_ready, ມີລູກຄ້າ=ມີ in_service ບໍ່ຊຳລະ, ຫວ່າງ=ທີ່ເຫຼືອ
    private function zonesPayload(): array
    {
        $serviceByTable = $this->activeUnpaidServiceByTableId();

        $tables = Table::query()
            ->orderBy('zone')
            ->orderBy('table_no')
            ->get();

        return $tables
            ->groupBy('zone')
            ->filter(fn ($group) => $group->isNotEmpty())
            ->map(function ($group, string $zone) use ($serviceByTable): array {
                return [
                    'id' => $zone,
                    'title' => $zone === 'vip' ? 'ໂຊນ VIP' : 'ໂຊນທຳມະດາ',
                    'tables' => $group->sortBy('table_no')->values()->map(function (Table $t) use ($serviceByTable): array {
                        $readiness = $t->readiness ?? 'ready';
                        // ເຊັກສະຖານະກົງຈິງ: ປິດປັບປຸງ (ຮ່າງກາຍ) ກ່ອນ; ບໍ່ດັ່ງນັ້ນເບິ່ງບໍລິການຄ້າງຊຳລະ.
                        if ($readiness === 'not_ready') {
                            return [
                                'id' => $t->id,
                                'table_no' => $t->table_no,
                                'capacity' => $t->capacity,
                                'readiness' => $readiness,
                                'status' => 'maintenance',
                                'is_vip_zone' => $t->isVipZone(),
                                'occupied_detail' => null,
                            ];
                        }

                        $svc = $serviceByTable[$t->id] ?? null;
                        if ($svc !== null) {
                            $activeBooking = $svc->booking;

                            return [
                                'id' => $t->id,
                                'table_no' => $t->table_no,
                                'capacity' => $t->capacity,
                                'readiness' => $readiness,
                                'status' => 'occupied',
                                'is_vip_zone' => $t->isVipZone(),
                                'occupied_detail' => $activeBooking ? [
                                    'booking_id' => $activeBooking->id,
                                    'queue_no' => $activeBooking->queue_no,
                                    'customer_name' => $activeBooking->customer_name ?? $activeBooking->customer?->name ?? '',
                                    'phone' => $activeBooking->phone ?? $activeBooking->customer?->phone ?? '',
                                    'guest_count' => $activeBooking->guest_count,
                                    'buffet_tier' => $activeBooking->buffetTier?->tier_name ?? '',
                                    'service_id' => $svc->id,
                                    'check_in_at' => $svc->start_time?->toIso8601String(),
                                ] : null,
                            ];
                        }

                        return [
                            'id' => $t->id,
                            'table_no' => $t->table_no,
                            'capacity' => $t->capacity,
                            'readiness' => $readiness,
                            'status' => 'available',
                            'is_vip_zone' => $t->isVipZone(),
                            'occupied_detail' => null,
                        ];
                    })->all(),
                ];
            })
            ->values()
            ->all();
    }

    // ຄິວລໍຖ້າ (ຍັງບໍ່ມີໂຕະ) — ຖືກເອີ້ນຢູ່ເທິງ, ຫຼັງນັ້ນ FIFO
    private function waitingQueuePayload(): array
    {
        $today = now()->toDateString();

        // ຄິວເອີ້ນຈາກລາຍການ «ຂ້າມແລ້ວ» (skip_count > 0) ສະແດງໃນຄອລຳຂ້າມຢ່າງດຽວ — ບໍ່ດັງຂຶ້ນເທິງຄິວລໍຖ້າ.
        $calling = Booking::query()
            ->whereDate('expected_time', $today)
            ->where('status', Booking::STATUS_CALLING)
            ->whereNull('table_id')
            ->where(function ($q): void {
                $q->whereNull('skip_count')->orWhere('skip_count', 0);
            })
            ->with(['customer', 'buffetTier'])
            ->orderByDesc('called_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Booking $b): array => $this->queueEntry($b))
            ->all();

        $waiting = $this->orderedDashboardQueuePayload(Booking::query()->dashboardWaitingToday());

        return array_merge($calling, $waiting);
    }

    // ຄິວທີ່ຂ້າມແລ້ວ — FIFO; ຄິວທີ່ເອີ້ນຄືນຈາກຂ້າມ (calling + skip_count > 0) ຢູ່ເທິງກຸ່ມນີ້ ບໍ່ໄປຄິວລໍຖ້າ.
    private function skippedQueuePayload(): array
    {
        $today = now()->toDateString();

        $callingFromSkipped = Booking::query()
            ->whereDate('expected_time', $today)
            ->where('status', Booking::STATUS_CALLING)
            ->whereNull('table_id')
            ->where('skip_count', '>', 0)
            ->with(['customer', 'buffetTier'])
            ->orderByDesc('called_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Booking $b): array => $this->queueEntry($b))
            ->all();

        $skippedOnly = $this->orderedDashboardQueuePayload(Booking::query()->dashboardSkippedToday());

        return array_merge($callingFromSkipped, $skippedOnly);
    }

    /** ລາຍການຄິວໃນແຜງ: eager load + ລຽງ queued_at/id ກົງກັນທຸກປະເພດຄິວ. */
    private function orderedDashboardQueuePayload(Builder $bookingsQuery): array
    {
        return $bookingsQuery
            ->with(['customer', 'buffetTier'])
            ->orderByRaw('case when queued_at is null then 1 else 0 end')
            ->orderBy('queued_at')
            ->orderBy('id')
            ->get()
            ->map(fn (Booking $b): array => $this->queueEntry($b))
            ->all();
    }

    // ແຖວຄິວໃຫ້ໜ້າ React
    private function queueEntry(Booking $b): array
    {
        $row = [
            'id' => $b->id,
            'queue_no' => $b->queue_no,
            'is_vip' => (bool) ($b->is_vip ?? false),
            'customer_name' => $b->customer_name ?? $b->customer?->name ?? '',
            'group_size' => $b->guest_count,
            'phone' => $b->phone ?? $b->customer?->phone ?? '',
            'buffet_type' => $b->buffetTier->tier_name,
            'status' => $b->status,
            'skip_count' => (int) ($b->skip_count ?? 0),
            'queued_at' => $b->queued_at?->toIso8601String(),
            'called_at' => $b->called_at?->toIso8601String(),
        ];

        return $row;
    }

    // ໂຕະຫວ່າງ (ເລືອກຕອນຈັບຄິວ): ພ້ອມໃຊ້ງານ + ບໍ່ມີບໍລິການຄ້າງຊຳລະເທິ່ງໂຕະນີ້
    private function availableTablesPayload(): array
    {
        $occupiedIds = array_keys($this->activeUnpaidServiceByTableId());
        $q = Table::query()
            ->where('readiness', 'ready');
        if ($occupiedIds !== []) {
            $q->whereNotIn('id', $occupiedIds);
        }

        return $q
            ->orderBy('zone')
            ->orderBy('table_no')
            ->get()
            ->map(fn (Table $t): array => [
                'id' => $t->id,
                'table_no' => $t->table_no,
                'capacity' => $t->capacity,
                'zone' => $t->zone,
                'is_vip_zone' => $t->isVipZone(),
            ])
            ->values()
            ->all();
    }

    public function storeQueue(Request $request): RedirectResponse
    {
        $request->merge([
            'phone' => PhoneNumber::digits((string) $request->input('phone', '')),
        ]);

        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:100'],
            'phone' => PhoneNumber::rules(),
            'guest_count' => ['required', 'integer', 'min:1', 'max:20'],
            'tier_id' => ['required', 'integer', 'exists:buffet_tiers,id'],
            'is_vip' => ['sometimes', 'boolean'],
        ], array_merge(PhoneNumber::messages(), [
            'guest_count.max' => 'ຈຳນວນຄົນສູງສຸດ 20 ທ່ານຕໍ່ຄິວ.',
        ]));

        $customerId = Customer::query()->where('phone', $data['phone'])->value('id');
        $isVip = (bool) ($data['is_vip'] ?? false);

        $booking = null;

        DB::transaction(function () use ($data, $customerId, $isVip, &$booking): void {
            $expectedTime = now()->addHour();
            $queueDay = $expectedTime->toDateString();
            $queueNo = QueueSequenceService::allocateNextQueueNo($queueDay, $isVip);

            $booking = Booking::query()->create([
                'customer_id' => $customerId !== null ? (int) $customerId : null,
                'customer_name' => $data['customer_name'],
                'phone' => $data['phone'],
                'tier_id' => $data['tier_id'],
                'table_id' => null,
                'queue_no' => $queueNo,
                'is_vip' => $isVip,
                'queue_day' => $queueDay,
                'guest_count' => $data['guest_count'],
                'expected_time' => $expectedTime,
                'queued_at' => now(),
                'status' => 'waiting',
                'skip_count' => 0,
            ]);
        });

        $booking?->load('buffetTier');

        Inertia::flash([
            'print_queue_ticket' => [
                'restaurant_name' => 'OSHINEI',
                'queue_no' => $booking?->queue_no,
                'is_vip' => (bool) ($booking?->is_vip ?? false),
                'guest_count' => (int) ($booking?->guest_count ?? 0),
                'buffet_tier' => $booking?->buffetTier?->tier_name ?? '—',
                'booking_type' => 'Walk-in',
                'printed_at' => now()->toIso8601String(),
            ],
        ]);

        return back()->with('success', 'ບັນທຶກຂໍ້ມູນສຳເລັດແລ້ວ');
    }

    public function callQueue(Request $request, Booking $booking): RedirectResponse
    {
        $this->ensureCallable($booking);

        if ($booking->status === Booking::STATUS_CALLING) {
            $booking->update(['called_at' => now()]);
        } else {
            $booking->update([
                'status' => Booking::STATUS_CALLING,
                'called_at' => now(),
            ]);
        }

        $this->queueBoardBroadcast->dispatch();

        return back()->with('success', 'ເອີ້ນຄິວແລ້ວ');
    }

    public function skipQueue(Request $request, Booking $booking): RedirectResponse
    {
        $wasCalling = $booking->status === Booking::STATUS_CALLING;
        $this->ensureSkippable($booking);

        DB::transaction(function () use ($booking): void {
            $booking->increment('skip_count');
            $booking->refresh();

            if ((int) $booking->skip_count >= Booking::AUTO_CANCEL_AFTER_SKIP_COUNT) {
                $booking->update(['status' => 'cancelled']);
            } else {
                $booking->update(['status' => 'skipped']);
            }
        });

        if ($wasCalling) {
            $this->queueBoardBroadcast->dispatch();
        }

        return back()->with('success', 'ບັນທຶກຂໍ້ມູນສຳເລັດແລ້ວ');
    }

    public function cancelQueue(Request $request, Booking $booking): RedirectResponse
    {
        $this->ensureCancellableQueue($booking);

        $wasCalling = $booking->status === Booking::STATUS_CALLING;
        $booking->update(['status' => 'cancelled']);

        if ($wasCalling) {
            $this->queueBoardBroadcast->dispatch();
        }

        return back();
    }

    public function updateTableStatus(Request $request, Table $table): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'string', 'in:available,occupied'],
        ]);

        $table->update(['usage_status' => $data['status']]);

        return back();
    }

    public function assignBookingToTable(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'booking_id' => ['required', 'integer', 'exists:bookings,id'],
            'table_id' => ['nullable', 'integer', 'exists:tables,id'],
            'table_ids' => ['nullable', 'array', 'min:1'],
            'table_ids.*' => ['required', 'integer', 'exists:tables,id'],
        ]);

        $booking = Booking::query()->findOrFail($data['booking_id']);
        $selectedTableIds = $this->normalizedAssignmentTableIds($data);
        if ($selectedTableIds === []) {
            throw ValidationException::withMessages([
                'table_id' => 'ກະລຸນາເລືອກໂຕະ.',
            ]);
        }
        $tables = Table::query()->whereIn('id', $selectedTableIds)->get()->keyBy('id');

        $this->ensureAssignableForTable($booking);

        $occupiedTableIds = Service::activeUnpaidOccupiedTableIdSet();
        $capacityTotal = 0;
        $bookingIsVip = (bool) ($booking->is_vip ?? false);
        foreach ($selectedTableIds as $tableId) {
            $table = $tables->get($tableId);
            if (! $table instanceof Table) {
                throw ValidationException::withMessages([
                    'table_id' => 'ບໍ່ພົບຂໍ້ມູນໂຕະທີ່ເລືອກ.',
                ]);
            }
            if ($table->readiness !== 'ready') {
                throw ValidationException::withMessages([
                    'table_id' => 'ມີບາງໂຕະຍັງບໍ່ພ້ອມໃຊ້ງານ.',
                ]);
            }
            $tableIsVip = $table->isVipZone();
            if ($tableIsVip !== $bookingIsVip) {
                throw ValidationException::withMessages([
                    'table_id' => $bookingIsVip
                        ? 'ຄິວ VIP ຕ້ອງຈັບກັບໂຕະໂຊນ VIP ເທົ່ານັ້ນ.'
                        : 'ຄິວທຳມະດາບໍ່ສາມາດໃຊ້ໂຕະໂຊນ VIP ໄດ້.',
                ]);
            }
            // ເຊັກວ່າໂຕະຫວ່າງຕາມບໍລິການ (ບໍ່ໃຊ້ usage_status ຢ່າງດຽວ) ເພື່ອບໍ່ສັບສົນກັບສະຖານະຮ່າງກາຍໂຕະ.
            if (isset($occupiedTableIds[$tableId])) {
                throw ValidationException::withMessages([
                    'table_id' => 'ມີບາງໂຕະມີລູກຄ້າ/ບໍລິການຢູ່ແລ້ວ.',
                ]);
            }
            $capacityTotal += (int) $table->capacity;
        }

        if ((int) $booking->guest_count > $capacityTotal) {
            throw ValidationException::withMessages([
                'table_id' => 'ຄວາມຈຸໂຕະລວມຍັງບໍ່ພໍສຳລັບຈຳນວນຄົນ.',
            ]);
        }

        $service = null;

        DB::transaction(function () use ($booking, $tables, $selectedTableIds, &$service): void {
            foreach ($selectedTableIds as $tableId) {
                $table = $tables->get($tableId);
                if ($table instanceof Table) {
                    $table->update(['usage_status' => 'occupied']);
                }
            }
            $primaryTableId = $selectedTableIds[0] ?? null;
            $booking->update([
                'table_id' => $primaryTableId,
                'status' => 'called',
                // ຈຸດເວລາທີ່ເລີ່ມເອີ້ນຄິວເຂົ້ານັ່ງໂຕະ ເພື່ອນຳໄປຄຳນວນ waiting time.
                'called_at' => $booking->called_at ?? now(),
            ]);
            $booking->refresh();
            $service = Service::ensureOpenSessionForSeatedBooking($booking, $selectedTableIds);
        });

        $booking->load('buffetTier');
        $sessionHours = DiningSessionTime::sessionHours();
        $startTime = $service?->start_time ?? now();
        $endTime = DiningSessionTime::projectedEnd($startTime, $sessionHours);
        $primaryTableId = $selectedTableIds[0] ?? null;
        $primaryTable = $primaryTableId !== null ? $tables->get((int) $primaryTableId) : null;
        $zoneLine = ($primaryTable instanceof Table && $primaryTable->isVipZone()) ? 'VIP Room' : 'Standard';
        $tableNos = collect($selectedTableIds)
            ->map(fn (int $id): ?string => $tables->get($id)?->table_no)
            ->filter()
            ->values()
            ->all();

        $this->queueBoardBroadcast->dispatch();

        Inertia::flash([
            'print_service_paper' => [
                'table_no' => $tableNos[0] ?? '—',
                'table_nos' => $tableNos,
                'queue_no' => $booking->queue_no,
                'service_id' => $service?->id,
                'buffet_tier' => $booking->buffetTier?->tier_name ?? '—',
                'guest_count' => (int) $booking->guest_count,
                'zone' => $zoneLine,
                'start_time' => $startTime->toIso8601String(),
                'end_time' => $endTime->toIso8601String(),
                'session_hours' => $sessionHours,
            ],
        ]);

        return back();
    }

    /**
     * ຮັບ table_id ແບບເກົ່າ ຫຼື table_ids ແບບໃໝ່ ແລ້ວປັບໃຫ້ເປັນ array<int> ບໍ່ຊ້ຳ.
     *
     * @param  array<string,mixed>  $data
     * @return array<int>
     */
    private function normalizedAssignmentTableIds(array $data): array
    {
        $tableIds = [];
        if (isset($data['table_ids']) && is_array($data['table_ids'])) {
            $tableIds = $data['table_ids'];
        } elseif (! empty($data['table_id'])) {
            $tableIds = [$data['table_id']];
        }

        return collect($tableIds)
            ->map(fn ($id): int => (int) $id)
            ->filter(fn (int $id): bool => $id > 0)
            ->unique()
            ->values()
            ->all();
    }

    private function ensureSkippable(Booking $booking): void
    {
        $this->assertQueueHasNoTable($booking, 'ຄິວນີ້ບໍ່ສາມາດຂ້າມໄດ້.');
        $this->assertQueueStatus(
            $booking,
            [...Booking::STATUSES_WAITLIST, 'skipped', Booking::STATUS_CALLING],
            'ຄິວນີ້ບໍ່ສາມາດຂ້າມໄດ້.'
        );
    }

    private function ensureCancellableQueue(Booking $booking): void
    {
        $this->assertQueueHasNoTable($booking, 'ຄິວນີ້ບໍ່ສາມາດຍົກເລີກໄດ້.');
        $this->assertQueueStatus(
            $booking,
            [...Booking::STATUSES_WAITLIST, 'skipped', Booking::STATUS_CALLING],
            'ຄິວນີ້ບໍ່ສາມາດຍົກເລີກໄດ້.'
        );
    }

    // ກວດວ່າຄິວນີ້ນັ່ງໂຕະໄດ້ (ລໍຖ້າ / ຂ້າມ, ຍັງບໍ່ມີໂຕະ)
    private function ensureAssignableForTable(Booking $booking): void
    {
        $this->assertQueueHasNoTable($booking, 'ຄິວນີ້ບໍ່ສາມາດດຳເນີນການໄດ້.');
        $this->assertQueueStatus(
            $booking,
            [...Booking::STATUSES_WAITLIST, 'skipped', Booking::STATUS_CALLING],
            'ຄິວນີ້ບໍ່ສາມາດດຳເນີນການໄດ້.'
        );
    }

    private function ensureCallable(Booking $booking): void
    {
        $this->assertQueueHasNoTable($booking, 'ຄິວນີ້ບໍ່ສາມາດເອີ້ນໄດ້.');
        // ລໍຖ້າ ຫຼື ຂ້າມແລ້ວ → ເອີ້ນຄືນເຂົ້າ calling; calling ຢູ່ແລ້ວ ອັບເດດ called_at ຄືນ.
        $this->assertQueueStatus(
            $booking,
            [...Booking::STATUSES_WAITLIST, 'skipped', Booking::STATUS_CALLING],
            'ຄິວນີ້ບໍ່ສາມາດເອີ້ນໄດ້.'
        );
    }

    private function assertQueueHasNoTable(Booking $booking, string $message): void
    {
        if ($booking->table_id !== null) {
            throw ValidationException::withMessages(['booking' => $message]);
        }
    }

    /**
     * @param  list<string>  $allowedStatuses
     */
    private function assertQueueStatus(Booking $booking, array $allowedStatuses, string $message): void
    {
        if (! in_array($booking->status, $allowedStatuses, true)) {
            throw ValidationException::withMessages(['booking' => $message]);
        }
    }
}
