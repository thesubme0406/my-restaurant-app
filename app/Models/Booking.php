<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    use HasFactory;

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
        'status',
        'skip_count',
    ];

    protected function casts(): array
    {
        return [
            'expected_time' => 'datetime',
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
}
