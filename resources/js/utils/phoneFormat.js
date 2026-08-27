/** 11 digits (020…, 021…, 030…) or 9 digits without leading 0 (20…, 21…, 30…). */
export const PHONE_PATTERN = /^(0\d{10}|\d{9})$/;

export const PHONE_MAX_LENGTH = 11;

export const PHONE_PLACEHOLDER = '02012345678';

export const PHONE_VALIDATION_MESSAGE =
    'ເບີໂທຕ້ອງມີ 9 ຫຼື 11 ຫຼັກ (ຕົວຢ່າງ 02012345678, 021123456, 03012345678).';

export function digitsOnly(value, maxLen = PHONE_MAX_LENGTH) {
    return String(value ?? '')
        .replace(/\D/g, '')
        .slice(0, maxLen);
}

export function isValidPhone(value) {
    return PHONE_PATTERN.test(digitsOnly(value));
}
