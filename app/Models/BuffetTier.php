<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BuffetTier extends Model
{
    use HasFactory;

    protected $table = 'buffet_tiers';

    public $timestamps = false;

    protected $fillable = [
        'tier_name',
        'price',
        'image',
        'description',
    ];

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'tier_id');
    }

    public function menuDetails(): HasMany
    {
        return $this->hasMany(MenuDetail::class, 'buffet_tier_id');
    }

    public function menus(): BelongsToMany
    {
        return $this->belongsToMany(Menu::class, 'menu_detail', 'buffet_tier_id', 'menu_id');
    }
}
