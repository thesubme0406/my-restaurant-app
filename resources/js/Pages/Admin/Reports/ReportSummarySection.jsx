import { ReportStatCard } from '@/Components/Reports/ReportFilterPrimitives';
import { formatAmount } from '@/utils/formatAmount';

/** ສ່ວນສະຫຼຸບຂໍ້ມູນຕາມປະເພດລາຍງານ */
export default function ReportSummarySection({ reportType, summary, moneyKip }) {
    if (reportType === 'queue_statistics') {
        return (
            <div>
                <p className="mb-2 text-sm font-semibold text-[#194c9f] font-sans">ສະຫຼຸບສະຖິຕິຄິວຕາມສະຖານະ</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <ReportStatCard title="ຄິວສຳເລັດ" value={summary.completed_total ?? 0} />
                    <ReportStatCard title="ຄິວຂ້າມ" value={summary.skipped_total ?? 0} />
                    <ReportStatCard title="ຄິວຍົກເລີກ" value={summary.cancelled_total ?? 0} />
                    <ReportStatCard title="ລວມ (ຊ່ວງທີ່ເລືອກ)" value={summary.total_queue ?? 0} />
                </div>
            </div>
        );
    }

    if (reportType === 'queue_booking') {
        return (
            <div className="grid gap-2 sm:grid-cols-3">
                <ReportStatCard title="ລວມແຂກທັງໝົດ" value={summary.total_guests ?? 0} />
                <ReportStatCard title="ຄິວທີ່ລໍຖ້າ" value={summary.pending_count ?? 0} />
                <ReportStatCard title="ຄິວທີ່ຖືກເອີ້ນແລ້ວ" value={summary.confirmed_count ?? 0} />
            </div>
        );
    }

    if (reportType === 'menu') {
        return (
            <div>
                <p className="mb-2 text-sm font-semibold text-[#194c9f] font-sans">ສະຫຼຸບເມນູຕາມ Tier ໃນຕາຕະລາງ</p>
                <div className="grid gap-2 sm:grid-cols-3">
                    <ReportStatCard title="ລາຍການໃນຕາຕະລາງ" value={summary.total_rows ?? 0} />
                    <ReportStatCard title="ເມນູເປີດໃຊ້ງານ" value={summary.active_menus ?? 0} />
                    <ReportStatCard title="ເມນູປິດໃຊ້ງານ" value={summary.inactive_menus ?? 0} />
                </div>
            </div>
        );
    }

    if (reportType === 'ingredient_usage') {
        return (
            <div className="grid gap-2 sm:grid-cols-2">
                <ReportStatCard title="ລາຍການນຳໃຊ້ທັງໝົດ" value={summary.total_rows ?? 0} />
                <ReportStatCard title="ຈຳນວນນຳໃຊ້ລວມ" value={summary.total_used_qty ?? 0} />
            </div>
        );
    }

    if (reportType === 'ingredient_purchase') {
        return (
            <div className="grid gap-2 sm:grid-cols-2">
                <ReportStatCard title="ຈຳນວນຄຳສັ່ງຊື້ທັງໝົດ" value={summary.total_orders ?? 0} />
                <ReportStatCard title="ມູນຄ່າລວມ" value={`${formatAmount(summary.total_amount ?? 0)} ກີບ`} />
            </div>
        );
    }

    if (reportType === 'ingredient_import') {
        return (
            <div className="grid gap-2 sm:grid-cols-2">
                <ReportStatCard title="ຈຳນວນລາຍການນຳເຂົ້າ" value={summary.total_rows ?? 0} />
                <ReportStatCard title="ມູນຄ່ານຳເຂົ້າລວມ" value={`${formatAmount(summary.total_import_amount ?? 0)} ກີບ`} />
            </div>
        );
    }

    if (reportType === 'service') {
        return (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <ReportStatCard title="Service ທັງໝົດ" value={summary.total_services ?? 0} />
                <ReportStatCard title="ຊຳລະແລ້ວ" value={summary.paid_count ?? 0} />
                <ReportStatCard title="ຍັງບໍ່ຊຳລະ" value={summary.unpaid_count ?? 0} />
                <ReportStatCard title="ເວລານັ່ງສະເລ່ຍ" value={`${summary.avg_duration_min ?? 0} ນາທີ`} />
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-sm font-semibold text-[#194c9f] font-sans">ສະຫຼຸບລາຍຮັບຊ່ວງທີ່ເລືອກ</p>
            <p className="text-2xl font-bold text-slate-900">{moneyKip(summary.total)}</p>
            <p className="mt-1 text-xs text-slate-600 font-sans">ຈຳນວນບິນ: {summary.count ?? 0}</p>
        </div>
    );
}

