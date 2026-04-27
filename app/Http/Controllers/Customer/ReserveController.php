<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BuffetTier;
use App\Models\Table;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReserveController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Customer/Reserve', $this->payload($request));
    }

    public function stats(Request $request): JsonResponse
    {
        return response()->json($this->payload($request));
    }

    /**
     * @return array{
     *   waiting_count: int,
     *   estimated_wait_minutes: int,
     *   estimated_dining_minutes_per_table: int,
     *   queue_flow: array<string,mixed>,
     *   active_queues: array<int, array<string,mixed>>,
     *   booking_history: array<int, array<string,mixed>>,
     *   buffet_tiers: array<int, array{id: int, label: string}>,
     *   customer_profile: array{name: string, phone: string}
     * }
     */
    private function payload(Request $request): array
    {
        $customer = $request->user('customer');
        abort_if($customer === null, 403);
        $today = Carbon::today();
        // ຕົວເລກຄິວລໍຖ້າໃຫ້ຕົງກັບ dashboard
        $activeStatuses = ['waiting', 'pending', 'confirmed'];

        // ນັບທຸກຄິວລໍຖ້າທີ່ຍັງບໍ່ໄດ້ນັ່ງໂຕະ (logic ດຽວກັບ dashboard)
        $waitingCount = Booking::query()
            ->whereDate('expected_time', $today->toDateString())
            ->whereNull('table_id')
            ->whereIn('status', $activeStatuses)
            ->count();

        $availableTableCount = max(
            1,
            Table::query()->where('readiness', 'ready')->count()
        );
        // ໃຊ້ຄ່າສະເລ່ຍເວລາຮັບປະທານຈິງ/ໂຕະ ແທນຄ່າ fix ເພື່ອໃຫ້ ETA ສະທ້ອນຂໍ້ມູນຈິງ.
        $avgServeMinutesPerTable = $this->averageDiningMinutesPerTable();
        $estimatedWaitMinutes = (int) ceil(($waitingCount / $availableTableCount) * $avgServeMinutesPerTable);

        $activeQueues = Booking::query()
            ->with(['buffetTier', 'customer'])
            ->where(function ($query) use ($customer): void {
                $query->where('customer_id', $customer->id)
                    ->orWhere('phone', $customer->phone);
            })
            // "ຄິວຂອງຂ້ອຍ" ໃຫ້ເຫັນທັງມື້ນີ້ + ອະນາຄົດ, ແຕ່ Live dashboard ຈະກອງສະເພາະມື້ນີ້.
            ->whereDate('expected_time', '>=', $today->toDateString())
            ->whereNull('table_id')
            ->whereIn('status', $activeStatuses)
            ->orderByRaw('case when queued_at is null then 1 else 0 end')
            ->orderBy('expected_time')
            ->orderBy('queued_at')
            ->orderBy('id')
            ->get();

        $allActive = Booking::query()
            ->whereDate('expected_time', $today->toDateString())
            ->whereNull('table_id')
            ->whereIn('status', $activeStatuses)
            ->orderByRaw('case when queued_at is null then 1 else 0 end')
            ->orderBy('queued_at')
            ->orderBy('id')
            ->get(['id']);

        $positions = [];
        foreach ($allActive as $index => $booking) {
            $positions[(int) $booking->id] = $index + 1;
        }

        $todayString = $today->toDateString();
        $activeQueuePayload = $activeQueues
            ->map(function (Booking $booking) use ($positions, $availableTableCount, $avgServeMinutesPerTable, $customer, $todayString): array {
                $position = $positions[(int) $booking->id] ?? null;
                $isTodayQueue = $booking->expected_time?->toDateString() === $todayString;
                $perQueueEstimated = ($isTodayQueue && $position !== null)
                    ? (int) ceil(($position / $availableTableCount) * $avgServeMinutesPerTable)
                    : 0;
                $tier = $booking->buffetTier;
                $buffetTierLabel = $tier !== null
                    ? number_format((float) $tier->price).' ກີບ '.trim((string) $tier->tier_name)
                    : '—';

                return [
                    'id' => $booking->id,
                    'queue_no' => $booking->queue_no ?: ('Q'.str_pad((string) $booking->id, 3, '0', STR_PAD_LEFT)),
                    'status' => (string) $booking->status,
                    'guest_count' => (int) ($booking->guest_count ?? 0),
                    'estimated_wait_time' => max($perQueueEstimated, 0),
                    'customer_name' => (string) ($booking->customer_name ?: ($booking->customer?->name ?? $customer->name)),
                    'phone' => (string) ($booking->phone ?? $booking->customer?->phone ?? $customer->phone ?? ''),
                    'buffet_tier_label' => $buffetTierLabel,
                    'expected_time' => $booking->expected_time?->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        // ສະແດງສະຖານະຄິວສົດ: ຄິວທີ່ກຳລັງຮຽກ + ຄິວຖັດໄປ
        // ລາຍການ Live ຂອງມື້ນີ້: ຈອງກ່ອນຂຶ້ນກ່ອນ, ຈອງຫຼ້າສຸດຢູ່ທ້າຍ
        $globalQueueOrder = Booking::query()
            ->whereDate('expected_time', $today->toDateString())
            ->whereNull('table_id')
            ->whereIn('status', $activeStatuses)
            ->orderByRaw('case when queued_at is null then 1 else 0 end')
            ->orderBy('queued_at')
            ->orderBy('id')
            ->get(['id', 'queue_no']);

        $queueNumbers = $globalQueueOrder->map(
            fn (Booking $booking): string => $booking->queue_no ?: ('Q'.str_pad((string) $booking->id, 3, '0', STR_PAD_LEFT))
        )->values()->all();

        $nowServing = $queueNumbers[0] ?? null;
        $upNext = array_slice($queueNumbers, 1, 4);
        $totalQueue = count($queueNumbers);
        $aheadOfCustomer = null;

        $todayCustomerQueues = $activeQueues->filter(
            fn (Booking $booking): bool => $booking->expected_time?->toDateString() === $todayString
        )->values();

        if ($todayCustomerQueues->isNotEmpty()) {
            $firstCustomerQueueId = (int) $todayCustomerQueues->first()->id;
            $customerPosition = $positions[$firstCustomerQueueId] ?? null;
            if ($customerPosition !== null) {
                $aheadOfCustomer = max(0, $customerPosition - 1);
            }
        }

        $progressPct = 0;
        if ($aheadOfCustomer !== null && $totalQueue > 0) {
            $progressPct = (int) round((($totalQueue - $aheadOfCustomer) / $totalQueue) * 100);
            $progressPct = max(0, min(100, $progressPct));
        }

        $history = Booking::query()
            ->with(['buffetTier', 'customer'])
            ->where(function ($query) use ($customer): void {
                $query->where('customer_id', $customer->id)
                    ->orWhere('phone', $customer->phone);
            })
            ->where(function ($query) use ($activeStatuses): void {
                $query->whereNotIn('status', $activeStatuses)
                    ->orWhereNotNull('table_id');
            })
            ->orderByDesc('id')
            ->get()
            ->map(function (Booking $booking) use ($customer): array {
                $tier = $booking->buffetTier;
                $buffetTierLabel = $tier !== null
                    ? number_format((float) $tier->price).' ກີບ '.trim((string) $tier->tier_name)
                    : '—';

                return [
                    'id' => $booking->id,
                    'queue_no' => $booking->queue_no ?: ('Q'.str_pad((string) $booking->id, 3, '0', STR_PAD_LEFT)),
                    'customer_name' => (string) ($booking->customer_name ?: ($booking->customer?->name ?? $customer->name)),
                    'phone' => (string) ($booking->phone ?? $booking->customer?->phone ?? $customer->phone ?? ''),
                    'guest_count' => (int) ($booking->guest_count ?? 0),
                    'date' => $booking->expected_time?->format('d/m/y') ?? '—',
                    'time' => $booking->expected_time?->format('g:iA') ?? '—',
                    'status' => (string) ($booking->status ?? 'pending'),
                    'buffet_tier_label' => $buffetTierLabel,
                    'expected_time' => $booking->expected_time?->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        return [
            'waiting_count' => $waitingCount,
            'estimated_wait_minutes' => max($estimatedWaitMinutes, 0),
            'estimated_dining_minutes_per_table' => $avgServeMinutesPerTable,
            'queue_flow' => [
                'now_serving' => $nowServing,
                'up_next' => $upNext,
                'ahead_of_you' => $aheadOfCustomer,
                'progress_pct' => $progressPct,
                'is_called' => $aheadOfCustomer === 0 && $todayCustomerQueues->isNotEmpty(),
            ],
            'active_queues' => $activeQueuePayload,
            'booking_history' => $history,
            'buffet_tiers' => BuffetTier::query()
                ->orderBy('price')
                ->orderBy('tier_name')
                ->get()
                ->map(fn (BuffetTier $tier): array => [
                    'id' => (int) $tier->id,
                    'label' => trim((string) $tier->tier_name).' - '.number_format((float) $tier->price).' ກີບ',
                ])
                ->values()
                ->all(),
            'customer_profile' => [
                'name' => (string) ($customer->name ?? ''),
                'phone' => (string) ($customer->phone ?? ''),
            ],
        ];
    }

    /**
     * ສະເລ່ຍເວລາລໍຖ້າຈາກ «ເຂົ້າຄິວ» -> «ໄດ້ຮັບການເອີ້ນ».
     */
    private function averageWaitMinutes(): int
    {
        $avg = Booking::query()
            ->whereNotNull('queued_at')
            ->whereNotNull('called_at')
            ->where('called_at', '>=', Carbon::now()->subDays(30))
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, queued_at, called_at)) as avg_wait')
            ->value('avg_wait');

        return max(1, (int) round((float) ($avg ?? 0)));
    }

    /**
     * ສະເລ່ຍເວລານັ່ງກິນຕໍ່ໂຕະ (ຈາກ service start -> end) ໃນ 30 ວັນຫຼ້າສຸດ.
     */
    private function averageDiningMinutesPerTable(): int
    {
        $avg = DB::table('services')
            ->whereNotNull('start_time')
            ->whereNotNull('end_time')
            ->where('end_time', '>=', Carbon::now()->subDays(30))
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, start_time, end_time)) as avg_dining')
            ->value('avg_dining');

        // ຖ້າຍັງບໍ່ມີປະຫວັດພໍ ໃຫ້ຕົກກັບຄ່າລໍຖ້າຈິງສະເລ່ຍ.
        if ($avg === null || (float) $avg <= 0) {
            return $this->averageWaitMinutes();
        }

        return max(1, (int) round((float) $avg));
    }
}
