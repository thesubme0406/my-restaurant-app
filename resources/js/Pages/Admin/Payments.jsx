// ຊຳລະເງິນ: ໂຕະກຳລັງໃຊ້ + ປະຫວັດ + ສະຖິຕິຕາມວັນທີ
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import StatusBadge from '@/Components/Admin/Common/StatusBadge';
import TablePagination from '@/Components/Admin/Common/TablePagination';
import ConfirmDialog from '@/Components/MasterData/ConfirmDialog';
import { Landmark, Loader2, Pencil, Printer, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import MoneyAmountInput from '@/Components/MoneyAmountInput';
import VoidPaymentDialog from '@/Pages/Admin/Payments/VoidPaymentDialog';
import EditVoidedPaymentDialog from '@/Pages/Admin/Payments/EditVoidedPaymentDialog';
import { formatAmount } from '@/utils/formatAmount';
import { paginateSlice, PAGE_SIZE } from '@/Components/Reports/reportTableUtils';
import { openPaymentReceiptPrint } from '@/utils/openPaymentReceiptPrint';
import {
    PAYMENT_METHODS,
    paymentMethodLabel,
    paymentMethodSelectOptions,
    paymentMethodBadgeTone,
} from '@/utils/paymentMethod';

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

const methodOptions = [{ value: '', label: 'ທຸກວິທີ' }, ...PAYMENT_METHODS];
const zoneFilterOptions = [
    { value: '', label: 'ທັງໝົດ' },
    { value: 'standard', label: 'ໂຊນທຳມະດາ' },
    { value: 'vip', label: 'ໂຊນ VIP' },
];
const payMethods = paymentMethodSelectOptions();

function routeNamesFromUrl(url) {
    const path = typeof url === 'string' ? url.split('?')[0] : '';
    const isAdmin = path.startsWith('/admin');
    return {
        isAdmin,
        payments: isAdmin ? 'admin.payments' : 'staff.payments',
        paymentsStore: isAdmin ? 'admin.payments.store' : 'staff.payments.store',
        paymentsDestroy: isAdmin ? 'admin.payments.destroy' : 'staff.payments.destroy',
        paymentsRestore: isAdmin ? 'admin.payments.restore' : 'staff.payments.restore',
        paymentsCorrectVoided: isAdmin ? 'admin.payments.correct-voided' : 'staff.payments.correct-voided',
    };
}

export default function PaymentsPage({
    payments = [],
    summary = {},
    filters = {},
    activeTables = [],
    can_delete_payments = false,
}) {
    const page = usePage();
    const pageErrors = page.props.errors ?? {};
    const routes = useMemo(() => routeNamesFromUrl(page.url ?? ''), [page.url]);
    const canDeletePayments = Boolean(can_delete_payments);

    const [statsLoading, setStatsLoading] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [checkoutRow, setCheckoutRow] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [method, setMethod] = useState('cash');
    const [receivedAmount, setReceivedAmount] = useState('');
    const [paymentNote, setPaymentNote] = useState('');

    const [querySearch, setQuerySearch] = useState(filters.search ?? '');
    const [queryMethod, setQueryMethod] = useState(filters.method ?? '');
    const [queryZone, setQueryZone] = useState(filters.zone ?? '');
    const [queryFrom, setQueryFrom] = useState(filters.from ?? '');
    const [queryTo, setQueryTo] = useState(filters.to ?? '');
    const [showDeleted, setShowDeleted] = useState(Boolean(filters.show_deleted));
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [voidTarget, setVoidTarget] = useState(null);
    const [voidError, setVoidError] = useState('');
    const [restoreTarget, setRestoreTarget] = useState(null);
    const [editVoidTarget, setEditVoidTarget] = useState(null);
    const [editVoidError, setEditVoidError] = useState('');
    const [voidActionBusy, setVoidActionBusy] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);

    useEffect(() => {
        setHistoryPage(1);
    }, [payments.length, showDeleted]);

    const { pageRows: pagedPayments } = useMemo(
        () => paginateSlice(payments, historyPage, PAGE_SIZE),
        [payments, historyPage]
    );

    useEffect(() => {
        setQuerySearch(filters.search ?? '');
        setQueryMethod(filters.method ?? '');
        setQueryZone(filters.zone ?? '');
        setQueryFrom(filters.from ?? '');
        setQueryTo(filters.to ?? '');
        setShowDeleted(Boolean(filters.show_deleted));
    }, [filters.search, filters.method, filters.zone, filters.from, filters.to, filters.show_deleted]);

    useEffect(() => {
        if (method !== 'cash') {
            setReceivedAmount('');
        }
    }, [method]);

    const totalAmount = Number(checkoutRow?.total_amount ?? 0);
    const received = Number(receivedAmount || 0);
    const change = method === 'cash' ? Math.max(received - totalAmount, 0) : 0;
    const insufficientCash = method === 'cash' && receivedAmount !== '' && received < totalAmount;

    const buildListQuery = useCallback(
        (deletedView = showDeleted) => {
            const q = {};
            if (querySearch) {
                q.search = querySearch;
            }
            if (queryMethod) {
                q.method = queryMethod;
            }
            if (queryZone) {
                q.zone = queryZone;
            }
            if (queryFrom) {
                q.from = queryFrom;
            }
            if (queryTo) {
                q.to = queryTo;
            }
            if (deletedView && canDeletePayments) {
                q.show_deleted = 1;
            }
            return q;
        },
        [querySearch, queryMethod, queryZone, queryFrom, queryTo, showDeleted, canDeletePayments]
    );

    const filterQuery = useCallback(() => buildListQuery(showDeleted), [buildListQuery, showDeleted]);

    // ກອງປະຫວັດ + ໂຫຼດສະຖິຕິໃໝ່ຈາກເຊີເວີ
    const applyFilters = () => {
        setHistoryPage(1);
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
                zone_filter: queryZone,
                from: queryFrom,
                to: queryTo,
            },
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
                onSuccess: (page) => {
                    const newPayments = page.props?.payments ?? [];
                    const match = newPayments
                        .filter((p) => String(p.service_id) === String(checkoutRow.service_id))
                        .sort((a, b) => Number(b.id) - Number(a.id))[0];
                    closeCheckout();
                    toastSuccess('ຊຳລະເງິນສຳເລັດແລ້ວ');
                    if (match) {
                        openPaymentReceiptPrint(match);
                    }
                },
            }
        );
    };

    const openVoidDialog = (row) => {
        if (!canDeletePayments || deleteBusy || showDeleted) {
            return;
        }
        setVoidError('');
        setVoidTarget(row);
    };

    const closeVoidDialog = () => {
        if (deleteBusy) {
            return;
        }
        setVoidTarget(null);
        setVoidError('');
    };

    const submitVoidPayment = ({ reason, password }) => {
        const row = voidTarget;
        if (!row || deleteBusy) {
            return;
        }

        const qs = new URLSearchParams(filterQuery());
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        const deleteUrl = `${route(routes.paymentsDestroy, row.id)}${suffix}`;

        setDeleteBusy(true);
        setVoidError('');
        router.delete(deleteUrl, {
            data: { reason, password },
            preserveScroll: true,
            onSuccess: () => {
                setVoidTarget(null);
                toastSuccess('ຍົກເລີກບິນຊຳລະສຳເລັດແລ້ວ');
            },
            onError: (errors) => {
                setVoidError(errors?.password || errors?.reason || 'ລອງໃໝ່ ຫຼື ຕິດຕໍ່ຜູ້ດູແລລະບົບ');
            },
            onFinish: () => setDeleteBusy(false),
        });
    };

    const voidedListSuffix = () => {
        const qs = new URLSearchParams(buildListQuery(true));
        const suffix = qs.toString();
        return suffix ? `?${suffix}` : '';
    };

    const confirmRestoreVoided = () => {
        const row = restoreTarget;
        if (!row || voidActionBusy || !canDeletePayments) {
            return;
        }

        setVoidActionBusy(true);
        router.post(`${route(routes.paymentsRestore, row.id)}${voidedListSuffix()}`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setRestoreTarget(null);
                toastSuccess('ກູ້ຄືນບິນຊຳລະສຳເລັດແລ້ວ');
            },
            onFinish: () => setVoidActionBusy(false),
        });
    };

    const openEditVoided = (row) => {
        if (!canDeletePayments || voidActionBusy) {
            return;
        }
        setEditVoidError('');
        setEditVoidTarget(row);
    };

    const closeEditVoided = () => {
        if (voidActionBusy) {
            return;
        }
        setEditVoidTarget(null);
        setEditVoidError('');
    };

    const submitEditVoided = ({ total_amount, method, reason }) => {
        const row = editVoidTarget;
        if (!row || voidActionBusy) {
            return;
        }

        setVoidActionBusy(true);
        setEditVoidError('');
        router.patch(`${route(routes.paymentsCorrectVoided, row.id)}${voidedListSuffix()}`, {
            total_amount,
            method,
            reason,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setEditVoidTarget(null);
                setShowDeleted(false);
                toastSuccess('ແກ້ໄຂແລະກູ້ຄືນບິນຊຳລະສຳເລັດແລ້ວ');
            },
            onError: (errors) => {
                setEditVoidError(
                    errors?.total_amount || errors?.method || errors?.reason || 'ບັນທຶກບໍ່ສຳເລັດ — ລອງໃໝ່'
                );
            },
            onFinish: () => setVoidActionBusy(false),
        });
    };

    const printReceipt = (row) => {
        openPaymentReceiptPrint(row);
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

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="mb-1 inline-flex rounded-lg bg-amber-100 p-1.5 text-amber-700">
                                    <Landmark className="h-4 w-4" />
                                </div>
                                <p className="text-xs font-bold text-slate-500">ບັດເຄຣດິດ</p>
                                <p className="text-lg font-bold text-slate-900">{formatAmount(summary.credit_card ?? 0)} K</p>
                            </div>
                            {canDeletePayments ? (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
                                    <p className="text-xs font-bold text-rose-700">ຍອດເງິນທີ່ຖືກຍົກເລີກ</p>
                                    <p className="mt-1 text-lg font-bold text-rose-900">{formatAmount(summary.voided_total ?? 0)} K</p>
                                    <p className="text-xs font-semibold text-rose-600">{summary.voided_count ?? 0} ບິນ</p>
                                </div>
                            ) : null}
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
                                                ຄິວ {row.queue_no ?? '—'} · #{row.service_id} · {row.guest_count} ຄົນ
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
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <h3 className="text-2xl font-bold tracking-tight text-[#0f2744]">ປະຫວັດການຊຳລະເງິນ</h3>
                            {canDeletePayments ? (
                                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowDeleted(false);
                                            setStatsLoading(true);
                                            router.get(route(routes.payments), buildListQuery(false), {
                                                preserveScroll: true,
                                                replace: true,
                                                onFinish: () => setStatsLoading(false),
                                            });
                                        }}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                            !showDeleted ? 'bg-white text-[#194c9f] shadow-sm' : 'text-slate-600'
                                        }`}
                                    >
                                        ບິນປົກກະຕິ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowDeleted(true);
                                            setStatsLoading(true);
                                            router.get(route(routes.payments), buildListQuery(true), {
                                                preserveScroll: true,
                                                replace: true,
                                                onFinish: () => setStatsLoading(false),
                                            });
                                        }}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                            showDeleted ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600'
                                        }`}
                                    >
                                        ບິນທີ່ຖືກຍົກເລີກ
                                    </button>
                                </div>
                            ) : null}
                        </div>
                        <div className="mt-4 flex flex-wrap items-end gap-3">
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
                                className="h-11 min-w-[6.75rem] shrink-0 rounded-xl border border-slate-200 bg-white py-2 pl-2 pr-7 text-xs font-medium leading-snug text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                            >
                                {methodOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="payments-zone-filter" className="text-xs font-bold text-slate-600">
                                    ເລືອກໂຊນ
                                </label>
                                <select
                                    id="payments-zone-filter"
                                    value={queryZone}
                                    onChange={(e) => setQueryZone(e.target.value)}
                                    aria-label="ເລືອກໂຊນ"
                                    className="h-11 min-w-[10.5rem] rounded-xl border border-slate-200 bg-white px-2 py-2 pr-7 text-xs font-medium leading-snug text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                >
                                    {zoneFilterOptions.map((opt) => (
                                        <option key={opt.value || 'all'} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="payments-date-from" className="text-xs font-bold text-slate-600">
                                    ຕັ້ງແຕ່
                                </label>
                                <input
                                    id="payments-date-from"
                                    type="date"
                                    value={queryFrom}
                                    max={queryTo || undefined}
                                    onChange={(e) => setQueryFrom(e.target.value)}
                                    className="h-11 min-w-[11rem] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="payments-date-to" className="text-xs font-bold text-slate-600">
                                    ຫາ
                                </label>
                                <input
                                    id="payments-date-to"
                                    type="date"
                                    value={queryTo}
                                    min={queryFrom || undefined}
                                    onChange={(e) => setQueryTo(e.target.value)}
                                    className="h-11 min-w-[11rem] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                />
                            </div>
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

                        <div className="mt-3">
                            <p className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-2.5 text-sm font-bold text-emerald-950 shadow-sm">
                                <span>ຍອດລວມທັງໝົດຕາມຕົວຕອງ:</span>
                                <span className="tabular-nums text-emerald-900">
                                    {formatAmount(summary?.total ?? 0)} K
                                </span>
                            </p>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-100 text-slate-700">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-bold">Payment ID</th>
                                        <th className="px-3 py-2 text-left font-bold">ລະຫັດບໍລິການ</th>
                                        {!showDeleted ? (
                                            <th className="px-3 py-2 text-left font-bold">ພະນັກງານ</th>
                                        ) : null}
                                        <th className="px-3 py-2 text-left font-bold">ໂຕະ</th>
                                        <th className="px-3 py-2 text-left font-bold">ຍອດລວມ</th>
                                        {!showDeleted ? (
                                            <th className="px-3 py-2 text-left font-bold">ວິທີຊຳລະ</th>
                                        ) : null}
                                        {showDeleted ? (
                                            <>
                                                <th className="px-3 py-2 text-left font-bold">ເຫດຜົນຍົກເລີກ</th>
                                                <th className="px-3 py-2 text-left font-bold">ຍົກເລີກໂດຍ</th>
                                                <th className="px-3 py-2 text-left font-bold">ເວລາຍົກເລີກ</th>
                                                {canDeletePayments ? (
                                                    <th className="px-3 py-2 text-left font-bold">ຈັດການ</th>
                                                ) : null}
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-3 py-2 text-left font-bold">ໝາຍເຫດ</th>
                                                <th className="px-3 py-2 text-left font-bold">ເວລາຊຳລະ</th>
                                                <th className="px-3 py-2 text-left font-bold">ຈັດການ</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {pagedPayments.map((row) => (
                                        <tr key={row.id} className={showDeleted ? 'bg-rose-50/40' : undefined}>
                                            <td className="px-3 py-2 font-semibold">{row.id}</td>
                                            <td className="px-3 py-2 font-semibold" style={{ color: primary }}>
                                                {row.service_id}
                                            </td>
                                            {!showDeleted ? <td className="px-3 py-2">{row.staff_name ?? '—'}</td> : null}
                                            <td className="px-3 py-2 font-semibold" style={{ color: primary }}>
                                                {row.table_no}
                                            </td>
                                            <td className="px-3 py-2 font-semibold">{formatAmount(row.total_amount)} K</td>
                                            {!showDeleted ? (
                                                <td className="px-3 py-2">
                                                    <StatusBadge
                                                        label={paymentMethodLabel(row.method)}
                                                        tone={paymentMethodBadgeTone(row.method)}
                                                    />
                                                </td>
                                            ) : null}
                                            {showDeleted ? (
                                                <>
                                                    <td className="max-w-[180px] px-3 py-2 text-slate-700">{row.deletion_reason ?? '—'}</td>
                                                    <td className="px-3 py-2">{row.deleted_by_name ?? '—'}</td>
                                                    <td className="px-3 py-2">{row.deleted_at ?? '—'}</td>
                                                    {canDeletePayments ? (
                                                        <td className="px-3 py-2">
                                                            <div className="flex flex-wrap gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setRestoreTarget(row)}
                                                                    disabled={voidActionBusy}
                                                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                                                                    title="ກູ້ຄືນບິນ"
                                                                >
                                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                                    ກູ້ຄືນ
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditVoided(row)}
                                                                    disabled={voidActionBusy}
                                                                    className="inline-flex items-center gap-1 rounded-lg border border-sky-300 bg-white px-2.5 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
                                                                    title="ແກ້ໄຂບິນ"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                    ແກ້ໄຂ
                                                                </button>
                                                            </div>
                                                        </td>
                                                    ) : null}
                                                </>
                                            ) : (
                                                <>
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
                                                            {canDeletePayments ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openVoidDialog(row)}
                                                                    disabled={deleteBusy}
                                                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-600 disabled:opacity-50"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                    ຍົກເລີກ
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {payments.length === 0 && (
                                        <tr>
                                            <td colSpan={showDeleted ? (canDeletePayments ? 8 : 7) : 9} className="px-3 py-8 text-center text-slate-500">
                                                {showDeleted ? 'ບໍ່ພົບບິນທີ່ຖືກຍົກເລີກ' : 'ບໍ່ພົບຂໍ້ມູນຊຳລະເງິນ'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <div className="border-t border-slate-100 px-3 pb-3">
                                <TablePagination
                                    page={historyPage}
                                    onPageChange={setHistoryPage}
                                    totalItems={payments.length}
                                    pageSize={PAGE_SIZE}
                                />
                            </div>
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
                                    {checkoutRow.customer_name} · ຄິວ {checkoutRow.queue_no ?? '—'} · ບໍລິການ #{checkoutRow.service_id}
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
                                        <span className="font-bold text-slate-600">ຄິວ:</span>{' '}
                                        <span className="font-semibold" style={{ color: primary }}>
                                            {checkoutRow.queue_no ?? '—'}
                                        </span>
                                    </p>
                                    <p>
                                        <span className="font-bold text-slate-600">Tier:</span> {checkoutRow.buffet_tier}
                                    </p>
                                </div>

                                {Array.isArray(checkoutRow.items) && checkoutRow.items.length > 0 ? (
                                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
                                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">ລາຍການ</p>
                                        <ul className="space-y-2">
                                            {checkoutRow.items.map((item, idx) => (
                                                <li key={`${item.label}-${idx}`} className="flex justify-between gap-3 text-slate-800">
                                                    <span className="min-w-0 flex-1 break-words">{item.label}</span>
                                                    <span className="shrink-0 font-semibold tabular-nums">
                                                        {formatAmount(item.amount)} K
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}

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

            <VoidPaymentDialog
                open={Boolean(voidTarget)}
                row={voidTarget}
                onClose={closeVoidDialog}
                onConfirm={submitVoidPayment}
                processing={deleteBusy}
                serverError={voidError}
            />

            <ConfirmDialog
                open={Boolean(restoreTarget)}
                onClose={() => !voidActionBusy && setRestoreTarget(null)}
                title="ກູ້ຄືນບິນທີ່ຖືກຍົກເລີກ?"
                message={
                    restoreTarget ? (
                        <div className="space-y-1">
                            <p>
                                Payment #{restoreTarget.id} · {formatAmount(restoreTarget.total_amount)} K · ໂຕະ{' '}
                                {restoreTarget.table_no ?? '—'}
                            </p>
                            <p className="text-slate-500">ບິນນີ້ຈະກັບເຂົ້າລາຍການປົກກະຕິ ແລະ ບັນທຶກການກວດສອບ.</p>
                        </div>
                    ) : (
                        ''
                    )
                }
                cancelLabel="ຍົກເລີກ"
                confirmLabel="ກູ້ຄືນ"
                onConfirm={confirmRestoreVoided}
                processing={voidActionBusy}
                primaryColor={primary}
                danger={false}
            />

            <EditVoidedPaymentDialog
                open={Boolean(editVoidTarget)}
                row={editVoidTarget}
                onClose={closeEditVoided}
                onConfirm={submitEditVoided}
                processing={voidActionBusy}
                serverError={editVoidError}
            />
        </AdminLayout>
    );
}
