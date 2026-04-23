// ຊຳລະເງິນ: ໂຕະກຳລັງໃຊ້ + ປະຫວັດ + ສະຖິຕິຕາມວັນທີ
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Landmark, Loader2, Printer, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import MoneyAmountInput from '@/Components/MoneyAmountInput';
import { formatAmount } from '@/utils/formatAmount';

const primary = '#194c9f';

// ແຈ້ງສຳເລັດແບບ toast ມຸມຈໍ
function toastSuccess(title) {
    void Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title,
        showConfirmButton: false,
        timer: 4200,
        timerProgressBar: true,
        customClass: { popup: 'font-sans text-sm' },
    });
}

const methodOptions = [
    { value: '', label: 'ທຸກວິທີ' },
    { value: 'cash', label: 'ເງິນສົດ' },
    { value: 'transfer', label: 'ເງິນໂອນ' },
];

const payMethods = methodOptions.filter((x) => x.value);

function methodBadge(method) {
    if (method === 'cash') {
        return <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">ເງິນສົດ</span>;
    }
    return <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">ເງິນໂອນ</span>;
}

function routeNamesFromUrl(url) {
    const path = typeof url === 'string' ? url.split('?')[0] : '';
    const isAdmin = path.startsWith('/admin');
    return {
        isAdmin,
        payments: isAdmin ? 'admin.payments' : 'staff.payments',
        paymentsStore: isAdmin ? 'admin.payments.store' : 'staff.payments.store',
        paymentsDestroy: isAdmin ? 'admin.payments.destroy' : 'staff.payments.destroy',
    };
}

