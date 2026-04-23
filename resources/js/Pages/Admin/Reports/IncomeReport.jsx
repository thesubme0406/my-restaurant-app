import { formatAmount } from '@/utils/formatAmount';

/** ຄໍລໍາລາຍງານລາຍຮັບ */
export function getIncomeColumns() {
    return [
        { key: 'index', header: '#', cell: (_row, idx) => idx + 1 },
        { key: 'payment_time', header: 'ວັນທີ/ເວລາ' },
        { key: 'payment_id', header: 'ເລກທີບິນ' },
        { key: 'table_no', header: 'ໂຕະ' },
        { key: 'tier_name', header: 'Tier' },
        { key: 'guest_count', header: 'ຈຳນວນລູກຄ້າ' },
        {
            key: 'method',
            header: 'ວິທີຊຳລະ',
            cell: (row) => (row.method === 'cash' ? 'ເງິນສົດ' : row.method === 'transfer' ? 'ເງິນໂອນ' : row.method ?? '—'),
        },
        { key: 'total_amount', header: 'ຍອດລວມ', cell: (row) => `${formatAmount(row.total_amount ?? 0)} KIP` },
    ];
}

