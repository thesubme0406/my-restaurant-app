<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
