<?php

namespace App\Support;

use App\Models\BuffetTier;

class BuffetTierLabel
{
    public static function forBooking(?BuffetTier $tier): string
    {
        if ($tier === null) {
            return '—';
        }

        return number_format((float) $tier->price).' ກີບ '.trim((string) $tier->tier_name);
    }

    public static function forSelect(BuffetTier $tier): string
    {
        return trim((string) $tier->tier_name).' - '.number_format((float) $tier->price).' ກີບ';
    }
}
