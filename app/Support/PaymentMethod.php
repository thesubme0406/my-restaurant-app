<?php

namespace App\Support;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\In;

class PaymentMethod
{
    public const CASH = 'cash';

    public const TRANSFER = 'transfer';

    public const CREDIT_CARD = 'credit_card';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return [self::CASH, self::TRANSFER, self::CREDIT_CARD];
    }

    public static function rule(): In
    {
        return Rule::in(self::values());
    }

    public static function isValid(?string $method): bool
    {
        return $method !== null && in_array($method, self::values(), true);
    }
}
