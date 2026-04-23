/** ຄໍລໍາລາຍງານສະຖິຕິຄິວ */
export function getQueueStatisticsColumns(queueStatus) {
    const queueCountOnly = (v) => {
        const n = Math.trunc(Number(v ?? 0));
        return <span className="tabular-nums text-slate-900">{String(n)}</span>;
    };

    const queueDailyColumns = [
        { key: 'summary_date', header: 'ວັນທີ' },
        { key: 'completed_count', header: 'ຄິວສຳເລັດ', cell: (row) => queueCountOnly(row.completed_count) },
        { key: 'skipped_count', header: 'ຄິວຂ້າມ', cell: (row) => queueCountOnly(row.skipped_count) },
        { key: 'cancelled_count', header: 'ຄິວຍົກເລີກ', cell: (row) => queueCountOnly(row.cancelled_count) },
        { key: 'day_total', header: 'ລວມ', cell: (row) => queueCountOnly(row.day_total) },
    ];

    if (queueStatus === 'all') {
        return queueDailyColumns;
    }

    const countHeader =
        {
            completed: 'ສຳເລັດ (ຄິວ/ມື້)',
            skipped: 'ຂ້າມຄິວ (ຄິວ/ມື້)',
            cancelled: 'ຍົກເລີກ (ຄິວ/ມື້)',
            other: 'ອື່ນໆ (ຄິວ/ມື້)',
        }[queueStatus] ?? 'ຈຳນວນ (ຄິວ/ມື້)';

    return [
        { key: 'summary_date', header: 'ວັນທີ' },
        { key: 'status_count', header: countHeader, cell: (row) => queueCountOnly(row.status_count) },
    ];
}

