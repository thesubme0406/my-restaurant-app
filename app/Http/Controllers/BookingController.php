<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BookingController extends Controller
{
    /** ຄົ້ນຊື່ຈາກເບີໂທ — ຄິວຫຼ້າສຸດກ່ອນ, ຫຼັງນັ້ນຕາຕະລາງ customers (ສະກົດຕາມຈອງຫຼ້າສຸດ). */
    public function lookupCustomerByPhone(Request $request): JsonResponse
    {
        $raw = (string) $request->query('phone', '');
        $phone = preg_replace('/\D+/', '', $raw) ?? '';

        if (strlen($phone) < 8 || strlen($phone) > 15) {
            return response()->json([
                'name' => null,
                'matched' => false,
            ]);
        }

        $booking = Booking::query()
            ->where('phone', $phone)
            ->orderByDesc('id')
            ->with(['customer:id,name,phone'])
            ->first();

        $nameFromBooking = null;
        if ($booking !== null) {
            $rawName = $booking->customer_name ?: $booking->customer?->name;
            if (is_string($rawName)) {
                $trimmed = trim($rawName);
                $nameFromBooking = $trimmed !== '' ? $trimmed : null;
            }
        }

        $customer = Customer::query()->where('phone', $phone)->first();
        $nameFromCustomer = null;
        if ($customer !== null && is_string($customer->name)) {
            $trimmed = trim($customer->name);
            $nameFromCustomer = $trimmed !== '' ? $trimmed : null;
        }

        $name = $nameFromBooking ?? $nameFromCustomer;

        return response()->json([
            'name' => $name,
            'matched' => $name !== null,
        ]);
    }

    /**
     * ບັນທຶກຈອງຄິວລູກຄ້າ — ເລກຄິວ Qxxx ຕໍ່ມື້ (queue_day) ແບບສະຫຼຸບດຽວກັນທຸກຄົນ; ກັນຊ້ຳດ້ວຍ lock ບັນທຶກ + retry.
     */
    public function store(Request $request): JsonResponse
    {
        $authCustomer = $request->user('customer');
        abort_if($authCustomer === null, 403);

        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'regex:/^020\d{8}$/'],
            'guest_count' => ['required', 'integer', 'min:1', 'max:20'],
            'tier_id' => ['required', 'integer', Rule::exists('buffet_tiers', 'id')],
            'booking_date' => ['required', 'date', 'after_or_equal:today'],
            'queue_no' => ['prohibited'],
        ]);

        $bookingDate = Carbon::parse((string) $validated['booking_date'])->startOfDay();
        $queueDayString = $bookingDate->toDateString();

        // ເລກຄິວຕໍ່ມື້ (Q001…) ຮ່ວມກັນທຸກຄົນ — ຊຸດຊ້ຳກັນກັນດ້ວຍ unique (queue_day, queue_no) + lock + retry.
        $booking = null;
        for ($attempt = 1; $attempt <= 25; $attempt++) {
            try {
                $booking = DB::transaction(function () use ($validated, $authCustomer, $bookingDate, $queueDayString): Booking {
                    $phone = (string) $validated['phone'];
                    $customerName = trim((string) $validated['customer_name']);

                    $customer = Customer::query()->find($authCustomer->id);
                    if ($customer === null) {
                        $customer = Customer::query()->firstOrCreate(
                            ['phone' => $phone],
                            ['name' => $customerName]
                        );
                    }

                    if ((string) $customer->phone !== $phone) {
                        $customer->phone = $phone;
                    }
                    if (trim((string) $customer->name) === '' || trim((string) $customer->name) !== $customerName) {
                        $customer->name = $customerName;
                    }
                    if ($customer->isDirty()) {
                        $customer->save();
                    }

                    // Lock today's global sequence rows and take max numeric suffix (not max id).
                    $queueNos = Booking::query()
                        ->where('queue_day', $queueDayString)
                        ->where('queue_no', 'like', 'Q%')
                        ->lockForUpdate()
                        ->pluck('queue_no');

                    $maxSuffix = 0;
                    foreach ($queueNos as $queueNo) {
                        if (! is_string($queueNo)) {
                            continue;
                        }
                        if (preg_match('/^Q-?(\d+)$/', $queueNo, $matches) === 1) {
                            $maxSuffix = max($maxSuffix, (int) $matches[1]);
                        }
                    }
                    $nextNumber = $maxSuffix + 1;

                    return Booking::query()->create([
                        'customer_id' => $customer->id,
                        'customer_name' => $customerName,
                        'phone' => $phone,
                        'tier_id' => (int) $validated['tier_id'],
                        'queue_no' => 'Q'.str_pad((string) $nextNumber, 3, '0', STR_PAD_LEFT),
                        'queue_day' => $queueDayString,
                        'guest_count' => (int) $validated['guest_count'],
                        'expected_time' => $bookingDate,
                        // ເວລາເຂົ້າຄິວຈິງ (ຈຸດບັນທຶກໃນລະບົບ) ໃຊ້ສຳລັບຄຳນວນ waiting time.
                        'queued_at' => now(),
                        'status' => 'pending',
                        'skip_count' => 0,
                    ]);
                });
                break;
            } catch (QueryException $e) {
                if ($attempt >= 25 || ! $this->isDuplicateQueueDayNumber($e)) {
                    throw $e;
                }
            }
        }

        if ($booking === null) {
            abort(500, 'Unable to allocate queue number.');
        }

        $booking->refresh();
        $booking->load(['buffetTier', 'customer']);
        $auth = $request->user('customer');
        $tier = $booking->buffetTier;
        $buffetTierLabel = $tier !== null
            ? number_format((float) $tier->price).' ກີບ '.trim((string) $tier->tier_name)
            : '—';

        return response()->json([
            'ok' => true,
            'queue_no' => $booking->queue_no,
            'booking_id' => $booking->id,
            'active_queue_item' => [
                'id' => $booking->id,
                'queue_no' => (string) $booking->queue_no,
                'status' => (string) $booking->status,
                'guest_count' => (int) ($booking->guest_count ?? 0),
                'estimated_wait_time' => 0,
                'customer_name' => (string) ($booking->customer_name ?: ($booking->customer?->name ?? $auth?->name ?? '')),
                'phone' => (string) ($booking->phone ?? $booking->customer?->phone ?? $auth?->phone ?? ''),
                'buffet_tier_label' => $buffetTierLabel,
                'expected_time' => $booking->expected_time?->toIso8601String(),
            ],
        ]);
    }

    /** ກວດວ່າເກີດຊ້ຳເລກຄິວຕໍ່ມື້ (ຮອງໃໝ່ໄດ້). */
    private function isDuplicateQueueDayNumber(QueryException $e): bool
    {
        $message = $e->getMessage();
        if (str_contains($message, 'bookings_queue_day_queue_no_unique')) {
            return true;
        }
        if (str_contains($message, 'UNIQUE constraint failed') && str_contains($message, 'queue_day')) {
            return true;
        }

        return ($e->errorInfo[1] ?? null) === 1062;
    }

    /** ຍົກເລີກຄິວກ່ອນນັ່ງໂຕະ — ອະນຸຍາດເຉພາະເຈົ້າຂອງຄິວ. */
    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        $customer = $request->user('customer');
        abort_if($customer === null, 403);

        $matchesCustomer = (int) $booking->customer_id === (int) $customer->id
            || ((string) $booking->phone !== '' && (string) $booking->phone === (string) $customer->phone);
        abort_unless($matchesCustomer, 403);

        abort_if($booking->table_id !== null, 422);

        if (in_array((string) $booking->status, ['cancelled', 'completed', 'finished'], true)) {
            return response()->json(['ok' => true]);
        }

        abort_unless(in_array((string) $booking->status, ['pending', 'confirmed', 'waiting', 'called'], true), 422);

        $booking->update(['status' => 'cancelled']);

        return response()->json([
            'ok' => true,
            'queue_no' => (string) $booking->queue_no,
            'status' => 'cancelled',
        ]);
    }
}
