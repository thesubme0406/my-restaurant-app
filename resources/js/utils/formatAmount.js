/**
 * ຈຸດທສັນຍະ en-US — ຕົວເລກເງິນ/ລາຄາເຊັ່ນ 1,000,000 ຫຼື 50,250.75
 * @param {unknown} value
 * @param {number} [maximumFractionDigits=2]
 */
export function formatAmount(value, maximumFractionDigits = 2) {
    const n = Number(value);
    if (Number.isNaN(n)) {
        return '0';
    }
    return n.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: maximumFractionDigits,
    });
}
