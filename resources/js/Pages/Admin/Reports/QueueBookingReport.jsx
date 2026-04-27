/** ຄໍລໍາລາຍງານການຈອງຄິວ */
export function getQueueBookingColumns() {
    return [
        { key: 'index', header: '#', cell: (_row, idx) => idx + 1 },
        { key: 'queue_no', header: 'ຄິວ' },
        { key: 'booking_date', header: 'ວັນທີຈອງ' },
        { key: 'customer_name', header: 'ຊື່ລູກຄ້າ' },
        { key: 'guest_count', header: 'ຈຳນວນຄົນ' },
        { key: 'tier_name', header: 'Buffet Tier' },
        { key: 'phone', header: 'ເບີໂທລະສັບ' },
        {
            key: 'status',
            header: 'ສະຖານະ',
            cell: (row) => {
                const s = row.status;
                if (s === 'pending' || s === 'waiting') {
                    return <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">ລໍຖ້າ</span>;
                }
                if (s === 'confirmed' || s === 'called' || s === 'checked-in') {
                    return <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">ຖືກເອີ້ນແລ້ວ</span>;
                }
                if (s === 'cancelled') {
                    return <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">ຍົກເລີກ</span>;
                }
                return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{s || '—'}</span>;
            },
        },
    ];
}

