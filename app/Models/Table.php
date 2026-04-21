<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Table extends Model
{
    use HasFactory;

    protected $table = 'tables';

    public $timestamps = false;

    protected $fillable = [
        'table_no',
        'capacity',
        'zone',
        'status',
    ];

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'table_id');
    }

    public function serviceDetails(): HasMany
    {
        return $this->hasMany(ServiceDetail::class, 'table_id');
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'service_detail', 'table_id', 'service_id');
    }
}
