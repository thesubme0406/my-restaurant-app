<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PurchaseOrder extends Model
{
    use HasFactory;

    protected $table = 'purchase_orders';

    protected $fillable = [
        'staff_id',
        'sup_id',
        'po_date',
        'po_status',
    ];

    protected function casts(): array
    {
        return [
            'po_date' => 'datetime',
        ];
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'sup_id');
    }

    public function poDetails(): HasMany
    {
        return $this->hasMany(PoDetail::class, 'po_id');
    }

    public function stockIn(): HasOne
    {
        return $this->hasOne(StockIn::class, 'po_id');
    }

    public function ingredients(): BelongsToMany
    {
        return $this->belongsToMany(Ingredient::class, 'po_detail', 'po_id', 'ing_id')
            ->withPivot(['quantity']);
    }
}
