<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BuffetTier;
use App\Models\Customer;
use App\Models\Table;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class QueueDashboardController extends Controller
{
    /**
     * @return list<string>
     */
    private function waitlistStatuses(): array
    {
        return ['waiting', 'pending'];
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

    /**
     * @return array{
     *     totalCapacity: int,
     *     availableTables: int,
     *     occupiedTables: int,
     *     waitingQueue: int,
     *     skippedQueue: int
     * }
     */
    private function stats(): array
    {
        return [
            'totalCapacity' => (int) Table::query()->sum('capacity'),
            'availableTables' => Table::query()->where('status', 'available')->count(),
            'occupiedTables' => Table::query()->where('status', 'occupied')->count(),
            'waitingQueue' => Booking::query()
                ->whereIn('status', $this->waitlistStatuses())
                ->whereNull('table_id')
                ->count(),
            'skippedQueue' => Booking::query()
                ->where('status', 'skipped')
                ->whereNull('table_id')
                ->count(),
        ];
    }

    /**
     * @return list<array{id: string, title: string, tables: list<array<string, mixed>>}>
     */
    private function zonesPayload(): array
    {
        $tables = Table::query()
            ->with([
                'bookings' => fn ($q) => $q->with(['customer', 'buffetTier', 'services'])->latest('id'),
            ])
            ->orderBy('zone')
            ->orderBy('table_no')
            ->get();

        return $tables
            ->groupBy('zone')
            ->filter(fn ($group) => $group->isNotEmpty())
            ->map(function ($group, string $zone): array {
                return [
                    'id' => $zone,
                    'title' => $zone === 'vip' ? 'ໂຊນ VIP' : 'ໂຊນທຳມະດາ',
                    'tables' => $group->sortBy('table_no')->values()->map(function (Table $t): array {
                        $activeBooking = $t->bookings
                            ->first(fn (Booking $b) => in_array($b->status, ['called', 'confirmed', 'completed', 'finished'], true));
                        $activeService = $activeBooking?->services->sortByDesc('id')->first();

                        return [
                            'id' => $t->id,
                            'table_no' => $t->table_no,
                            'capacity' => $t->capacity,
                            'status' => $t->status,
                            'occupied_detail' => $activeBooking ? [
                                'booking_id' => $activeBooking->id,
                                'queue_no' => $activeBooking->queue_no,
                                'customer_name' => $activeBooking->customer_name ?? $activeBooking->customer?->name ?? '',
                                'phone' => $activeBooking->phone ?? $activeBooking->customer?->phone ?? '',
                                'guest_count' => $activeBooking->guest_count,
                                'buffet_tier' => $activeBooking->buffetTier?->tier_name ?? '',
                                'service_code' => $activeService?->service_code,
                                'check_in_at' => $activeService?->start_time?->toIso8601String(),
                            ] : null,
                        ];
                    })->all(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function waitingQueuePayload(): array
    {
        return Booking::query()
            ->with(['customer', 'buffetTier'])
            ->whereIn('status', $this->waitlistStatuses())
            ->whereNull('table_id')
            ->orderBy('id')
            ->get()
            ->map(fn (Booking $b): array => $this->queueEntry($b))
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function skippedQueuePayload(): array
    {
        return Booking::query()
            ->with(['customer', 'buffetTier'])
            ->where('status', 'skipped')
            ->whereNull('table_id')
            ->orderBy('id')
            ->get()
            ->map(fn (Booking $b): array => $this->queueEntry($b))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
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
        ];
    }

    /**
     * @return list<array{id: int, table_no: string, capacity: int, zone: string}>
     */
    private function availableTablesPayload(): array
    {
        return Table::query()
            ->where('status', 'available')
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
            $booking = Booking::query()->create([
                'customer_id' => $customerId !== null ? (int) $customerId : null,
                'customer_name' => $data['customer_name'],
                'phone' => $data['phone'],
                'tier_id' => $data['tier_id'],
                'table_id' => null,
                'queue_no' => '_',
                'guest_count' => $data['guest_count'],
                'expected_time' => now()->addHour(),
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

        $booking->increment('skip_count');
        $booking->update(['status' => 'skipped']);

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
            'status' => ['required', 'string', 'in:available,occupied,maintenance'],
        ]);

        $table->update(['status' => $data['status']]);

        return back();
    }

    public function assignBookingToTable(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'booking_id' => ['required', 'integer', 'exists:bookings,id'],
            'table_id' => ['required', 'integer', 'exists:tables,id'],
        ]);

        $booking = Booking::query()->findOrFail($data['booking_id']);
        $table = Table::query()->findOrFail($data['table_id']);

        $this->ensureAssignableForTable($booking);

        if ($table->status !== 'available') {
            throw ValidationException::withMessages([
                'table_id' => 'ໂຕະນີ້ບໍ່ວ່າງ.',
            ]);
        }

        if ($booking->guest_count > $table->capacity) {
            throw ValidationException::withMessages([
                'table_id' => 'ໂຕະນີ້ບັນຈຸບໍ່ພໍ.',
            ]);
        }

        DB::transaction(function () use ($booking, $table): void {
            $table->update(['status' => 'occupied']);
            $booking->update([
                'table_id' => $table->id,
                'status' => 'called',
            ]);
        });

        return back();
    }

    private function ensureSkippable(Booking $booking): void
    {
        if ($booking->table_id !== null) {
            throw ValidationException::withMessages([
                'booking' => 'ຄິວນີ້ບໍ່ສາມາດຂ້າມໄດ້.',
            ]);
        }

        if (! in_array($booking->status, ['waiting', 'pending', 'skipped'], true)) {
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

        if (! in_array($booking->status, ['waiting', 'pending', 'skipped'], true)) {
            throw ValidationException::withMessages([
                'booking' => 'ຄິວນີ້ບໍ່ສາມາດຍົກເລີກໄດ້.',
            ]);
        }
    }

    /**
     * Waiting, pending, or skipped (no table yet) may be seated.
     */
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
