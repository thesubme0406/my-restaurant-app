import { formatAmount } from '@/utils/formatAmount';

/**
 * @param {string | undefined} method
 */
function methodLabelLao(method) {
    if (method === 'cash') {
        return 'ເງິນສົດ';
    }
    if (method === 'transfer') {
        return 'ເງິນໂອນ';
    }
    return method ? String(method) : '—';
}

/**
 * ຈັດຮູບແບບເວລາຊຳລະເປັນ "DD / MM / YYYY, hh:mm AM"
 * @param {string | undefined} paymentTimeFromServer e.g. from PHP m/d/Y, h:i A
 */
function formatPaymentTimeDisplay(paymentTimeFromServer) {
    if (!paymentTimeFromServer || typeof paymentTimeFromServer !== 'string') {
        return '—';
    }
    const trimmed = paymentTimeFromServer.trim();
    const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(.+)$/);
    if (m) {
        const mm = m[1].padStart(2, '0');
        const dd = m[2].padStart(2, '0');
        const yyyy = m[3];
        return `${dd} / ${mm} / ${yyyy}, ${m[4]}`;
    }
    return trimmed;
}

function printedTimestamp() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    let h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) {
        h = 12;
    }
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd} / ${mm} / ${yyyy}, ${h}:${mi} ${ampm}`;
}

/**
 * ສ້າງ props ສຳລັບ PaymentReceipt ຈາກແຖວປະຫວັດຊຳລະ (Inertia).
 * @param {Record<string, unknown>} row
 * @param {{ logoSrc?: string }} [opts]
 */
export function buildPaymentReceiptProps(row, opts = {}) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const logoSrc = opts.logoSrc ?? `${origin}/images/oshinei-logo.png`;

    const guestCount = Number(row.guest_count ?? 0);
    const tierPrice = Number(row.tier_price ?? 0);
    const tierName = row.buffet_tier != null && String(row.buffet_tier).trim() !== '' ? String(row.buffet_tier) : '—';
    const totalAmount = Number(row.total_amount ?? 0);

    /** @type {{ name: string, price: number, qty: number, description?: string }[]} */
    let items = [];
    if (Array.isArray(row.receipt_items) && row.receipt_items.length > 0) {
        items = row.receipt_items.map((x) => ({
            name: String(x.name ?? ''),
            price: Number(x.price ?? 0),
            qty: Math.max(0, Number(x.qty ?? 0)),
            description: x.description != null ? String(x.description) : undefined,
        }));
    } else if (guestCount > 0 && tierPrice > 0) {
        items = [
            {
                name: `ບຸບເຟ້ ${tierName}`.trim(),
                price: tierPrice,
                qty: guestCount,
                description: `ບຸບເຟ້ ${tierName} ${formatAmount(tierPrice)} × ${guestCount}`,
            },
        ];
    } else {
        items = [{ name: `ບຸບເຟ້ ${tierName}`.trim(), price: totalAmount, qty: 1 }];
    }

    const sumLines = items.reduce((acc, it) => acc + Number(it.price) * Number(it.qty), 0);
    const remainder = Math.max(0, Math.round((totalAmount - sumLines) * 100) / 100);
    if (remainder > 0.009) {
        items = [...items, { name: 'ລາຍການອື່ນ / ປັບຍອດ', price: remainder, qty: 1 }];
    }

    return {
        logoSrc,
        businessName: 'OSHINEI VIENTIANE',
        contactLines: [
            'ສະຖານທີ່: ບ້ານ ສະພານທອງ, ເມືອງ: ໄຊເສດຖາ, ນະຄອນຫຼວງວຽງຈັນ',
            '0655561001498',
            'ໂທ 02055555555 / 0309999999999',
        ],
        paymentId: String(row.id ?? '').padStart(2, '0'),
        serviceCode: String(row.service_id ?? '').padStart(2, '0'),
        staffName: row.staff_name != null && String(row.staff_name).trim() !== '' ? String(row.staff_name) : '—',
        tableNo: String(row.table_no ?? '—'),
        paymentMethodLabel: methodLabelLao(row.method),
        paymentTimeDisplay: formatPaymentTimeDisplay(row.payment_time),
        items,
        note: row.note != null && String(row.note).trim() !== '' ? String(row.note) : null,
        customerName: row.customer_name != null ? String(row.customer_name) : null,
        printedAtDisplay: printedTimestamp(),
    };
}
