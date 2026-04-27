<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Service;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
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
        $addOnTotal = 0.0;
        $totalAmount = ($people > 0 ? $people * $tierPrice : $tierPrice) + $addOnTotal;

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
            'items' => [],
            'total_amount' => $totalAmount,
        ];
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
        if (in_array($filters['method'], ['cash', 'transfer'], true)) {
            $query->where('method', $filters['method']);
        }
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
            'cash' => (float) (clone $base)->where('method', 'cash')->sum('total_amount'),
            'transfer' => (float) (clone $base)->where('method', 'transfer')->sum('total_amount'),
        ];
    }

    public function index(Request $request): Response
    {
        $filters = [
            'search' => (string) $request->query('search', ''),
            'method' => (string) $request->query('method', ''),
            'from' => (string) $request->query('from', ''),
            'to' => (string) $request->query('to', ''),
        ];

        $paymentsQuery = Payment::query()
            ->with(['service.booking.customer', 'service.booking.buffetTier', 'service.serviceDetails.table', 'staff'])
            ->orderByDesc('payment_time');
        $this->applyPaymentListFilters($paymentsQuery, $filters);

        $payments = $paymentsQuery
            ->get()
            ->map(function (Payment $p): array {
                $booking = $p->service?->booking;
                $tableNos = $p->service?->serviceDetails
                    ?->map(fn ($detail): string => (string) ($detail->table?->table_no ?? ''))
                    ->filter()
                    ->unique()
                    ->values()
                    ->all() ?? [];
                $tableNo = $tableNos !== [] ? implode(' + ', $tableNos) : '—';

                return [
                    'id' => $p->id,
                    'service_id' => $p->service_id,
                    'staff_id' => $p->staff_id,
                    'staff_name' => $p->staff?->name ?? '—',
                    'customer_name' => $booking?->customer?->name ?? $booking?->customer_name ?? '—',
                    'guest_count' => (int) ($booking?->guest_count ?? 0),
                    'buffet_tier' => $booking?->buffetTier?->tier_name ?? '—',
                    'tier_price' => (float) ($booking?->buffetTier?->price ?? 0),
                    'table_no' => $tableNo,
                    'total_amount' => (float) $p->total_amount,
                    'method' => $p->method,
                    'note' => $p->note,
                    'payment_time' => $p->payment_time?->format('m/d/Y, h:i A') ?? '—',
                    'payment_date' => $p->payment_time?->toDateString(),
                ];
            })
            ->all();

        $summaryBase = Payment::query();
        $this->applyPaymentListFilters($summaryBase, $filters);
        $summary = $this->summarizeFilteredPayments($summaryBase);

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
            'method' => ['required', 'string', Rule::in(['cash', 'transfer'])],
            'received_amount' => ['nullable', 'numeric', 'gte:0'],
            'note' => ['nullable', 'string', 'max:500'],
            'search' => ['nullable', 'string', 'max:255'],
            'method_filter' => ['nullable', 'string', Rule::in(['', 'cash', 'transfer'])],
            'from' => ['nullable', 'string', 'max:32'],
            'to' => ['nullable', 'string', 'max:32'],
        ]);

        $staffId = $request->user('staff')?->id;
        abort_if($staffId === null, 403);

        if ($data['method'] === 'cash' && (float) ($data['received_amount'] ?? 0) < (float) $data['total_amount']) {
            return back()->withErrors([
                'received_amount' => 'ຈຳນວນເງິນຮັບມານ້ອຍກວ່າຍອດລວມ',
            ]);
        }

        DB::transaction(function () use ($data, $staffId): void {
            $service = Service::query()->with(['payment', 'booking', 'serviceDetails.table'])->lockForUpdate()->findOrFail($data['service_id']);
            if ($service->payment) {
                return;
            }

            $paidAt = now();
            $diningFinishedAt = $service->end_time ?? $paidAt;

            Payment::query()->create([
                'service_id' => $service->id,
                'staff_id' => $staffId,
                'total_amount' => $data['total_amount'],
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
            'from' => (string) ($data['from'] ?? ''),
            'to' => (string) ($data['to'] ?? ''),
        ], fn (string $v): bool => $v !== '');

        return redirect()->route($this->paymentsIndexRoute($request), $query)->with('success', 'ຊຳລະເງິນສຳເລັດແລ້ວ');
    }

    public function destroy(Request $request, Payment $payment): RedirectResponse
    {
        $payment->delete();

        $query = array_filter([
            'search' => (string) $request->query('search', ''),
            'method' => (string) $request->query('method', ''),
            'from' => (string) $request->query('from', ''),
            'to' => (string) $request->query('to', ''),
        ], fn (string $v): bool => $v !== '');

        return redirect()->route($this->paymentsIndexRoute($request), $query)->with('success', 'ລຶບລາຍການຊຳລະເງິນສຳເລັດແລ້ວ');
    }
}
