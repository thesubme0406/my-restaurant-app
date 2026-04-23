<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;

class Service extends Model
{
    use HasFactory;

    protected $table = 'services';

    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'start_time',
        'end_time',
        'status',
        'service_code',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function serviceDetails(): HasMany
    {
        return $this->hasMany(ServiceDetail::class, 'service_id');
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class, 'service_id');
    }

    public function tables(): BelongsToMany
    {
        return $this->belongsToMany(Table::class, 'service_detail', 'service_id', 'table_id');
    }

    /**
     * ລະຫັດໂຕະທີ່ມີບໍລິການ in_service ຍັງບໍ່ຊຳລະ — ແຫຼ່ງຄວາມຈິງດຽວກັບແຜງຄິວ (ບໍ່ອີງແຕ່ usage_status ໃນຕາຕະລາງ tables).
     *
     * @return array<int, true>
     */
    public static function activeUnpaidOccupiedTableIdSet(): array
    {
        $set = [];
        $services = self::query()
            ->with('serviceDetails:id,service_id,table_id')
            ->where('status', 'in_service')
            ->whereDoesntHave('payment')
            ->get();

        foreach ($services as $service) {
            foreach ($service->serviceDetails as $detail) {
                $tableId = (int) $detail->table_id;
                if ($tableId > 0) {
                    $set[$tableId] = true;
                }
            }
        }

        return $set;
    }

    /** ລະຫັດບໍລິການແບບສຸ່ມ ບໍ່ເກີນ 10 ຕົວອັກສອນ (ກົດ DB unique). */
    public static function newServiceCode(): string
    {
        do {
            $code = 'S'.str_pad((string) random_int(0, 999999999), 9, '0', STR_PAD_LEFT);
        } while (self::query()->where('service_code', $code)->exists());

        return $code;
    }

    /**
     * ສ້າງແຖວ services + service_detail ຖ້າຄິວນັ່ງໂຕະແລ້ວແຕ່ຍັງບໍ່ມີເຊດຊັນ in_service ທີ່ຍັງບໍ່ຊຳລະ.
     */
    public static function ensureOpenSessionForSeatedBooking(Booking $booking): ?Service
    {
        if ($booking->table_id === null) {
            return null;
        }

        $existing = self::query()
            ->where('booking_id', $booking->id)
            ->where('status', 'in_service')
            ->whereDoesntHave('payment')
            ->first();
        if ($existing !== null) {
            return $existing;
        }

        return DB::transaction(function () use ($booking): ?Service {
            $locked = Booking::query()->whereKey($booking->id)->lockForUpdate()->first();
            if ($locked === null) {
                return null;
            }

            $again = self::query()
                ->where('booking_id', $locked->id)
                ->where('status', 'in_service')
                ->whereDoesntHave('payment')
                ->first();
            if ($again !== null) {
                return $again;
            }

            if ($locked->table_id === null) {
                return null;
            }

            $service = self::query()->create([
                'booking_id' => $locked->id,
                'start_time' => now(),
                'end_time' => null,
                'status' => 'in_service',
                'service_code' => self::newServiceCode(),
            ]);

            ServiceDetail::query()->create([
                'service_id' => $service->id,
                'table_id' => $locked->table_id,
            ]);

            return $service;
        });
    }
}
