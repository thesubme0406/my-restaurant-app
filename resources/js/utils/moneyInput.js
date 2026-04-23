/**
 * ຄ່າຟອມເງິນ: ຕັດເຫຼືອຕົວເລກ + ຈຸດທດສອນ (ສູງສຸດ 2 ຕຳແໜ່ງ) — ບໍ່ມີ comma
 * @param {unknown} value
 * @returns {string}
 */
export function parseMoneyInput(value) {
    const t = String(value ?? '').replace(/,/g, '');
    let out = '';
    let dot = false;
    for (let i = 0; i < t.length; i++) {
        const c = t[i];
        if (c >= '0' && c <= '9') {
            const parts = out.split('.');
            if (parts.length > 1 && (parts[1] ?? '').length >= 2) {
                continue;
            }
            out += c;
        } else if (c === '.' && !dot) {
            out += '.';
            dot = true;
        }
    }
    return out;
}

/**
 * ສະແດງ comma ຈາກຄ່າ canonical (ສຳລັບ input text)
 * @param {unknown} canonical
 * @returns {string}
 */
export function formatMoneyInputDisplay(canonical) {
    const c = canonical == null ? '' : String(canonical);
    if (c === '') {
        return '';
    }
    const parts = c.split('.');
    const intRaw = parts[0] ?? '';
    const frac = (parts[1] ?? '').slice(0, 2);
    const trailingDot = c.endsWith('.') && parts.length === 2 && frac.length === 0;

    if (intRaw === '' && !trailingDot && parts.length === 1) {
        return '';
    }

    const intNum = intRaw === '' ? 0 : Number(intRaw);
    const intFmt = Number.isNaN(intNum) ? '' : intNum.toLocaleString('en-US');

    if (trailingDot) {
        return intFmt === '' ? '0.' : `${intFmt}.`;
    }
    if (parts.length > 1) {
        return `${intFmt}.${frac}`;
    }
    return intFmt;
}

/**
 * ປ່ຽນ ຄ່າ API / ຕົວເລກ ເປັນ canonical string
 * @param {unknown} value
 * @returns {string}
 */
export function toMoneyCanonical(value) {
    if (value == null || value === '') {
        return '';
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) ? parseMoneyInput(String(value)) : '';
    }
    return parseMoneyInput(String(value));
}
