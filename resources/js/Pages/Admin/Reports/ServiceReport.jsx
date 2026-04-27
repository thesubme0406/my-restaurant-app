/** ຄໍລໍາລາຍງານ Service (session ຕໍ່ໂຕະ) */
export function getServiceColumns() {
    return [
        { key: 'index', header: '#', cell: (_row, idx) => idx + 1 },
        { key: 'service_id', header: 'Service ID' },
        { key: 'queue_no', header: 'ຄິວ' },
        { key: 'table_no', header: 'ໂຕະ' },
        { key: 'customer_name', header: 'ລູກຄ້າ' },
        { key: 'tier_name', header: 'Tier' },
        { key: 'guest_count', header: 'ຈຳນວນຄົນ' },
        { key: 'start_time', header: 'ເລີ່ມບໍລິການ' },
        { key: 'end_time', header: 'ສິ້ນສຸດ' },
        {
            key: 'duration_min',
            header: 'ເວລານັ່ງ (ນາທີ)',
            cell: (row) => (row.duration_min == null ? '—' : row.duration_min),
        },
        {
            key: 'payment_status',
            header: 'ສະຖານະຊຳລະ',
            cell: (row) =>
                row.payment_status === 'paid' ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">ຊຳລະແລ້ວ</span>
                ) : (
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">ຍັງບໍ່ຊຳລະ</span>
                ),
        },
    ];
}

