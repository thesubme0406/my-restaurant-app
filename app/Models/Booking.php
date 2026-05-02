<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    use HasFactory;

    /** ສະຖານະຄິວລໍຖ້າໂຕະ (ແຜງ walk-in ແລະການຂ້າມ/ຍົກເລີກກ່ອນນັ່ງ) */
    public const STATUSES_WAITLIST = ['waiting', 'pending', 'confirmed'];

    protected $table = 'bookings';

    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'customer_name',
        'phone',
        'tier_id',
        'table_id',
        'queue_no',
        'queue_day',
        'guest_count',
        'expected_time',
        'queued_at',
        'called_at',
        'dining_finished_at',
        'paid_at',
        'status',
        'skip_count',
    ];

    protected function casts(): array
    {
        return [
            'expected_time' => 'datetime',
            'queued_at' => 'datetime',
            'called_at' => 'datetime',
            'dining_finished_at' => 'datetime',
            'paid_at' => 'datetime',
            'queue_day' => 'date',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function buffetTier(): BelongsTo
    {
        return $this->belongsTo(BuffetTier::class, 'tier_id');
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class, 'table_id');
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class, 'booking_id');
    }

    /**
     * ຄິວລໍຖ້າໃນແຜງມື້ນີ້: ຍັງບໍ່ມີໂຕະ, ສະຖານະລໍຖ້າ — ກອງຕາມ expected_time = ມື້ປັດຈຸບັນ.
     */
    public function scopeDashboardWaitingToday(Builder $query): Builder
    {
        $today = Carbon::today()->toDateString();

        return $query
            ->whereDate('expected_time', $today)
            ->whereIn('status', self::STATUSES_WAITLIST)
            ->whereNull('table_id');
    }

    /**
     * ຄິວຖືກຂ້າມໃນແຜງມື້ນີ້ (ຍັງບໍ່ມີໂຕະ) — ໃຊ້ຮ່ວມກັບລຽງ FIFO ດຽວກັບຄິວລໍຖ້າ.
     */
    public function scopeDashboardSkippedToday(Builder $query): Builder
    {
        $today = Carbon::today()->toDateString();

        return $query
            ->whereDate('expected_time', $today)
            ->where('status', 'skipped')
            ->whereNull('table_id');
    }
}
