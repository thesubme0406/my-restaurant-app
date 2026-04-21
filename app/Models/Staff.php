<?php

namespace App\Models;

use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Staff extends Model implements AuthenticatableContract
{
    use Authenticatable, HasFactory;

    protected $table = 'staffs';

    public function getAuthIdentifierName(): string
    {
        return 'phone';
    }

    protected $fillable = [
        'name',
        'surname',
        'username',
        'password',
        'role',
        'image',
        'address',
        'phone',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function news(): HasMany
    {
        return $this->hasMany(News::class, 'staff_id');
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'staff_id');
    }

    public function stockIns(): HasMany
    {
        return $this->hasMany(StockIn::class, 'staff_id');
    }

    public function stockUsages(): HasMany
    {
        return $this->hasMany(StockUsage::class, 'staff_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'staff_id');
    }
}