export default function PaymentsPage({ payments = [], summary = {}, filters = {}, activeTables = [] }) {
    const page = usePage();
    const pageErrors = page.props.errors ?? {};
    const routes = useMemo(() => routeNamesFromUrl(page.url ?? ''), [page.url]);

    const [statsLoading, setStatsLoading] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [checkoutRow, setCheckoutRow] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [method, setMethod] = useState('cash');
    const [receivedAmount, setReceivedAmount] = useState('');
    const [paymentNote, setPaymentNote] = useState('');

    const [querySearch, setQuerySearch] = useState(filters.search ?? '');
    const [queryMethod, setQueryMethod] = useState(filters.method ?? '');
    const [queryFrom, setQueryFrom] = useState(filters.from ?? '');
    const [queryTo, setQueryTo] = useState(filters.to ?? '');

    useEffect(() => {
        setQuerySearch(filters.search ?? '');
        setQueryMethod(filters.method ?? '');
        setQueryFrom(filters.from ?? '');
        setQueryTo(filters.to ?? '');
    }, [filters.search, filters.method, filters.from, filters.to]);

    useEffect(() => {
        if (method !== 'cash') {
            setReceivedAmount('');
        }
    }, [method]);

    const totalAmount = Number(checkoutRow?.total_amount ?? 0);
    const received = Number(receivedAmount || 0);
    const change = method === 'cash' ? Math.max(received - totalAmount, 0) : 0;
    const insufficientCash = method === 'cash' && receivedAmount !== '' && received < totalAmount;

    const filterQuery = useCallback(() => {
        const q = {};
        if (querySearch) {
            q.search = querySearch;
        }
        if (queryMethod) {
            q.method = queryMethod;
        }
        if (queryFrom) {
            q.from = queryFrom;
        }
        if (queryTo) {
            q.to = queryTo;
        }
        return q;
    }, [querySearch, queryMethod, queryFrom, queryTo]);

    // ກອງປະຫວັດ + ໂຫຼດສະຖິຕິໃໝ່ຈາກເຊີເວີ
    const applyFilters = () => {
        setStatsLoading(true);
        router.get(route(routes.payments), filterQuery(), {
            preserveScroll: true,
            replace: true,
            onFinish: () => setStatsLoading(false),
        });
    };

    // ເປີດຟອມຊຳລະຕາມໂຕະທີ່ເລືອກ
    const openCheckout = (row) => {
        setCheckoutRow(row);
        setMethod('cash');
        setReceivedAmount('');
        setPaymentNote('');
        setCheckoutOpen(true);
    };

    const closeCheckout = () => {
        setCheckoutOpen(false);
        setCheckoutRow(null);
    };

    const submitPayment = () => {
        if (!checkoutRow || submitting || insufficientCash) {
            return;
        }
        setSubmitting(true);
        router.post(
            route(routes.paymentsStore),
            {
                service_id: checkoutRow.service_id,
                total_amount: totalAmount,
                method,
                received_amount: method === 'cash' && receivedAmount !== '' ? receivedAmount : null,
                note: paymentNote || null,
                search: querySearch,
                method_filter: queryMethod,
                from: queryFrom,
                to: queryTo,
            },
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    closeCheckout();
                    toastSuccess('ຊຳລະເງິນສຳເລັດແລ້ວ');
                },
            }
        );
    };

    const deletePayment = async (row) => {
        const qs = new URLSearchParams();
        if (querySearch) {
            qs.set('search', querySearch);
        }
        if (queryMethod) {
            qs.set('method', queryMethod);
        }
        if (queryFrom) {
            qs.set('from', queryFrom);
        }
        if (queryTo) {
            qs.set('to', queryTo);
        }
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        const deleteUrl = `${route(routes.paymentsDestroy, row.id)}${suffix}`;

        const result = await Swal.fire({
            icon: 'warning',
            title: 'ລຶບບິນຊຳລະນີ້?',
            html: `<p class="text-left text-slate-600">Payment #${row.id}</p><p class="mt-1 text-left font-semibold text-slate-800">${formatAmount(row.total_amount)} K · ${row.table_no ?? '—'}</p>`,
            showCancelButton: true,
            confirmButtonText: 'ລຶບ',
            cancelButtonText: 'ຍົກເລີກ',
            confirmButtonColor: primary,
            cancelButtonColor: '#64748b',
            reverseButtons: true,
            focusCancel: true,
            customClass: { popup: 'font-sans text-sm' },
        });
        if (!result.isConfirmed) {
            return;
        }

        router.delete(deleteUrl, {
            preserveScroll: true,
            onSuccess: () => toastSuccess('ລຶບລາຍການຊຳລະເງິນສຳເລັດແລ້ວ'),
            onError: () => {
                void Swal.fire({
                    icon: 'error',
                    title: 'ລຶບບໍ່ສຳເລັດ',
                    text: 'ລອງໃໝ່ ຫຼື ຕິດຕໍ່ຜູ້ດູແລລະບົບ',
                    confirmButtonColor: primary,
                    customClass: { popup: 'font-sans text-sm' },
                });
            },
        });
    };

    const printReceipt = (row) => {
        const receiptHtml = `
            <html>
                <head><title>Receipt #${row.id}</title></head>
                <body style="font-family: 'Noto Sans Lao', Arial, sans-serif; padding: 24px;">
                    <h2>Payment Receipt</h2>
                    <hr />
                    <p><strong>Payment ID:</strong> ${row.id}</p>
                    <p><strong>Service ID:</strong> ${row.service_id}</p>
                    <p><strong>Staff ID:</strong> ${row.staff_id}</p>
                    <p><strong>Customer:</strong> ${row.customer_name ?? '-'}</p>
                    <p><strong>Table:</strong> ${row.table_no ?? '-'}</p>
                    <p><strong>Guests:</strong> ${row.guest_count ?? 0}</p>
                    <p><strong>Buffet Tier:</strong> ${row.buffet_tier ?? '-'}</p>
                    <p><strong>Tier Price:</strong> ${formatAmount(row.tier_price)} K</p>
                    <p><strong>Total:</strong> ${formatAmount(row.total_amount)} K</p>
                    <p><strong>Method:</strong> ${row.method}</p>
                    <p><strong>Note:</strong> ${row.note ?? '-'}</p>
                    <p><strong>Payment Time:</strong> ${row.payment_time}</p>
                </body>
            </html>
        `;
        const win = window.open('', '_blank', 'width=600,height=800');
        if (!win) {
            return;
        }
        win.document.write(receiptHtml);
        win.document.close();
        win.focus();
        win.print();
    };

    const inputRowClass =
        'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20';

    return (
        <AdminLayout title="ຊຳລະເງິນ">
            <Head title="ຊຳລະເງິນ" />
            <div className="-mx-4 -mt-2 bg-slate-50 px-4 pb-12 pt-4 font-sans md:-mx-8 md:px-8 md:pb-14 md:pt-6">
                <div className="mx-auto max-w-7xl space-y-5">
                    {(pageErrors?.service_id || pageErrors?.received_amount) && (
                        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-sm sm:px-5">
                            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                                <span className="text-lg font-bold leading-none">!</span>
                            </span>
                            <div>
                                <p className="font-bold">ບໍ່ສາມາດຊຳລະໄດ້</p>
                                <p className="mt-0.5">{pageErrors.service_id || pageErrors.received_amount}</p>
                            </div>
                        </div>
                    )}

                    <section className="relative rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/80">
                        {statsLoading ? (
                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-[1px]">
                                <Loader2 className="h-8 w-8 animate-spin" style={{ color: primary }} aria-label="ກຳລັງໂຫຼດ" />
                            </div>
                        ) : null}
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-[#0f2744]">ສະຖິຕິຊຳລະເງິນ</h2>
                            <p className="text-sm text-slate-500">
                                ຕາມຊ່ວງທີ່ກອງ — ກົງກັບຕາຕະລາງປະຫວັດດ້ານລຸ່ມ
                            </p>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-bold text-slate-500">ຈຳນວນບິນ / ຍອດລວມ</p>
                                <p className="mt-1 text-2xl font-extrabold text-slate-900">{summary.count ?? 0}</p>
                                <p className="text-sm font-semibold text-slate-700">{formatAmount(summary.total)} K</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="mb-1 inline-flex rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
                                    <Landmark className="h-4 w-4" />
                                </div>
                                <p className="text-xs font-bold text-slate-500">ເງິນສົດ</p>
                                <p className="text-lg font-bold text-slate-900">{formatAmount(summary.cash)} K</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="mb-1 inline-flex rounded-lg bg-sky-100 p-1.5 text-sky-700">
                                    <Landmark className="h-4 w-4" />
                                </div>
                                <p className="text-xs font-bold text-slate-500">ເງິນໂອນ</p>
                                <p className="text-lg font-bold text-slate-900">{formatAmount(summary.transfer)} K</p>
                            </div>
                        </div>
                    </section>

                    {/* ສະແດງໂຕະຄ້າງຊຳລະ — ກ່ອງນ້ອຍ + ສະກຣອລ໌ດ້ານໃນ */}
                    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-200/80 sm:p-5">
                        <h2 className="text-lg font-bold tracking-tight text-[#0f2744] sm:text-xl">ໂຕະກຳລັງໃຊ້ງານ</h2>
                        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">ເລືອກ Check Out ເພື່ອຊຳລະຕາມບໍລິການທີ່ເປີດຢູ່</p>
                        {activeTables.length === 0 ? (
                            <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-600 sm:text-sm">
                                ບໍ່ມີໂຕະຄ້າງຊຳລະ
                            </p>
                        ) : (
                            <div className="mt-3 max-h-[min(280px,38vh)] overflow-y-auto overscroll-y-contain pr-1 [-webkit-overflow-scrolling:touch]">
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                    {activeTables.map((row) => (
                                        <div
                                            key={row.service_id}
                                            className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-slate-50/90 p-2.5 shadow-sm"
                                        >
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">ໂຕະ</p>
                                            <p className="truncate text-base font-extrabold leading-tight" style={{ color: primary }}>
                                                {row.table_no}
                                            </p>
                                            <p className="mt-1 truncate text-xs font-semibold text-slate-800" title={row.customer_name}>
                                                {row.customer_name}
                                            </p>
                                            <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-500">
                                                #{row.service_id} · {row.guest_count} ຄົນ
                                            </p>
                                            <p className="mt-1 text-xs font-bold text-slate-900">
                                                {formatAmount(row.total_amount)}{' '}
                                                <span className="font-semibold text-slate-500">K</span>
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => openCheckout(row)}
                                                className="mt-2 h-8 w-full rounded-lg text-[11px] font-bold text-white shadow-sm transition hover:opacity-95"
                                                style={{ backgroundColor: primary }}
                                            >
                                                Check Out
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/80">
                        <h3 className="text-2xl font-bold tracking-tight text-[#0f2744]">ປະຫວັດການຊຳລະເງິນ</h3>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <div className="relative w-full max-w-sm">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    value={querySearch}
                                    onChange={(e) => setQuerySearch(e.target.value)}
                                    placeholder="ຄົ້ນຫາ..."
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white py-0 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                />
                            </div>
                            <select
                                value={queryMethod}
                                onChange={(e) => setQueryMethod(e.target.value)}
                                aria-label="ກອງຕາມວິທີຊຳລະ"
                                className="h-11 w-[6.75rem] shrink-0 rounded-xl border border-slate-200 bg-white py-2 pl-2 pr-7 text-xs font-medium leading-snug text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                            >
                                {methodOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="date"
                                value={queryFrom}
                                onChange={(e) => setQueryFrom(e.target.value)}
                                className="h-11 min-w-[11rem] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                            />
                            <input
                                type="date"
                                value={queryTo}
                                onChange={(e) => setQueryTo(e.target.value)}
                                className="h-11 min-w-[11rem] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                            />
                            <button
                                type="button"
                                onClick={applyFilters}
                                disabled={statsLoading}
                                className="h-11 rounded-xl px-5 text-sm font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                                style={{ backgroundColor: primary }}
                            >
                                ກອງຂໍ້ມູນ
                            </button>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-100 text-slate-700">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-bold">Payment ID</th>
                                        <th className="px-3 py-2 text-left font-bold">ລະຫັດບໍລິການ</th>
                                        <th className="px-3 py-2 text-left font-bold">ລະຫັດພະນັກງານ</th>
                                        <th className="px-3 py-2 text-left font-bold">ໂຕະ</th>
                                        <th className="px-3 py-2 text-left font-bold">ຍອດລວມ</th>
                                        <th className="px-3 py-2 text-left font-bold">ວິທີຊຳລະ</th>
                                        <th className="px-3 py-2 text-left font-bold">ໝາຍເຫດ</th>
                                        <th className="px-3 py-2 text-left font-bold">ເວລາຊຳລະ</th>
                                        <th className="px-3 py-2 text-left font-bold">ຈັດການ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {payments.map((row) => (
                                        <tr key={row.id}>
                                            <td className="px-3 py-2 font-semibold">{row.id}</td>
                                            <td className="px-3 py-2 font-semibold" style={{ color: primary }}>
                                                {row.service_id}
                                            </td>
                                            <td className="px-3 py-2">{row.staff_id}</td>
                                            <td className="px-3 py-2 font-semibold" style={{ color: primary }}>
                                                {row.table_no}
                                            </td>
                                            <td className="px-3 py-2 font-semibold">{formatAmount(row.total_amount)} K</td>
                                            <td className="px-3 py-2">{methodBadge(row.method)}</td>
                                            <td className="max-w-[140px] truncate px-3 py-2 text-slate-600">{row.note || '—'}</td>
                                            <td className="px-3 py-2">{row.payment_time}</td>
                                            <td className="px-3 py-2">
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => printReceipt(row)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                                                    >
                                                        <Printer className="h-3.5 w-3.5" />
                                                        ພິມບິນ
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deletePayment(row)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-600"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        ລົບ
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {payments.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                                                ບໍ່ພົບຂໍ້ມູນຊຳລະເງິນ
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>

            {checkoutOpen && checkoutRow && (
                <div
                    className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 px-4 py-6 sm:px-6 sm:py-10"
                    role="presentation"
                    onClick={(e) => e.target === e.currentTarget && closeCheckout()}
                >
                    <div className="flex min-h-[calc(100dvh-3rem)] items-end justify-center sm:items-center sm:pb-0">
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="checkout-modal-title"
                            className="mb-[max(0.5rem,env(safe-area-inset-bottom,0px))] flex w-full max-w-lg max-h-[min(92dvh,40rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white font-sans shadow-xl sm:mb-0"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="shrink-0 border-b border-slate-100 px-5 py-4">
                                <h3 id="checkout-modal-title" className="text-xl font-bold text-[#0f2744]">
                                    Check Out — ໂຕະ {checkoutRow.table_no}
                                </h3>
                                <p className="mt-1 text-sm text-slate-600">
                                    {checkoutRow.customer_name} · ບໍລິການ #{checkoutRow.service_id}
                                </p>
                            </div>

                            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4">
                                <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                                    <p>
                                        <span className="font-bold text-slate-600">ລູກຄ້າ:</span> {checkoutRow.customer_name}
                                    </p>
                                    <p>
                                        <span className="font-bold text-slate-600">ຈຳນວນຄົນ:</span> {checkoutRow.guest_count}
                                    </p>
                                    <p>
                                        <span className="font-bold text-slate-600">ໂຕະ:</span>{' '}
                                        <span className="font-semibold" style={{ color: primary }}>
                                            {checkoutRow.table_no}
                                        </span>
                                    </p>
                                    <p>
                                        <span className="font-bold text-slate-600">Tier:</span> {checkoutRow.buffet_tier}
                                    </p>
                                </div>

                                <div className="grid gap-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-slate-600" htmlFor="pay-method">
                                            ວິທີການຊຳລະ
                                        </label>
                                        <select
                                            id="pay-method"
                                            value={method}
                                            onChange={(e) => setMethod(e.target.value)}
                                            className={inputRowClass}
                                        >
                                            {payMethods.map((m) => (
                                                <option key={m.value} value={m.value}>
                                                    {m.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-slate-600" htmlFor="pay-total">
                                            ຍອດລວມ
                                        </label>
                                        <input
                                            id="pay-total"
                                            readOnly
                                            value={`${formatAmount(checkoutRow.total_amount)} K`}
                                            className={`${inputRowClass} bg-slate-50 font-semibold text-slate-800`}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-slate-600" htmlFor="pay-received">
                                            ຮັບເງິນມາ (ເງິນສົດ)
                                        </label>
                                        <MoneyAmountInput
                                            id="pay-received"
                                            value={receivedAmount}
                                            onChange={setReceivedAmount}
                                            placeholder={method === 'cash' ? 'ຈຳນວນເງິນຮັບ' : '—'}
                                            disabled={method !== 'cash'}
                                            className={`${inputRowClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                                        />
                                        {method === 'cash' ? (
                                            <p className="mt-1 text-xs font-semibold text-slate-600">ເງິນທອນ: {formatAmount(change)} K</p>
                                        ) : null}
                                        {insufficientCash ? (
                                            <p className="mt-1 text-xs font-semibold text-rose-600">ຈຳນວນເງິນຮັບມາບໍ່ພຽງພໍ</p>
                                        ) : null}
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-slate-600" htmlFor="pay-note">
                                            ໝາຍເຫດ
                                        </label>
                                        <input
                                            id="pay-note"
                                            type="text"
                                            value={paymentNote}
                                            onChange={(e) => setPaymentNote(e.target.value)}
                                            placeholder="ບໍ່ບັງຄັບ..."
                                            className={inputRowClass}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={closeCheckout}
                                        className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
                                    >
                                        ຍົກເລີກ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={submitPayment}
                                        disabled={submitting || insufficientCash}
                                        className="h-10 rounded-xl px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                                        style={{
                                            backgroundColor: submitting || insufficientCash ? undefined : primary,
                                        }}
                                    >
                                        ຢືນຢັນການຊຳລະເງິນ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
