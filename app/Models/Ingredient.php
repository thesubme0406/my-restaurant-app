<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ingredient extends Model
{
    use HasFactory;

    protected $table = 'ingredients';

    protected $fillable = [
        'ing_name',
        'ing_unit',
        'ing_quantity',
        'ing_min',
    ];

    public function poDetails(): HasMany
    {
        return $this->hasMany(PoDetail::class, 'ing_id');
    }

    public function stockInDetails(): HasMany
    {
        return $this->hasMany(StockInDetail::class, 'ing_id');
    }

    public function usageDetails(): HasMany
    {
        return $this->hasMany(UsageDetail::class, 'ing_id');
    }

    public function purchaseOrders(): BelongsToMany
    {
        return $this->belongsToMany(PurchaseOrder::class, 'po_detail', 'ing_id', 'po_id')
            ->withPivot(['quantity']);
    }

    public function stockIns(): BelongsToMany
    {
        return $this->belongsToMany(StockIn::class, 'stock_in_detail', 'ing_id', 'imp_id')
            ->withPivot(['quantity', 'cost_price']);
    }

    public function stockUsages(): BelongsToMany
    {
        return $this->belongsToMany(StockUsage::class, 'usage_detail', 'ing_id', 'usage_id')
            ->withPivot(['usage_qty']);
    }
}
