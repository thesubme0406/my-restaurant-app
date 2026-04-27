/**
 * ລາຄາສິນຄ້າແມ່ນລວມພາສີ 10% ແລ້ວ — ແຍກພາສີອອກຈາກຍອດລວມ (ກີບເຕັມ).
 * VAT ສ່ວນ = round(T × 10/110), ລາຄາບໍ່ລວມພາສີ = T − VAT (ໃຫ້ກົງກັບຍອດລວມ).
 *
 * @param {number} inclusiveTotal — ລວມລາຍການ (ລາຄາລວມພາສີແລ້ວ)
 * @returns {{ netBeforeVat: number, vat: number, grandTotal: number }}
 */
export function computeReceiptTotals(inclusiveTotal) {
    const T = Math.max(0, Math.round(Number(inclusiveTotal) || 0));
    const vat = Math.round((T * 10) / 110);
    const netBeforeVat = T - vat;
    return {
        netBeforeVat,
        vat,
        grandTotal: T,
    };
}
