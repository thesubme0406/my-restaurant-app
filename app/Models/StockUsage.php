<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockUsage extends Model
{
    use HasFactory;

    protected $table = 'stock_usage';

    protected $fillable = [
        'staff_id',
        'usage_date',
    ];

    protected function casts(): array
    {
        return [
            'usage_date' => 'datetime',
        ];
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    public function usageDetails(): HasMany
    {
        return $this->hasMany(UsageDetail::class, 'usage_id');
    }

    public function ingredients(): BelongsToMany
    {
        return $this->belongsToMany(Ingredient::class, 'usage_detail', 'usage_id', 'ing_id')
            ->withPivot(['usage_qty']);
    }
}
