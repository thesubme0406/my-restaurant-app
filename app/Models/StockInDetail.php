<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockInDetail extends Model
{
    use HasFactory;

    protected $table = 'stock_in_details';

    public $timestamps = false;

    protected $fillable = [
        'imp_id',
        'ing_id',
        'quantity',
        'cost_price',
    ];

    public function stockIn(): BelongsTo
    {
        return $this->belongsTo(StockIn::class, 'imp_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class, 'ing_id');
    }
}
