<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UsageDetail extends Model
{
    use HasFactory;

    protected $table = 'usage_detail';

    public $timestamps = false;

    protected $fillable = [
        'usage_id',
        'ing_id',
        'usage_qty',
    ];

    public function stockUsage(): BelongsTo
    {
        return $this->belongsTo(StockUsage::class, 'usage_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class, 'ing_id');
    }
}
