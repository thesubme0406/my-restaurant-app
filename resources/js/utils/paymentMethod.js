/** @typedef {'cash' | 'transfer' | 'credit_card'} PaymentMethodValue */

export const PAYMENT_METHODS = /** @type {const} */ ([
    { value: 'cash', label: 'ເງິນສົດ' },
    { value: 'transfer', label: 'ເງິນໂອນ' },
    { value: 'credit_card', label: 'ບັດເຄຣດິດ' },
]);

/** @param {string | undefined | null} method */
export function paymentMethodLabel(method) {
    const found = PAYMENT_METHODS.find((m) => m.value === method);
    return found?.label ?? (method ? String(method) : '—');
}

/** Filter dropdown options including "all". */
export function paymentMethodFilterOptions() {
    return [{ value: 'all', label: 'ທຸກວິທີ' }, ...PAYMENT_METHODS];
}

/** Select options for forms (no "all"). */
export function paymentMethodSelectOptions() {
    return [...PAYMENT_METHODS];
}

/** @param {string | undefined | null} method */
export function paymentMethodBadgeTone(method) {
    if (method === 'cash') {
        return 'success';
    }
    if (method === 'transfer') {
        return 'info';
    }
    if (method === 'credit_card') {
        return 'warning';
    }
    return 'neutral';
}

/** @param {string | undefined | null} method */
export function normalizePaymentMethod(method) {
    return PAYMENT_METHODS.some((m) => m.value === method) ? method : 'cash';
}
