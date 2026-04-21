<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuCatg extends Model
{
    use HasFactory;

    protected $table = 'menu_catg';

    protected $fillable = [
        'catg_name',
        'image',
    ];

    public function menus(): HasMany
    {
        return $this->hasMany(Menu::class, 'catg_id');
    }
}
