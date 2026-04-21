<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Menu extends Model
{
    use HasFactory;

    protected $table = 'menus';

    protected $fillable = [
        'catg_id',
        'name',
        'description',
        'image',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MenuCatg::class, 'catg_id');
    }

    public function menuDetails(): HasMany
    {
        return $this->hasMany(MenuDetail::class, 'menu_id');
    }

    public function buffetTiers(): BelongsToMany
    {
        return $this->belongsToMany(BuffetTier::class, 'menu_detail', 'menu_id', 'buffet_tier_id');
    }
}
