<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'payments';

    public $timestamps = false;

    protected $fillable = [
        'service_id',
        'staff_id',
        'total_amount',
        'method',
        'note',
        'payment_time',
        'deletion_reason',
        'deleted_by_staff_id',
    ];

    protected function casts(): array
    {
        return [
            'payment_time' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'service_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    public function deletedByStaff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'deleted_by_staff_id');
    }
}
