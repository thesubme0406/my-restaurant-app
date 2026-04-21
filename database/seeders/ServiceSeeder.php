<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Service;
use App\Models\Table;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $bookings = Booking::query()->orderBy('queue_no')->limit(5)->get();
        $tables = Table::query()->orderBy('id')->limit(5)->get();

        if ($bookings->count() < 5 || $tables->count() < 5) {
            return;
        }

        foreach ($bookings as $i => $booking) {
            $table = $tables[$i];
            $isActive = $i < 3;
            $startTime = Carbon::now()->subMinutes(($i + 1) * 25);

            $service = Service::query()->updateOrCreate(
                ['service_code' => 'SV'.str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT)],
                [
                    'booking_id' => $booking->id,
                    'start_time' => $startTime,
                    'end_time' => $isActive ? null : $startTime->copy()->addMinutes(90),
                    'status' => $isActive ? 'in_service' : 'completed',
                ]
            );

            DB::table('service_detail')->updateOrInsert(
                ['service_id' => $service->id, 'table_id' => $table->id],
                ['service_id' => $service->id, 'table_id' => $table->id]
            );

            $booking->update([
                'table_id' => $table->id,
                'status' => $isActive ? 'confirmed' : 'completed',
            ]);

            $table->update([
                'status' => $isActive ? 'occupied' : 'available',
            ]);
        }
    }
}

