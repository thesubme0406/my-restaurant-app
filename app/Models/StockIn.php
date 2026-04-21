<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockIn extends Model
{
    use HasFactory;

    protected $table = 'stock_ins';

    public $timestamps = false;

    protected $fillable = [
        'po_id',
        'staff_id',
        'total_price',
        'import_date',
    ];

    protected function casts(): array
    {
        return [
            'import_date' => 'datetime',
            'total_price' => 'decimal:2',
        ];
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'po_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    public function stockInDetails(): HasMany
    {
        return $this->hasMany(StockInDetail::class, 'imp_id');
    }

    public function ingredients(): BelongsToMany
    {
        return $this->belongsToMany(Ingredient::class, 'stock_in_details', 'imp_id', 'ing_id')
            ->withPivot(['quantity', 'cost_price']);
    }
}
