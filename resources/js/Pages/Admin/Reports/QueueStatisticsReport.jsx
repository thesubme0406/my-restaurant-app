/** ຄໍລໍາລາຍງານສະຖິຕິຄິວ */
export function getQueueStatisticsColumns(queueStatus) {
    const queueCountOnly = (v) => {
        const n = Math.trunc(Number(v ?? 0));
        return <span className="tabular-nums text-slate-900">{String(n)}</span>;
    };

    const queueDailyColumns = [
        { key: 'summary_date', header: 'ວັນທີ' },
        { key: 'completed_count', header: 'ຄິວສຳເລັດ', cell: (row) => queueCountOnly(row.completed_count) },
        { key: 'cancelled_count', header: 'ຄິວຍົກເລີກ', cell: (row) => queueCountOnly(row.cancelled_count) },
        { key: 'day_total', header: 'ລວມ (ສຳເລັດ + ຍົກເລີກ)', cell: (row) => queueCountOnly(row.day_total) },
        {
            key: 'skipped_count',
            header: 'ຄັ້ງຂ້າມ (ຂໍ້ມູນເສີມ)',
            cell: (row) => (
                <span className="tabular-nums text-amber-800">{String(Math.trunc(Number(row.skipped_count ?? 0)))}</span>
            ),
        },
    ];

    if (queueStatus === 'all') {
        return queueDailyColumns;
    }

    const countHeader =
        {
            completed: 'ສຳເລັດ (ຄິວ/ມື້)',
            skipped: 'ຄັ້ງຂ້າມ (ຂໍ້ມູນເສີມ)',
            cancelled: 'ຍົກເລີກ (ຄິວ/ມື້)',
            other: 'ອື່ນໆ (ຄິວ/ມື້)',
        }[queueStatus] ?? 'ຈຳນວນ (ຄິວ/ມື້)';

    return [
        { key: 'summary_date', header: 'ວັນທີ' },
        { key: 'status_count', header: countHeader, cell: (row) => queueCountOnly(row.status_count) },
    ];
}

