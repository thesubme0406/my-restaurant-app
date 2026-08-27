/** ຄໍລໍາລາຍງານການຈອງຄິວ */
export function getQueueBookingColumns() {
    const statusBadge = 'inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold';

    return [
        { key: 'index', header: '#', cell: (_row, idx) => idx + 1 },
        { key: 'queue_no', header: 'ຄິວ' },
        { key: 'booking_date', header: 'ວັນທີຈອງ' },
        { key: 'customer_name', header: 'ຊື່ລູກຄ້າ' },
        { key: 'guest_count', header: 'ຈຳນວນຄົນ' },
        { key: 'tier_name', header: 'Buffet Tier' },
        { key: 'phone', header: 'ເບີໂທລະສັບ' },
        {
            key: 'zone_label',
            header: 'ໂຊນ',
            cell: (row) =>
                row.is_vip || row.zone === 'vip' ? (
                    <span className="inline-flex whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        👑 ໂຊນ VIP
                    </span>
                ) : (
                    <span className="inline-flex whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        ໂຊນທຳມະດາ
                    </span>
                ),
        },
        {
            key: 'status',
            header: 'ສະຖານະ',
            cell: (row) => {
                const s = row.status;
                if (s === 'pending' || s === 'waiting' || s === 'confirmed') {
                    return <span className={`${statusBadge} bg-amber-100 text-amber-700`}>ລໍຖ້າ</span>;
                }
                if (s === 'skipped') {
                    return <span className={`${statusBadge} bg-sky-100 text-sky-700`}>ຂ້າມແລ້ວ</span>;
                }
                if (s === 'called' || s === 'checked-in') {
                    return <span className={`${statusBadge} bg-emerald-100 text-emerald-700`}>ຖືກເອີ້ນແລ້ວ</span>;
                }
                if (s === 'completed' || s === 'finished') {
                    return <span className={`${statusBadge} bg-blue-100 text-blue-700`}>ສຳເລັດ</span>;
                }
                if (s === 'cancelled') {
                    return <span className={`${statusBadge} bg-rose-100 text-rose-700`}>ຍົກເລີກ</span>;
                }
                return <span className={`${statusBadge} bg-slate-100 text-slate-700`}>{s || '—'}</span>;
            },
        },
    ];
}
