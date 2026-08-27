import { formatAmount } from '@/utils/formatAmount';
import { paymentMethodLabel } from '@/utils/paymentMethod';

/** ຄໍລໍາລາຍງານລາຍຮັບ */
export function getIncomeColumns() {
    return [
        { key: 'index', header: '#', cell: (_row, idx) => idx + 1 },
        { key: 'payment_time', header: 'ວັນທີ/ເວລາ' },
        { key: 'payment_id', header: 'ເລກທີບິນ' },
        { key: 'service_id', header: 'Service ID' },
        { key: 'tier_name', header: 'Tier' },
        { key: 'guest_count', header: 'ຈຳນວນລູກຄ້າ' },
        {
            key: 'method',
            header: 'ວິທີຊຳລະ',
            cell: (row) => paymentMethodLabel(row.method),
        },
        { key: 'closed_by', header: 'ຜູ້ປິດບິນ' },
        { key: 'total_amount', header: 'ຍອດລວມ', cell: (row) => `${formatAmount(row.total_amount ?? 0)} KIP` },
    ];
}

