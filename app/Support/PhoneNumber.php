<?php

namespace App\Support;

class PhoneNumber
{
    /** 11 digits (020…, 021…, 030…) or 9 digits without leading 0 (20…, 21…, 30…). */
    public const PATTERN = '/^(0\d{10}|\d{9})$/';

    public const MESSAGE = 'ເບີໂທຕ້ອງມີ 9 ຫຼື 11 ຫຼັກ (ຕົວຢ່າງ 02012345678, 021123456, 03012345678).';

    public const PLACEHOLDER = '02012345678';

    public const MAX_LENGTH = 11;

    public static function digits(string $value): string
    {
        return preg_replace('/\D+/', '', $value) ?? '';
    }

    public static function isValid(string $value): bool
    {
        return preg_match(self::PATTERN, self::digits($value)) === 1;
    }

    /**
     * @return array<int, string>
     */
    public static function rules(bool $required = true): array
    {
        return array_values(array_filter([
            $required ? 'required' : 'nullable',
            'string',
            'regex:'.self::PATTERN,
        ]));
    }

    /**
     * @return array<string, string>
     */
    public static function messages(): array
    {
        return [
            'phone.regex' => self::MESSAGE,
            'contact_tel.regex' => self::MESSAGE,
        ];
    }
}
