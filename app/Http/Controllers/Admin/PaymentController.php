<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Service;
use App\Services\ActivityLogService;
use App\Support\PaymentMethod;
use App\Support\VipRoomCharge;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    private function paymentsIndexRoute(Request $request): string
    {
        return str_starts_with($request->path(), 'admin/')
            ? 'admin.payments'
            : 'staff.payments';
    }

    private function assertManager(Request $request): mixed
    {
        $staff = $request->user('staff');
        abort_if($staff === null || $staff->role !== 'manager', 403);

        return $staff;
    }

    private function paymentTableNo(Payment $payment): string
    {
        $payment->loadMissing(['service.serviceDetails.table']);
        $tableNos = $payment->service?->serviceDetails
            ?->map(fn ($detail): string => (string) ($detail->table?->table_no ?? ''))
            ->filter()
            ->unique()
            ->values()
            ->all() ?? [];

        return $tableNos !== [] ? implode(' + ', $tableNos) : '—';
    }

    private function findVoidedPaymentOrFail(int $paymentId): Payment
    {
        return Payment::query()->onlyTrashed()->findOrFail($paymentId);
    }

    /**
     * @return array<string, string>
     */
    private function listRedirectQuery(Request $request): array
    {
        return array_filter([
            'search' => (string) $request->query('search', ''),
            'method' => (string) $request->query('method', ''),
            'zone' => (string) $request->query('zone', ''),
            'from' => (string) $request->query('from', ''),
            'to' => (string) $request->query('to', ''),
            'show_deleted' => $request->boolean('show_deleted') ? '1' : null,
        ], fn ($v): bool => $v !== null && $v !== '');
    }

    /** ຄິວທີ່ນັ່ງໂຕະແລ້ວແຕ່ບໍ່ມີເຊດຊັນໃນ services — ເຕີມໃຫ້ລາຍການຊຳລະຄົບ. */
    private function materializeMissingServicesForSeatedBookings(): void
    {
        Booking::query()
            ->whereNotNull('table_id')
            ->whereIn('status', ['called', 'confirmed'])
            ->whereDoesntHave('services', function ($q): void {
                $q->where('status', 'in_service')
                    ->whereDoesntHave('payment');
            })
            ->orderBy('id')
            ->chunkById(100, function ($bookings): void {
                foreach ($bookings as $booking) {
                    Service::ensureOpenSessionForSeatedBooking($booking);
                }
            });
    }

    /**
     * @return array{items: list<array{label: string, amount: float}>, total: float, buffet_subtotal: float}
     */
    private function buildCheckoutPricing(Service $service): array
    {
        $service->loadMissing(['booking.buffetTier', 'serviceDetails.table']);
        $booking = $service->booking;
        $people = (int) ($booking?->guest_count ?? 0);
        $tierPrice = (float) ($booking?->buffetTier?->price ?? 0);
        $tierName = trim((string) ($booking?->buffetTier?->tier_name ?? ''));
        if ($tierName === '') {
            $tierName = '—';
        }
        $buffetSubtotal = $people > 0 ? $people * $tierPrice : $tierPrice;
        $buffetLabel = $people > 0 ? sprintf('%s × %d', $tierName, $people) : $tierName;
        $items = [
            ['label' => $buffetLabel, 'amount' => $buffetSubtotal],
        ];
        $hasVipTable = $service->serviceDetails->contains(
            fn ($detail): bool => $detail->table !== null && $detail->table->isVipZone()
        );
        if ($hasVipTable) {
            $items[] = ['label' => VipRoomCharge::labelLo(), 'amount' => (float) VipRoomCharge::AMOUNT_KIP];
        }

        return [
            'items' => $items,
            'total' => array_sum(array_column($items, 'amount')),
            'buffet_subtotal' => $buffetSubtotal,
        ];
    }

    private function mapActiveService(Service $service): array
    {
        $booking = $service->booking;
        $tableNos = $service->serviceDetails
            ->map(fn ($detail): string => (string) ($detail->table?->table_no ?? ''))
            ->filter()
            ->unique()
            ->values()
            ->all();
        $tableNo = $tableNos !== [] ? implode(' + ', $tableNos) : '—';
        $people = (int) ($booking?->guest_count ?? 0);
        $tierName = $booking?->buffetTier?->tier_name ?? '—';
        $tierPrice = (float) ($booking?->buffetTier?->price ?? 0);
        $pricing = $this->buildCheckoutPricing($service);
        $addOnTotal = max(0.0, $pricing['total'] - $pricing['buffet_subtotal']);

        return [
            'service_id' => $service->id,
            'service_code' => $service->service_code,
            'queue_no' => $booking?->queue_no ?: '—',
            'customer_name' => $booking?->customer?->name ?? $booking?->customer_name ?? '—',
            'guest_count' => $people,
            'table_no' => $tableNo,
            'buffet_tier' => $tierName,
            'check_in_time' => $service->start_time?->format('m/d/Y, h:i A') ?? '—',
            'tier_price' => $tierPrice,
            'add_on_total' => $addOnTotal,
            'items' => $pricing['items'],
            'total_amount' => $pricing['total'],
        ];
    }

    /** ກຣອງຕາມໂຊນໂຕະ (ທຳມະດາ vs VIP) — ກົງກັບ is_vip_zone / zone ໃນ tables. */
    private function applyPaymentTableZoneFilter(Builder $query, string $zone): void
    {
        $zone = strtolower(trim($zone));
        if ($zone === '' || $zone === 'all') {
            return;
        }

        if ($zone === 'vip') {
            $query->whereHas('service.serviceDetails.table', function (Builder $tableQuery): void {
                $tableQuery->where(function (Builder $sub): void {
                    $sub->where('tables.is_vip_zone', true)
                        ->orWhere('tables.zone', 'vip');
                });
            });

            return;
        }

        if ($zone === 'standard') {
            $query->whereDoesntHave('service.serviceDetails', function (Builder $sd): void {
                $sd->whereHas('table', function (Builder $tableQuery): void {
                    $tableQuery->where(function (Builder $sub): void {
                        $sub->where('tables.is_vip_zone', true)
                            ->orWhere('tables.zone', 'vip');
                    });
                });
            });
        }
    }

    /** ກອງຕາຕະລາງຊຳລະ + ສະຖິຕິໃຫ້ກົງກັນ */
    private function applyPaymentListFilters(Builder $query, array $filters): void
    {
        if ($filters['search'] !== '') {
            $q = $filters['search'];
            $query->where(function ($sub) use ($q): void {
                $sub->where('service_id', 'like', "%{$q}%")
                    ->orWhere('staff_id', 'like', "%{$q}%");
            });
        }
        if (PaymentMethod::isValid($filters['method'])) {
            $query->where('method', $filters['method']);
        }
        $this->applyPaymentTableZoneFilter($query, (string) ($filters['zone'] ?? ''));
        if ($filters['from'] !== '') {
            $query->whereDate('payment_time', '>=', $filters['from']);
        }
        if ($filters['to'] !== '') {
            $query->whereDate('payment_time', '<=', $filters['to']);
        }
    }

    /** ຄຳນວນສະຖິຕິຕາມຊ່ວງທີ່ກອງ (ກົງກັບລາຍການດ້ານລຸ່ມ) */
    private function summarizeFilteredPayments(Builder $base): array
    {
        return [
            'count' => (clone $base)->count(),
            'total' => (float) (clone $base)->sum('total_amount'),
            'cash' => (float) (clone $base)->where('method', PaymentMethod::CASH)->sum('total_amount'),
            'transfer' => (float) (clone $base)->where('method', PaymentMethod::TRANSFER)->sum('total_amount'),
            'credit_card' => (float) (clone $base)->where('method', PaymentMethod::CREDIT_CARD)->sum('total_amount'),
        ];
    }

    private function summarizeVoidedPayments(array $filters): array
    {
        $voidedBase = Payment::query()->onlyTrashed();
        $this->applyPaymentListFilters($voidedBase, $filters);

        return [
            'voided_count' => (clone $voidedBase)->count(),
            'voided_total' => (float) (clone $voidedBase)->sum('total_amount'),
        ];
    }

    private function mapPaymentRow(Payment $p, bool $includeDeletionMeta = false): array
    {
        $booking = $p->service?->booking;
        $tableNos = $p->service?->serviceDetails
            ?->map(fn ($detail): string => (string) ($detail->table?->table_no ?? ''))
            ->filter()
            ->unique()
            ->values()
            ->all() ?? [];
        $tableNo = $tableNos !== [] ? implode(' + ', $tableNos) : '—';

        $people = (int) ($booking?->guest_count ?? 0);
        $tierPrice = (float) ($booking?->buffetTier?->price ?? 0);
        $calculatedAmount = ($people > 0 ? $people * $tierPrice : $tierPrice);

        $row = [
            'id' => $p->id,
            'service_id' => $p->service_id,
            'staff_id' => $p->staff_id,
            'staff_name' => $p->staff?->name ?? '—',
            'customer_name' => $booking?->customer?->name ?? $booking?->customer_name ?? '—',
            'guest_count' => $people,
            'buffet_tier' => $booking?->buffetTier?->tier_name ?? '—',
            'tier_price' => $tierPrice,
            'calculated_amount' => $calculatedAmount,
            'table_no' => $tableNo,
            'total_amount' => (float) $p->total_amount,
            'method' => $p->method,
            'note' => $p->note,
            'payment_time' => $p->payment_time?->format('m/d/Y, h:i A') ?? '—',
            'payment_date' => $p->payment_time?->toDateString(),
        ];

        if ($includeDeletionMeta) {
            $deletedBy = $p->deletedByStaff;
            $row['deletion_reason'] = $p->deletion_reason ?? '—';
            $row['deleted_at'] = $p->deleted_at?->format('m/d/Y, h:i A') ?? '—';
            $row['deleted_by_name'] = $deletedBy
                ? trim(($deletedBy->name ?? '').' '.($deletedBy->surname ?? ''))
                : '—';
        }

        return $row;
    }

    public function index(Request $request): Response
    {
        $staff = $request->user('staff');
        $isManager = $staff !== null && $staff->role === 'manager';

        $filters = [
            'search' => (string) $request->query('search', ''),
            'method' => (string) $request->query('method', ''),
            'zone' => (string) $request->query('zone', ''),
            'from' => (string) $request->query('from', ''),
            'to' => (string) $request->query('to', ''),
            'show_deleted' => $isManager && $request->boolean('show_deleted'),
        ];

        if ($filters['zone'] !== '' && ! in_array($filters['zone'], ['standard', 'vip'], true)) {
            $filters['zone'] = '';
        }

        $paymentsQuery = $filters['show_deleted']
            ? Payment::query()->onlyTrashed()
            : Payment::query();

        $paymentsQuery
            ->with([
                'service.booking.customer',
                'service.booking.buffetTier',
                'service.serviceDetails.table',
                'staff',
                'deletedByStaff',
            ])
            ->orderByDesc($filters['show_deleted'] ? 'deleted_at' : 'payment_time');
        $this->applyPaymentListFilters($paymentsQuery, $filters);

        $payments = $paymentsQuery
            ->get()
            ->map(fn (Payment $p): array => $this->mapPaymentRow($p, $filters['show_deleted']))
            ->all();

        $summaryBase = Payment::query();
        $this->applyPaymentListFilters($summaryBase, $filters);
        $summary = array_merge(
            $this->summarizeFilteredPayments($summaryBase),
            $this->summarizeVoidedPayments($filters)
        );

        $this->materializeMissingServicesForSeatedBookings();
        $activeTables = Service::query()
            ->with(['booking.customer', 'booking.buffetTier', 'serviceDetails.table', 'payment'])
            ->where('status', 'in_service')
            ->whereDoesntHave('payment')
            ->orderBy('start_time')
            ->get()
            ->map(fn (Service $service): array => $this->mapActiveService($service))
            ->values()
            ->all();

        return Inertia::render('Admin/Payments', [
            'payments' => $payments,
            'summary' => $summary,
            'filters' => $filters,
            'activeTables' => $activeTables,
            'can_delete_payments' => $isManager,
        ]);
    }

    public function getActiveServices(Request $request): JsonResponse
    {
        $this->materializeMissingServicesForSeatedBookings();

        $q = (string) $request->query('q', '');

        // ສະເພາະ in_service ທີ່ຍັງບໍ່ຊຳລະ — ບໍ່ຈຳກັດຈຳນວນ; ບໍ່ໃຊ້ completed ທີ່ນີ້ເພື່ອບໍ່ສັບສົນກັບປະຫວັດ.
        $rows = Service::query()
            ->with(['booking.customer', 'booking.buffetTier', 'serviceDetails.table', 'payment'])
            ->where('status', 'in_service')
            ->whereDoesntHave('payment')
            ->when($q !== '', function ($query) use ($q): void {
                $query->where(function ($sub) use ($q): void {
                    $sub->where('service_code', 'like', "%{$q}%")
                        ->orWhere('id', 'like', "%{$q}%")
                        ->orWhereHas('booking', function ($bq) use ($q): void {
                            $bq->where('customer_name', 'like', "%{$q}%")
                                ->orWhereHas('customer', function ($cq) use ($q): void {
                                    $cq->where('name', 'like', "%{$q}%");
                                });
                        })
                        ->orWhereHas('serviceDetails.table', function ($tq) use ($q): void {
                            $tq->where('table_no', 'like', "%{$q}%");
                        });
                });
            })
            ->orderBy('start_time')
            ->get()
            ->map(fn (Service $service): array => $this->mapActiveService($service))
            ->values();

        return response()->json([
            'services' => $rows,
        ]);
    }

    public function lookupService(Request $request): JsonResponse
    {
        $data = $request->validate([
            'service_id' => ['required', 'integer', 'exists:services,id'],
        ]);

        $service = Service::query()
            ->with(['booking.customer', 'booking.buffetTier', 'serviceDetails.table', 'payment'])
            ->findOrFail($data['service_id']);

        if ($service->payment) {
            return response()->json(['found' => false, 'message' => 'Service already paid']);
        }

        if ($service->status !== 'in_service') {
            return response()->json(['found' => false, 'message' => 'Service not open for payment']);
        }

        return response()->json(array_merge(
            ['found' => true],
            $this->mapActiveService($service)
        ));
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'total_amount' => ['required', 'numeric', 'gte:0'],
            'method' => ['required', 'string', PaymentMethod::rule()],
            'received_amount' => ['nullable', 'numeric', 'gte:0'],
            'note' => ['nullable', 'string', 'max:500'],
            'search' => ['nullable', 'string', 'max:255'],
            'method_filter' => ['nullable', 'string', Rule::in(array_merge([''], PaymentMethod::values()))],
            'zone_filter' => ['nullable', 'string', Rule::in(['', 'standard', 'vip'])],
            'from' => ['nullable', 'string', 'max:32'],
            'to' => ['nullable', 'string', 'max:32'],
        ]);

        $staffId = $request->user('staff')?->id;
        abort_if($staffId === null, 403);

        if ($data['method'] === PaymentMethod::CASH && (float) ($data['received_amount'] ?? 0) < (float) $data['total_amount']) {
            return back()->withErrors([
                'received_amount' => 'ຈຳນວນເງິນຮັບມານ້ອຍກວ່າຍອດລວມ',
            ]);
        }

        DB::transaction(function () use ($data, $staffId): void {
            $service = Service::query()->with(['payment', 'booking', 'serviceDetails.table'])->lockForUpdate()->findOrFail($data['service_id']);
            if ($service->payment) {
                return;
            }

            $pricing = $this->buildCheckoutPricing($service);
            $expectedTotal = $pricing['total'];
            if (abs($expectedTotal - (float) $data['total_amount']) > 0.009) {
                throw ValidationException::withMessages([
                    'total_amount' => 'ຍອດລວມບໍ່ກົງກັບລະບົບ — ກະລຸນາໂຫຼດໜ້າໃໝ່.',
                ]);
            }

            $paidAt = now();
            $diningFinishedAt = $service->end_time ?? $paidAt;

            Payment::query()->create([
                'service_id' => $service->id,
                'staff_id' => $staffId,
                'total_amount' => $expectedTotal,
                'method' => $data['method'],
                'note' => $data['note'] ?? null,
                'payment_time' => $paidAt,
            ]);

            $service->update([
                'status' => 'completed',
                'end_time' => $diningFinishedAt,
            ]);

            if ($service->booking) {
                // ບັນທຶກເວລາຈົບການກິນ + ເວລາຊຳລະ ໄວ້ໃນ booking ເພື່ອວິເຄາະ lifecycle ໄດ້ຈາກຕາຕະລາງດຽວ.
                $service->booking->update([
                    'status' => 'finished',
                    'called_at' => $service->booking->called_at ?? $service->start_time,
                    'dining_finished_at' => $service->booking->dining_finished_at ?? $diningFinishedAt,
                    'paid_at' => $paidAt,
                ]);
            }

            // ຊິງຄ໌ usage_status ໃຫ້ກົງກັບຄວາມຈິງຫຼັງຊຳລະ (ສະຖານະມີລູກຄ້າເບິ່ງຈາກບໍລິການເປັນຫຼັກ).
            foreach ($service->serviceDetails as $detail) {
                $detail->table?->update(['usage_status' => 'available']);
            }
        });

        $query = array_filter([
            'search' => (string) ($data['search'] ?? ''),
            'method' => (string) ($data['method_filter'] ?? ''),
            'zone' => (string) ($data['zone_filter'] ?? ''),
            'from' => (string) ($data['from'] ?? ''),
            'to' => (string) ($data['to'] ?? ''),
        ], fn (string $v): bool => $v !== '');

        return redirect()->route($this->paymentsIndexRoute($request), $query)->with('success', 'ຊຳລະເງິນສຳເລັດແລ້ວ');
    }

    public function destroy(Request $request, Payment $payment): RedirectResponse
    {
        $staff = $request->user('staff');
        abort_if($staff === null || $staff->role !== 'manager', 403);

        $data = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:500'],
            'password' => ['required', 'string'],
        ]);

        if (! Hash::check($data['password'], $staff->password)) {
            throw ValidationException::withMessages([
                'password' => 'ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ',
            ]);
        }

        $payment->load(['service.serviceDetails.table']);
        $tableNo = $this->paymentTableNo($payment);

        DB::transaction(function () use ($payment, $staff, $data, $tableNo, $request): void {
            $payment->update([
                'deletion_reason' => $data['reason'],
                'deleted_by_staff_id' => $staff->id,
            ]);
            $payment->delete();

            ActivityLogService::record($staff, 'DELETE_PAYMENT', [
                'payment_id' => $payment->id,
                'table_no' => $tableNo,
                'total_amount' => (float) $payment->total_amount,
                'method' => $payment->method,
                'reason' => $data['reason'],
            ], $request);
        });

        $query = $this->listRedirectQuery($request);

        return redirect()->route($this->paymentsIndexRoute($request), $query)
            ->with('success', 'ຍົກເລີກບິນຊຳລະແລ້ວ (ບັນທຶກການກວດສອບແລ້ວ)');
    }

    public function restore(Request $request, int $payment): RedirectResponse
    {
        $staff = $this->assertManager($request);
        $record = $this->findVoidedPaymentOrFail($payment);
        $tableNo = $this->paymentTableNo($record);

        DB::transaction(function () use ($record, $staff, $tableNo, $request): void {
            $record->update([
                'deletion_reason' => null,
                'deleted_by_staff_id' => null,
            ]);
            $record->restore();

            ActivityLogService::record($staff, 'RESTORE_PAYMENT', [
                'payment_id' => $record->id,
                'table_no' => $tableNo,
                'total_amount' => (float) $record->total_amount,
                'method' => $record->method,
            ], $request);
        });

        return redirect()->route($this->paymentsIndexRoute($request), $this->listRedirectQuery($request))
            ->with('success', 'ກູ້ຄືນບິນຊຳລະສຳເລັດແລ້ວ');
    }

    public function correctVoided(Request $request, int $payment): RedirectResponse
    {
        $staff = $this->assertManager($request);
        $record = $this->findVoidedPaymentOrFail($payment);

        $data = $request->validate([
            'total_amount' => ['required', 'numeric', 'gte:0'],
            'method' => ['required', 'string', PaymentMethod::rule()],
            'reason' => ['required', 'string', 'min:3', 'max:500'],
        ]);

        $tableNo = $this->paymentTableNo($record);
        $previousAmount = (float) $record->total_amount;
        $previousMethod = $record->method;
        $newAmount = (float) $data['total_amount'];
        $reason = trim($data['reason']);

        DB::transaction(function () use ($record, $staff, $data, $tableNo, $previousAmount, $previousMethod, $newAmount, $reason, $request): void {
            $adjustmentNote = sprintf(
                '[Adjusted %s] %s → %s KIP (%s). Reason: %s',
                now()->format('Y-m-d H:i'),
                number_format($previousAmount, 0, '.', ','),
                number_format($newAmount, 0, '.', ','),
                $data['method'],
                $reason
            );
            $existingNote = trim((string) ($record->note ?? ''));
            $mergedNote = $existingNote !== ''
                ? $existingNote."\n".$adjustmentNote
                : $adjustmentNote;

            $record->update([
                'total_amount' => $newAmount,
                'method' => $data['method'],
                'note' => $mergedNote,
                'deletion_reason' => null,
                'deleted_by_staff_id' => null,
            ]);
            $record->restore();

            ActivityLogService::record($staff, 'ADJUST_PAYMENT', [
                'payment_id' => $record->id,
                'table_no' => $tableNo,
                'message' => sprintf(
                    'Admin adjusted Total from %s to %s due to %s',
                    number_format($previousAmount, 0, '.', ','),
                    number_format($newAmount, 0, '.', ','),
                    $reason
                ),
                'previous_total_amount' => $previousAmount,
                'new_total_amount' => $newAmount,
                'previous_method' => $previousMethod,
                'new_method' => $data['method'],
                'reason' => $reason,
                'restored' => true,
            ], $request);
        });

        $query = $this->listRedirectQuery($request);
        unset($query['show_deleted']);

        return redirect()->route($this->paymentsIndexRoute($request), $query)
            ->with('success', 'ແກ້ໄຂແລະກູ້ຄືນບິນຊຳລະສຳເລັດແລ້ວ');
    }
}
