import { formatAmount } from '@/utils/formatAmount';
import { computeReceiptTotals } from '@/utils/receiptTotals';
import './PaymentReceipt.css';

/**
 * @typedef {{ name: string, price: number, qty: number, description?: string }} ReceiptLineItem
 */

function lineDescription(item) {
    if (item.description && String(item.description).trim() !== '') {
        return item.description;
    }
    const q = Number(item.qty) || 0;
    const n = String(item.name ?? '');
    if (q > 0 && n) {
        return `${q} ${n}`;
    }
    return n || '—';
}

function lineTotal(item) {
    const p = Math.round(Number(item.price) || 0);
    const q = Math.max(0, Math.round(Number(item.qty) || 0));
    return p * q;
}

/**
 * Reusable thermal-style payment receipt. Line prices are VAT-inclusive (10%);
 * receipt shows VAT split from inclusive total via `computeReceiptTotals`.
 *
 * @param {{
 *   logoSrc: string;
 *   businessName?: string;
 *   contactLines: string[];
 *   paymentId: string;
 *   serviceCode: string;
 *   staffName: string;
 *   tableNo: string;
 *   paymentMethodLabel: string;
 *   paymentTimeDisplay: string;
 *   items: ReceiptLineItem[];
 *   note?: string | null;
 *   customerName?: string | null;
 *   printedAtDisplay: string;
 * }} props
 */
export default function PaymentReceipt({
    logoSrc,
    businessName = 'OSHINEI VIENTIANE',
    contactLines,
    paymentId,
    serviceCode,
    staffName,
    tableNo,
    paymentMethodLabel,
    paymentTimeDisplay,
    items,
    note,
    customerName,
    printedAtDisplay,
}) {
    const subtotal = items.reduce((acc, it) => acc + lineTotal(it), 0);
    const { netBeforeVat, vat, grandTotal } = computeReceiptTotals(subtotal);

    return (
        <article className="payment-receipt" lang="lo" aria-label="ໃບບິນຊຳລະເງິນ">
            <div className="payment-receipt__logo-wrap">
                <img className="payment-receipt__logo" src={logoSrc} alt="" width={80} height={80} />
            </div>
            <p className="payment-receipt__brand">{businessName}</p>
            <div className="payment-receipt__contact">
                {contactLines.map((line) => (
                    <p key={line}>{line}</p>
                ))}
            </div>

            <div className="payment-receipt__meta">
                <div className="payment-receipt__meta-row">
                    <span className="payment-receipt__meta-key">ລະຫັດຊຳລະ :</span>
                    <span className="payment-receipt__meta-val nums">{paymentId}</span>
                </div>
                <div className="payment-receipt__meta-row">
                    <span className="payment-receipt__meta-key">ລະຫັດບໍລິການ :</span>
                    <span className="payment-receipt__meta-val nums">{serviceCode}</span>
                </div>
                <div className="payment-receipt__meta-row">
                    <span className="payment-receipt__meta-key">ພະນັກງານ :</span>
                    <span className="payment-receipt__meta-val">{staffName}</span>
                </div>
                <div className="payment-receipt__meta-row">
                    <span className="payment-receipt__meta-key">ໂຕະ :</span>
                    <span className="payment-receipt__meta-val">{tableNo}</span>
                </div>
                <div className="payment-receipt__meta-row">
                    <span className="payment-receipt__meta-key">ວິທີຊຳລະ :</span>
                    <span className="payment-receipt__meta-val">{paymentMethodLabel}</span>
                </div>
                <div className="payment-receipt__meta-row">
                    <span className="payment-receipt__meta-key">ເວລາຊຳລະ :</span>
                    <span className="payment-receipt__meta-val">{paymentTimeDisplay}</span>
                </div>
            </div>

            <div className="payment-receipt__bill-check">Bill Check</div>

            <table className="payment-receipt__table">
                <thead>
                    <tr>
                        <th className="payment-receipt__th-desc">ຈຳນວນຄົນ / ລາຍການ</th>
                        <th className="payment-receipt__th-amt">ຈຳນວນເງິນ</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={`${idx}-${lineDescription(item)}`}>
                            <td className="payment-receipt__td-desc">{lineDescription(item)}</td>
                            <td className="payment-receipt__td-amt nums">
                                {formatAmount(lineTotal(item))} ກີບ
                            </td>
                        </tr>
                    ))}
                    <tr className="payment-receipt__subtotal">
                        <td className="payment-receipt__td-desc">ລວມ :</td>
                        <td className="payment-receipt__td-amt nums">{formatAmount(subtotal)} ກີບ</td>
                    </tr>
                </tbody>
            </table>

            <hr className="payment-receipt__dash" />

            <div className="payment-receipt__totals">
                <div className="payment-receipt__total-row">
                    <span className="payment-receipt__total-key">ລວມລາຄາສິນຄ້າກ່ອນພາສີ :</span>
                    <span className="payment-receipt__total-val nums">{formatAmount(netBeforeVat)} ກີບ</span>
                </div>
                <div className="payment-receipt__total-row">
                    <span className="payment-receipt__total-key">ພາສີມູນຄ່າເພີ່ມ (10%) :</span>
                    <span className="payment-receipt__total-val nums">{formatAmount(vat)} ກີບ</span>
                </div>
                <div className="payment-receipt__grand">
                    <span>ລວມລາຄາທັງໝົດ:</span>
                    <span className="payment-receipt__grand-val nums">{formatAmount(grandTotal)} ກີບ</span>
                </div>
            </div>

            {note ? (
                <p className="payment-receipt__note">
                    <strong>ໝາຍເຫດ:</strong> {note}
                </p>
            ) : null}
            {customerName ? (
                <p className="payment-receipt__note">
                    <strong>ລູກຄ້າ:</strong> {customerName}
                </p>
            ) : null}

            <p className="payment-receipt__footer">ຂອບໃຈທີ່ໃຊ້ບໍລິການ</p>
            <p className="payment-receipt__printed">Printed {printedAtDisplay}</p>
        </article>
    );
}
