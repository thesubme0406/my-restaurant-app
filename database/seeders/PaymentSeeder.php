<?php

namespace Database\Seeders;

use App\Models\Payment;
use App\Models\Service;
use App\Models\Staff;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $staff = Staff::query()->where('role', 'manager')->orderBy('id')->first();
        if (! $staff) {
            return;
        }

        $completedServices = Service::query()
            ->with(['booking.buffetTier', 'serviceDetails.table'])
            ->where('status', 'completed')
            ->orderBy('id')
            ->limit(2)
            ->get();

        foreach ($completedServices as $index => $service) {
            $booking = $service->booking;
            $tierPrice = (float) ($booking?->buffetTier?->price ?? 0);
            $guestCount = (int) ($booking?->guest_count ?? 0);
            $totalAmount = $tierPrice * $guestCount;

            Payment::query()->updateOrCreate(
                ['service_id' => $service->id],
                [
                    'staff_id' => $staff->id,
                    'total_amount' => $totalAmount,
                    'method' => $index % 2 === 0 ? 'cash' : 'transfer',
                    'payment_time' => Carbon::now()->subHours(2 - $index),
                ]
            );

            $service->update([
                'status' => 'completed',
                'end_time' => $service->end_time ?? Carbon::now()->subHour(),
            ]);

            if ($booking) {
                $booking->update(['status' => 'finished']);
            }

            foreach ($service->serviceDetails as $detail) {
                $detail->table?->update(['usage_status' => 'available']);
            }
        }
    }
}

