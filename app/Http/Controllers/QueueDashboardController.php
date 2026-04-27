<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BuffetTier;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Table;
use Carbon\Carbon;
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
    /** ຂ້າມຄົບຈຳນວນນີ້ → ຍົກເລີກຄິວອັດຕະໂນມັດ (ອອກຈາກແຜງ «ຂ້າມແລ້ວ»). */
    private const AUTO_CANCEL_AFTER_SKIP_COUNT = 2;

    /** @var array<int, Service>|null ບໍລິການ in_service ຍັງບໍ່ຊຳລະ ຕໍ່ໂຕະ (ແຄຊຕໍ່ request). */
    private ?array $activeUnpaidServiceMapCache = null;

    // ສະຖານະທີ່ນັບເປັນ «ລໍຖ້າ» ໃນຄິວ
    private function waitlistStatuses(): array
    {
        return ['waiting', 'pending', 'confirmed'];
    }

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
            'waitingQueue' => (int) $this->waitingBookingsForDashboard()->count(),
            // ນັບຈຳນວນຄິວທີ່ຖືກຂ້າມ: ແຕ່ລະແຖວ = 1 ຄິວ (ບໍ່ນັບຕາມ skip_count ຫຼາຍຄັ້ງ).
            'skippedQueue' => (int) $this->skippedBookingsForDashboard()->count(),
        ];
    }

    /** ຄິວລໍຖ້າໃນແຜງ (ສະຖານະລໍຖ້າ + ຍັງບໍ່ມີໂຕະ) — ໃຊ້ຮ່ວມກັນທັງນັບແລະລາຍການເພື່ອບໍ່ຊ້ຳ/ບໍ່ຂາດ. */
    private function waitingBookingsForDashboard(): Builder
    {
        $today = Carbon::today()->toDateString();

        return Booking::query()
            ->whereDate('expected_time', $today)
            ->whereIn('status', $this->waitlistStatuses())
            ->whereNull('table_id');
    }

    /** ຄິວທີ່ຂ້າມແລ້ວໃນແຜງ — ແຖວດຽວຕໍ່ຄົນ, ບໍ່ນັບຫຼາຍຄັ້ງຈາກ skip_count. */
    private function skippedBookingsForDashboard(): Builder
    {
        $today = Carbon::today()->toDateString();

        return Booking::query()
            ->whereDate('expected_time', $today)
            ->where('status', 'skipped')
            ->whereNull('table_id');
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
                                'occupied_detail' => $activeBooking ? [
                                    'booking_id' => $activeBooking->id,
                                    'queue_no' => $activeBooking->queue_no,
                                    'customer_name' => $activeBooking->customer_name ?? $activeBooking->customer?->name ?? '',
                                    'phone' => $activeBooking->phone ?? $activeBooking->customer?->phone ?? '',
                                    'guest_count' => $activeBooking->guest_count,
                                    'buffet_tier' => $activeBooking->buffetTier?->tier_name ?? '',
                                    'service_code' => $svc->service_code,
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
                            'occupied_detail' => null,
                        ];
                    })->all(),
                ];
            })
            ->values()
            ->all();
    }

    // ຄິວລໍຖ້າ (ຍັງບໍ່ມີໂຕະ) — ລຽງ FIFO: ເກົ່າສຸດຢູ່ເທິງ, ໃໝ່ສຸດຢູ່ລຸ່ມ (queued_at ↑, id ↑)
    private function waitingQueuePayload(): array
    {
        return $this->waitingBookingsForDashboard()
            ->with(['customer', 'buffetTier'])
            ->orderByRaw('case when queued_at is null then 1 else 0 end')
            ->orderBy('queued_at')
            ->orderBy('id')
            ->get()
            ->map(fn (Booking $b): array => $this->queueEntry($b))
            ->all();
    }

    // ຄິວທີ່ຂ້າມແລ້ວ — FIFO ດຽວກັບຄິວລໍຖ້າ (ເກົ່າສຸດເທິງ)
    private function skippedQueuePayload(): array
    {
        return $this->skippedBookingsForDashboard()
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
        return [
            'id' => $b->id,
            'queue_no' => $b->queue_no,
            'customer_name' => $b->customer_name ?? $b->customer?->name ?? '',
            'group_size' => $b->guest_count,
            'phone' => $b->phone ?? $b->customer?->phone ?? '',
            'buffet_type' => $b->buffetTier->tier_name,
            'skip_count' => (int) ($b->skip_count ?? 0),
            'queued_at' => $b->queued_at?->toIso8601String(),
        ];
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
            ])
            ->values()
            ->all();
    }

    public function storeQueue(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'regex:/^[0-9]{8,15}$/'],
            'guest_count' => ['required', 'integer', 'min:1', 'max:20'],
            'tier_id' => ['required', 'integer', 'exists:buffet_tiers,id'],
        ], [
            'phone.regex' => 'ເບີໂທຕ້ອງເປັນເລກເທົ່ານັ້ນ (8–15 ຫຼັກ).',
            'guest_count.max' => 'ຈຳນວນຄົນສູງສຸດ 20 ທ່ານຕໍ່ຄິວ.',
        ]);

        $customerId = Customer::query()->where('phone', $data['phone'])->value('id');

        DB::transaction(function () use ($data, $customerId): void {
            $expectedTime = now()->addHour();
            // queue_no ຈຳກັດ 10 ຕົວໃນ DB — ບໍ່ໃຊ້ uniqid ຍາວ; ຄ່າຊົ່ວຄາວສັ້ນ ກ່ອນປ່ຽນເປັນ Q+id ຫຼັງ insert.
            $tempQueueNo = 'T'.strtoupper(substr(bin2hex(random_bytes(5)), 0, 9));

            $booking = Booking::query()->create([
                'customer_id' => $customerId !== null ? (int) $customerId : null,
                'customer_name' => $data['customer_name'],
                'phone' => $data['phone'],
                'tier_id' => $data['tier_id'],
                'table_id' => null,
                'queue_no' => $tempQueueNo,
                'queue_day' => $expectedTime->toDateString(),
                'guest_count' => $data['guest_count'],
                'expected_time' => $expectedTime,
                'queued_at' => now(),
                'status' => 'waiting',
                'skip_count' => 0,
            ]);

            $booking->forceFill([
                'queue_no' => 'Q'.str_pad((string) $booking->id, 4, '0', STR_PAD_LEFT),
            ])->save();
        });

        return back();
    }

    public function skipQueue(Request $request, Booking $booking): RedirectResponse
    {
        $this->ensureSkippable($booking);

        DB::transaction(function () use ($booking): void {
            $booking->increment('skip_count');
            $booking->refresh();

            if ((int) $booking->skip_count >= self::AUTO_CANCEL_AFTER_SKIP_COUNT) {
                $booking->update(['status' => 'cancelled']);
            } else {
                $booking->update(['status' => 'skipped']);
            }
        });

        return back();
    }

    public function cancelQueue(Request $request, Booking $booking): RedirectResponse
    {
        $this->ensureCancellableQueue($booking);

        $booking->update(['status' => 'cancelled']);

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

        $capacityTotal = 0;
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
            // ເຊັກວ່າໂຕະຫວ່າງຕາມບໍລິການ (ບໍ່ໃຊ້ usage_status ຢ່າງດຽວ) ເພື່ອບໍ່ສັບສົນກັບສະຖານະຮ່າງກາຍໂຕະ.
            if ($table->hasActiveUnpaidService()) {
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

        DB::transaction(function () use ($booking, $tables, $selectedTableIds): void {
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
            Service::ensureOpenSessionForSeatedBooking($booking, $selectedTableIds);
        });

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
        if ($booking->table_id !== null) {
            throw ValidationException::withMessages([
                'booking' => 'ຄິວນີ້ບໍ່ສາມາດຂ້າມໄດ້.',
            ]);
        }

        if (! in_array($booking->status, ['waiting', 'pending', 'confirmed', 'skipped'], true)) {
            throw ValidationException::withMessages([
                'booking' => 'ຄິວນີ້ບໍ່ສາມາດຂ້າມໄດ້.',
            ]);
        }
    }

    private function ensureCancellableQueue(Booking $booking): void
    {
        if ($booking->table_id !== null) {
            throw ValidationException::withMessages([
                'booking' => 'ຄິວນີ້ບໍ່ສາມາດຍົກເລີກໄດ້.',
            ]);
        }

        if (! in_array($booking->status, ['waiting', 'pending', 'confirmed', 'skipped'], true)) {
            throw ValidationException::withMessages([
                'booking' => 'ຄິວນີ້ບໍ່ສາມາດຍົກເລີກໄດ້.',
            ]);
        }
    }

    // ກວດວ່າຄິວນີ້ນັ່ງໂຕະໄດ້ (ລໍຖ້າ / ຂ້າມ, ຍັງບໍ່ມີໂຕະ)
    private function ensureAssignableForTable(Booking $booking): void
    {
        if ($booking->table_id !== null) {
            throw ValidationException::withMessages([
                'booking' => 'ຄິວນີ້ບໍ່ສາມາດດຳເນີນການໄດ້.',
            ]);
        }

        if (! in_array($booking->status, [...$this->waitlistStatuses(), 'skipped'], true)) {
            throw ValidationException::withMessages([
                'booking' => 'ຄິວນີ້ບໍ່ສາມາດດຳເນີນການໄດ້.',
            ]);
        }
    }
}
