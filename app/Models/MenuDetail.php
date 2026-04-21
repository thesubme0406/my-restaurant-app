<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuDetail extends Model
{
    use HasFactory;

    protected $table = 'menu_detail';

    protected $fillable = [
        'buffet_tier_id',
        'menu_id',
    ];

    public function buffetTier(): BelongsTo
    {
        return $this->belongsTo(BuffetTier::class, 'buffet_tier_id');
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class, 'menu_id');
    }
}
