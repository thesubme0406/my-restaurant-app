import AdminLayout from '@/Layouts/AdminLayout';
import GenericReportTable from '@/Components/Reports/GenericReportTable';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { useMemo, useState } from 'react';

const reportOptions = [
    { value: 'income', label: 'ລາຍງານລາຍຮັບ' },
    { value: 'queue_statistics', label: 'ລາຍງານສະຖິຕິຄິວ' },
    { value: 'queue_booking', label: 'ລາຍງານການຈອງຄິວ' },
    { value: 'menu', label: 'ລາຍງານຂໍ້ມູນເມນູ' },
    { value: 'ingredient_usage', label: 'ລາຍງານການໃຊ້ວັດຖຸດິບ' },
    { value: 'ingredient_purchase', label: 'ລາຍງານການສັ່ງຊື້ວັດຖຸດິບ' },
];

const menuStatusOptions = [
    { value: 'all', label: 'ເມນູທັງໝົດ' },
    { value: 'active', label: 'ເມນູເປີດໃຊ້ງານ' },
    { value: 'inactive', label: 'ເມນູປິດໃຊ້ງານ' },
];

function moneyKip(v) {
    const n = Number(v || 0);
    return `${n.toLocaleString('en-US')} KIP`;
}

export default function ReportsPage({
    initialType,
    initialFrom,
    initialTo,
    initialStatusFilter,
    initialCategoryId,
    menuCategories = [],
    initialRows = [],
    initialSummary = {},
}) {
    const [reportType, setReportType] = useState(initialType ?? 'income');
    const [from, setFrom] = useState(initialFrom ?? '');
    const [to, setTo] = useState(initialTo ?? '');
    const [statusFilter, setStatusFilter] = useState(initialStatusFilter ?? 'all');
    const [categoryId, setCategoryId] = useState(initialCategoryId ?? 'all');
    const [rows, setRows] = useState(initialRows);
    const [summary, setSummary] = useState(initialSummary);
    const [loading, setLoading] = useState(false);
    const isMenuReport = reportType === 'menu';

    const incomeColumns = useMemo(
        () => [
            { key: 'index', header: '#', cell: (_row, idx) => idx + 1 },
            { key: 'payment_time', header: 'ວັນທີ/ເວລາ' },
            { key: 'payment_id', header: 'ເລກທີບິນ' },
            { key: 'table_no', header: 'ໂຕະ' },
            { key: 'tier_name', header: 'Tier' },
            { key: 'guest_count', header: 'ຈຳນວນລູກຄ້າ' },
            {
                key: 'method',
                header: 'ວິທີຊຳລະ',
                cell: (row) => (row.method === 'cash' ? 'Cash' : row.method === 'transfer' ? 'Transfer' : row.method),
            },
            { key: 'total_amount', header: 'ຍອດລວມ', cell: (row) => moneyKip(row.total_amount) },
        ],
        []
    );

    const queueColumns = useMemo(
        () => [
            { key: 'index', header: '#', cell: (_row, idx) => idx + 1 },
            { key: 'queue_no', header: 'ເລກຄິວ' },
            { key: 'customer_name', header: 'ຊື່ລູກຄ້າ' },
            { key: 'guest_count', header: 'ຈຳນວນຄົນ' },
            { key: 'booking_time', header: 'ເວລາຈອງ' },
            {
                key: 'estimated_wait_minutes',
                header: 'ເວລາລໍຖ້າໂດຍປະມານ',
                cell: (row) => (row.estimated_wait_minutes == null ? '—' : `${row.estimated_wait_minutes} ນາທີ`),
            },
            {
                key: 'actual_wait_minutes',
                header: 'ເວລາລໍຖ້າຕົວຈິງ',
                cell: (row) => (row.actual_wait_minutes == null ? 'N/A' : `${row.actual_wait_minutes} ນາທີ`),
            },
            {
                key: 'status',
                header: 'ສະຖານະ',
                cell: (row) => {
                    const s = row.status;
                    if (s === 'completed' || s === 'finished' || s === 'called') {
                        return <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">ສຳເລັດ</span>;
                    }
                    if (s === 'skipped') {
                        return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">ຂ້າມຄິວ</span>;
                    }
                    if (s === 'cancelled') {
                        return <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">ຍົກເລີກ</span>;
                    }
                    return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{s}</span>;
                },
            },
        ],
        []
    );

    const bookingColumns = useMemo(
        () => [
            { key: 'index', header: '#', cell: (_row, idx) => idx + 1 },
            { key: 'booking_date', header: 'ວັນທີຈອງ' },
            { key: 'expected_time', header: 'ເວລາຄາດການ' },
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
                        return <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending</span>;
                    }
                    if (s === 'confirmed' || s === 'called' || s === 'checked-in') {
                        return <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Confirmed</span>;
                    }
                    if (s === 'cancelled') {
                        return <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">Cancelled</span>;
                    }
                    return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{s || '—'}</span>;
                },
            },
        ],
        []
    );

    const menuColumns = useMemo(
        () => [
            {
                key: 'image_url',
                header: 'ຮູບພາບ',
                cell: (row) =>
                    row.image_url ? (
                        <img src={row.image_url} alt={row.menu_name} className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                        <div className="h-10 w-10 rounded-md bg-slate-200" />
                    ),
            },
            { key: 'menu_code', header: 'ລະຫັດເມນູ' },
            { key: 'menu_name', header: 'ຊື່ເມນູ' },
            { key: 'category_name', header: 'ປະເພດອາຫານ' },
            {
                key: 'status_label',
                header: 'ສະຖານະເມນູ',
                cell: (row) =>
                    row.is_active ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">ເປີດໃຊ້ງານ</span>
                    ) : (
                        <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">ປິດໃຊ້ງານ</span>
                    ),
            },
        ],
        []
    );

    const usageColumns = useMemo(
        () => [
            { key: 'ingredient_name', header: 'ຊື່ວັດຖຸດິບ' },
            { key: 'usage_date', header: 'ວັນທີນຳໃຊ້' },
            { key: 'used_qty', header: 'ຈຳນວນທີ່ໃຊ້' },
            { key: 'unit', header: 'ຫົວໜ່ວຍ' },
            { key: 'remaining_qty', header: 'ຈຳນວນຄົງເຫຼືອ', cell: (row) => `${row.remaining_qty ?? 0} ${row.unit ?? ''}`.trim() },
            { key: 'staff_name', header: 'ຊື່ພະນັກງານ (ຜູ້ບັນທຶກການໃຊ້)' },
        ],
        []
    );

    const purchaseColumns = useMemo(
        () => [
            { key: 'purchase_code', header: 'ລະຫັດຄຳສັ່ງຊື້' },
            { key: 'purchase_date', header: 'ວັນທີ' },
            { key: 'supplier_name', header: 'ຊື່ຜູ້ສະໜອງ' },
            { key: 'total_price', header: 'ລາຄາລວມ', cell: (row) => `${Number(row.total_price ?? 0).toLocaleString('en-US')} ກີບ` },
            {
                key: 'po_status_label',
                header: 'ສະຖານະ PO',
                cell: (row) => {
                    if (row.po_status === 'Received' || row.po_status === 'Completed') {
                        return <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">ເຄື່ອງເຂົ້າແລ້ວ</span>;
                    }
                    if (row.po_status === 'Ordered') {
                        return <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">ກຳລັງຈັດສົ່ງ</span>;
                    }
                    return <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">ກຳລັງລໍຖ້າ</span>;
                },
            },
            { key: 'buyer_name', header: 'ຊື່ພະນັກງານ (ຜູ້ຊື້)' },
        ],
        []
    );

    const columns =
        reportType === 'income'
            ? incomeColumns
            : reportType === 'queue_statistics'
              ? queueColumns
              : reportType === 'queue_booking'
                ? bookingColumns
                : reportType === 'menu'
                  ? menuColumns
                  : reportType === 'ingredient_usage'
                    ? usageColumns
                    : reportType === 'ingredient_purchase'
                      ? purchaseColumns
              : [{ key: 'message', header: 'ລາຍງານ', cell: () => 'Coming soon' }];

    const fetchReport = (nextType = reportType, nextFrom = from, nextTo = to, nextStatus = statusFilter, nextCategory = categoryId) => {
        setLoading(true);
        const paramsObj = { type: nextType, _ts: String(Date.now()) };
        if (nextType === 'menu') {
            paramsObj.status_filter = nextStatus;
            paramsObj.category_id = nextCategory;
        } else {
            paramsObj.from = nextFrom;
            paramsObj.to = nextTo;
        }
        const params = new URLSearchParams(paramsObj);
        fetch(`${route('admin.reports.data')}?${params.toString()}`, {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Report fetch failed: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                setRows(Array.isArray(data.rows) ? data.rows : []);
                setSummary(data.summary ?? {});
            })
            .catch(() => {
                setRows([]);
                setSummary({});
            })
            .finally(() => setLoading(false));
    };

    const onChangeReportType = (nextType) => {
        setReportType(nextType);
        setRows([]);
        setSummary({});
        fetchReport(nextType, from, to, statusFilter, categoryId);
    };

    const resetFilter = () => {
        setReportType('income');
        setFrom('');
        setTo('');
        setStatusFilter('all');
        setCategoryId('all');
        fetchReport('income', '', '');
    };

    const printReport = () => window.print();

    const exportCsv = () => {
        if (!rows.length) return;
        const headers = columns.map((c) => c.header);
        const csvRows = rows.map((row, idx) =>
            columns.map((col) => {
                const val = typeof col.cell === 'function' ? col.cell(row, idx) : row[col.key];
                return `"${String(val ?? '').replaceAll('"', '""')}"`;
            })
        );
        const csv = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportType}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AdminLayout title="ລາຍງານ">
            <Head title="ລາຍງານ" />
            <div className="-mx-4 -mt-2 bg-slate-50 px-4 pb-12 pt-4 md:-mx-8 md:px-8 md:pb-14 md:pt-6">
                <div className="mx-auto max-w-7xl space-y-4">
                    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-200/80">
                        <div className={`grid gap-3 ${isMenuReport ? 'md:grid-cols-[240px_200px_220px_auto_auto]' : 'md:grid-cols-[240px_1fr_1fr_auto_auto]'} md:items-end`}>
                            <div>
                                <label className="text-sm font-semibold text-slate-700">ເລືອກປະເພດລາຍງານ</label>
                                <select
                                    value={reportType}
                                    onChange={(e) => onChangeReportType(e.target.value)}
                                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
                                >
                                    {reportOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {isMenuReport ? (
                                <>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">ກອງຂໍ້ມູນ</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
                                        >
                                            {menuStatusOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">ປະເພດອາຫານ</label>
                                        <select
                                            value={categoryId}
                                            onChange={(e) => setCategoryId(e.target.value)}
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
                                        >
                                            <option value="all">ເລືອກທັງໝົດ</option>
                                            {menuCategories.map((cat) => (
                                                <option key={cat.id} value={String(cat.id)}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">ຕັ້ງແຕ່</label>
                                        <input
                                            type="date"
                                            value={from}
                                            onChange={(e) => setFrom(e.target.value)}
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">ຫາ</label>
                                        <input
                                            type="date"
                                            value={to}
                                            onChange={(e) => setTo(e.target.value)}
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
                                        />
                                    </div>
                                </>
                            )}
                            <button
                                type="button"
                                onClick={() => fetchReport()}
                                disabled={loading}
                                className="rounded-xl bg-[#1e3a8a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
                            >
                                {loading ? 'ກຳລັງໂຫຼດ...' : 'ຄົ້ນຫາ'}
                            </button>
                            <button
                                type="button"
                                onClick={resetFilter}
                                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                            >
                                ຍົກເລີກ
                            </button>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-200/80">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                {reportType === 'queue_statistics' ? (
                                    <div className="grid gap-2 sm:grid-cols-3">
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-xs text-slate-500">ຄິວທັງໝົດ</p>
                                            <p className="text-lg font-bold text-slate-900">{summary.total_queue ?? 0}</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-xs text-slate-500">ເວລາລໍຖ້າສະເລ່ຍ</p>
                                            <p className="text-lg font-bold text-slate-900">{summary.avg_wait_minutes ?? 0} ນາທີ</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-xs text-slate-500">ຄິວທີ່ຖືກຍົກເລີກ/ຂ້າມ</p>
                                            <p className="text-lg font-bold text-slate-900">{summary.non_completed ?? 0}</p>
                                        </div>
                                    </div>
                                ) : reportType === 'queue_booking' ? (
                                    <div className="grid gap-2 sm:grid-cols-3">
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-xs text-slate-500">ລວມແຂກທັງໝົດ</p>
                                            <p className="text-lg font-bold text-slate-900">{summary.total_guests ?? 0}</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-xs text-slate-500">ຄິວທີ່ລໍຖ້າຍືນຍັນ</p>
                                            <p className="text-lg font-bold text-slate-900">{summary.pending_count ?? 0}</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-xs text-slate-500">ຄິວທີ່ຢືນຍັນແລ້ວ</p>
                                            <p className="text-lg font-bold text-slate-900">{summary.confirmed_count ?? 0}</p>
                                        </div>
                                    </div>
                                ) : reportType === 'menu' ? (
                                    <div className="grid gap-2 sm:grid-cols-3">
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-xs text-slate-500">ເມນູທັງໝົດ</p>
                                            <p className="text-lg font-bold text-slate-900">{summary.total_menus ?? 0}</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-xs text-slate-500">ເມນູເປີດໃຊ້ງານ</p>
                                            <p className="text-lg font-bold text-slate-900">{summary.active_menus ?? 0}</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-xs text-slate-500">ເມນູປິດໃຊ້ງານ</p>
                                            <p className="text-lg font-bold text-slate-900">{summary.inactive_menus ?? 0}</p>
                                        </div>
                                    </div>
                                ) : reportType === 'ingredient_usage' ? (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-xs text-slate-500">ລາຍການນຳໃຊ້ທັງໝົດ</p>
                                            <p className="text-lg font-bold text-slate-900">{summary.total_rows ?? 0}</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-xs text-slate-500">ຈຳນວນນຳໃຊ້ລວມ</p>
                                            <p className="text-lg font-bold text-slate-900">{summary.total_used_qty ?? 0}</p>
                                        </div>
                                    </div>
                                ) : reportType === 'ingredient_purchase' ? (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-xs text-slate-500">ຈຳນວນຄຳສັ່ງຊື້ທັງໝົດ</p>
                                            <p className="text-lg font-bold text-slate-900">{summary.total_orders ?? 0}</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-xs text-slate-500">ມູນຄ່າລວມ</p>
                                            <p className="text-lg font-bold text-slate-900">{Number(summary.total_amount ?? 0).toLocaleString('en-US')} ກີບ</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm text-slate-600">ສະຫຼຸບລາຍຮັບຊ່ວງທີ່ເລືອກ</p>
                                        <p className="text-2xl font-bold text-slate-900">{moneyKip(summary.total)}</p>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={exportCsv}
                                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                                >
                                    Export Excel
                                </button>
                            </div>
                        </div>

                        <GenericReportTable columns={columns} rows={rows} />
                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={printReport}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a8a] px-4 py-2.5 text-sm font-semibold text-white"
                            >
                                <Printer className="h-4 w-4" />
                                ພິມລາຍງານ
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
