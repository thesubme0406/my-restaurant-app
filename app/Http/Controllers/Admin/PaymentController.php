<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    private function mapActiveService(Service $service): array
    {
        $booking = $service->booking;
        $tableNo = $service->serviceDetails->first()?->table?->table_no ?? '—';
        $people = (int) ($booking?->guest_count ?? 0);
        $tierName = $booking?->buffetTier?->tier_name ?? '—';
        $tierPrice = (float) ($booking?->buffetTier?->price ?? 0);
        $addOnTotal = 0.0;
        $totalAmount = ($people > 0 ? $people * $tierPrice : $tierPrice) + $addOnTotal;

        return [
            'service_id' => $service->id,
            'service_code' => $service->service_code,
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

        if ($filters['search'] !== '') {
            $q = $filters['search'];
            $paymentsQuery->where(function ($query) use ($q): void {
                $query->where('service_id', 'like', "%{$q}%")
                    ->orWhere('staff_id', 'like', "%{$q}%");
            });
        }
        if (in_array($filters['method'], ['cash', 'transfer'], true)) {
            $paymentsQuery->where('method', $filters['method']);
        }
        if ($filters['from'] !== '') {
            $paymentsQuery->whereDate('payment_time', '>=', $filters['from']);
        }
        if ($filters['to'] !== '') {
            $paymentsQuery->whereDate('payment_time', '<=', $filters['to']);
        }

        $payments = $paymentsQuery
            ->get()
            ->map(function (Payment $p): array {
                $booking = $p->service?->booking;
                $tableNo = $p->service?->serviceDetails?->first()?->table?->table_no ?? '—';

                return [
                    'id' => $p->id,
                    'service_id' => $p->service_id,
                    'staff_id' => $p->staff_id,
                    'customer_name' => $booking?->customer?->name ?? $booking?->customer_name ?? '—',
                    'guest_count' => (int) ($booking?->guest_count ?? 0),
                    'buffet_tier' => $booking?->buffetTier?->tier_name ?? '—',
                    'tier_price' => (float) ($booking?->buffetTier?->price ?? 0),
                    'table_no' => $tableNo,
                    'total_amount' => (float) $p->total_amount,
                    'method' => $p->method,
                    'payment_time' => $p->payment_time?->format('m/d/Y, h:i A') ?? '—',
                    'payment_date' => $p->payment_time?->toDateString(),
                ];
            })
            ->all();

        $today = Carbon::today();
        $todayQuery = Payment::query()->whereDate('payment_time', $today);
        $summary = [
            'count' => (clone $todayQuery)->count(),
            'total' => (float) ((clone $todayQuery)->sum('total_amount')),
            'cash' => (float) ((clone $todayQuery)->where('method', 'cash')->sum('total_amount')),
            'transfer' => (float) ((clone $todayQuery)->where('method', 'transfer')->sum('total_amount')),
        ];

        return Inertia::render('Admin/Payments', [
            'payments' => $payments,
            'summary' => $summary,
            'filters' => $filters,
        ]);
    }

    public function getActiveServices(Request $request): JsonResponse
    {
        $q = (string) $request->query('q', '');

        $rows = Service::query()
            ->with(['booking.customer', 'booking.buffetTier', 'serviceDetails.table', 'payment'])
            ->whereIn('status', ['in_service', 'completed'])
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

            Payment::query()->create([
                'service_id' => $service->id,
                'staff_id' => $staffId,
                'total_amount' => $data['total_amount'],
                'method' => $data['method'],
                'payment_time' => now(),
            ]);

            $service->update([
                'status' => 'completed',
                'end_time' => $service->end_time ?? now(),
            ]);

            if ($service->booking) {
                $service->booking->update(['status' => 'finished']);
            }

            foreach ($service->serviceDetails as $detail) {
                $detail->table?->update(['status' => 'available']);
            }
        });

        return redirect()->route('admin.payments')->with('success', 'ຊຳລະເງິນສຳເລັດແລ້ວ');
    }

    public function destroy(Payment $payment): RedirectResponse
    {
        $payment->delete();

        return redirect()->route('admin.payments')->with('success', 'ລຶບລາຍການຊຳລະເງິນສຳເລັດແລ້ວ');
    }
}

