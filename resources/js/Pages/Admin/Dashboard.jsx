// ແຜງຄິວ + ໂຕະ (ສະຕາດ + ໂຊນ)
import DashboardModalShell, { ModalFooterActions } from '@/Components/QueueDashboard/DashboardModalShell';
import QueueCard from '@/Components/QueueDashboard/QueueCard';
import TableCard from '@/Components/QueueDashboard/TableCard';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Clock, LayoutGrid, ListOrdered, Plus, SkipForward, UserRound, Users } from 'lucide-react';
import { formatAmount } from '@/utils/formatAmount';

const PHONE_LOOKUP_DEBOUNCE_MS = 320;

const DASHBOARD_PARTIAL = ['stats', 'zones', 'queue', 'skippedQueue', 'buffetTiers', 'availableTables'];

function formatLak(amount) {
    if (amount == null || Number.isNaN(Number(amount))) {
        return '';
    }
    return `${formatAmount(amount)} LAK`;
}

const statCards = (stats) => [
    {
        key: 'capacity',
        label: 'ບັນຈຸໄດ້ທັງໝົດ',
        value: `${stats.totalCapacity} ຄົນ`,
        icon: LayoutGrid,
        theme: 'border-slate-200 bg-white text-slate-800',
        iconBg: 'bg-slate-100 text-slate-700',
    },
    {
        key: 'available',
        label: 'ໂຕະວ່າງ',
        value: `${stats.availableTables} ພ້ອມນັ່ງ`,
        icon: CheckCircle2,
        theme: 'border-emerald-200 bg-emerald-50/60 text-emerald-900',
        iconBg: 'bg-emerald-100 text-emerald-700',
    },
    {
        key: 'occupied',
        label: 'ໂຕະທີ່ຖືກໃຊ້ງານ',
        value: String(stats.occupiedTables),
        icon: Users,
        theme: 'border-rose-200 bg-rose-50/60 text-rose-900',
        iconBg: 'bg-rose-100 text-rose-700',
    },
    {
        key: 'queue',
        label: 'ຄິວກຳລັງລໍຖ້າ',
        value: String(stats.waitingQueue),
        icon: Clock,
        theme: 'border-sky-200 bg-sky-50/60 text-sky-900',
        iconBg: 'bg-sky-100 text-sky-700',
    },
    {
        key: 'skipped',
        label: 'ຂ້າມແລ້ວ',
        value: String(stats.skippedQueue),
        icon: SkipForward,
        theme: 'border-amber-200 bg-amber-50/70 text-amber-950',
        iconBg: 'bg-amber-100 text-amber-800',
    },
];

function QueuePanel({
    queue,
    skippedQueue,
    processing,
    addFormProcessing,
    activePairBookingId,
    onAddClick,
    onSkip,
    onCancel,
    onOpenPairQueueToTable,
}) {
    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">ຄິວລໍຖ້າ</h2>
                        <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[11px] font-bold text-white">
                            {queue.length}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onAddClick}
                        disabled={addFormProcessing}
                        className="inline-flex min-h-[3rem] min-w-[9.5rem] items-center justify-center gap-2 rounded-xl bg-[#194c9f] px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-[#153d82] disabled:opacity-60"
                    >
                        <Plus className="h-5 w-5 shrink-0" />
                        {addFormProcessing ? 'ກຳລັງບັນທຶກ...' : 'ເພີ່ມຄິວ'}
                    </button>
                </div>
                {/* ກຳນົດຂະໜາດ ແລະ ການເລື່ອນເບິ່ງຄິວລໍຖ້າ — ບໍ່ໃຫ້ໜ້າຍາວລົງ; ລຽງ FIFO ຈາກ API (ເກົ່າສຸດເທິງ) */}
                {queue.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-4 text-center text-xs text-slate-500">
                        ບໍ່ມີຄິວລໍຖ້າ
                    </p>
                ) : (
                    <div className="queue-scroll-panel max-h-[min(28rem,calc(100vh-18rem))] space-y-2 overflow-y-auto overscroll-y-contain pr-1 pb-0.5">
                        {queue.map((entry) => (
                            <QueueCard
                                key={entry.id}
                                entry={entry}
                                variant="waiting"
                                processing={processing}
                                activePairBookingId={activePairBookingId}
                                onSkip={onSkip}
                                onCancel={onCancel}
                                onOpenPairQueueToTable={onOpenPairQueueToTable}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">ຂ້າມແລ້ວ</h2>
                        <p className="mt-0.5 text-[11px] text-slate-600">
                            ກັບມາຮຽກຄິວໃໝ່ໄດ້ · ຂ້າມຄົບ 2 ຄັ້ງຈະຍົກເລີກອັດຕະໂນມັດ
                        </p>
                    </div>
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
                        {skippedQueue.length}
                    </span>
                </div>
                {skippedQueue.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-amber-200/80 bg-amber-50/50 p-4 text-center text-xs text-slate-600">
                        ບໍ່ມີຄິວທີ່ຂ້າມແລ້ວ
                    </p>
                ) : (
                    <div className="queue-scroll-panel max-h-[min(22rem,calc(100vh-22rem))] space-y-2 overflow-y-auto overscroll-y-contain pr-1 pb-0.5">
                        {skippedQueue.map((entry) => (
                            <QueueCard
                                key={entry.id}
                                entry={entry}
                                variant="skipped"
                                processing={processing}
                                activePairBookingId={activePairBookingId}
                                onSkip={onSkip}
                                onCancel={onCancel}
                                onOpenPairQueueToTable={onOpenPairQueueToTable}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ຟອມຄິວ (ເພີ່ມຄິວ / ຈັບໂຕະ): ກອບກວ້າງເຕັມ + ສູງສະໝ່ຳ — font-sans = Noto Sans Lao ໃນ tailwind.config
const queueFormControlClass =
    'mt-1.5 block w-full min-h-12 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20 font-sans';
const queueFormLabelClass = 'block text-xs font-bold text-slate-700 font-sans';

function findQueueEntry(id, queue, skippedQueue) {
    return queue.find((q) => q.id === id) ?? skippedQueue.find((q) => q.id === id) ?? null;
}

function suggestedTableIdsForGroup(groupSize, tables) {
    if (!tables?.length) {
        return [];
    }
    const singleFit = tables.find((t) => Number(t.capacity) >= Number(groupSize || 0));
    if (singleFit) {
        return [String(singleFit.id)];
    }
    const sorted = [...tables].sort((a, b) => Number(b.capacity || 0) - Number(a.capacity || 0));
    const picked = [];
    let total = 0;
    for (const table of sorted) {
        picked.push(String(table.id));
        total += Number(table.capacity || 0);
        if (total >= Number(groupSize || 0)) {
            break;
        }
    }
    return picked;
}

/** ລຽງລຳດັບຄິວ: ເກົ່າສຸດຢູ່ເທິງ, ໃໝ່ສຸດຢູ່ລຸ່ມ (FIFO / queued_at), ກົງກັບແຜງ */
function sortQueueEntriesByJoinedAt(entries) {
    return [...entries].sort((a, b) => {
        const ta = a.queued_at ? Date.parse(a.queued_at) : Number.POSITIVE_INFINITY;
        const tb = b.queued_at ? Date.parse(b.queued_at) : Number.POSITIVE_INFINITY;
        if (ta !== tb) {
            return ta - tb;
        }
        return (Number(a.id) || 0) - (Number(b.id) || 0);
    });
}

// ຄ່າເລີ່ມຟອມເພີ່ມຄິວ — tier_id ກົງກັບແພັກປັດຈຸບັນ
function emptyAddQueueForm(buffetTiers) {
    return {
        customer_name: '',
        phone: '',
        guest_count: '',
        tier_id: buffetTiers[0]?.id ?? '',
    };
}

export default function AdminDashboard({ stats, zones, queue, skippedQueue, buffetTiers, availableTables }) {
    const { errors: pageErrors } = usePage().props;
    const [processing, setProcessing] = useState(null);
    const [queueDrawerOpen, setQueueDrawerOpen] = useState(false);

    const [showAddQueue, setShowAddQueue] = useState(false);
    const [pairQueueToTable, setPairQueueToTable] = useState(null);
    const [pairQueueSelectedTableIds, setPairQueueSelectedTableIds] = useState([]);
    const [pairTableToQueue, setPairTableToQueue] = useState(null);
    const [pairTableSelectedBookingId, setPairTableSelectedBookingId] = useState('');
    const [occupiedDetail, setOccupiedDetail] = useState(null);

    const addForm = useForm({
        customer_name: '',
        phone: '',
        guest_count: '',
        tier_id: buffetTiers[0]?.id ?? '',
    });

    const addFormDataRef = useRef(addForm.data);
    addFormDataRef.current = addForm.data;

    const [returningCustomerMatch, setReturningCustomerMatch] = useState(false);
    const [phoneLookupLoading, setPhoneLookupLoading] = useState(false);
    const nameFromPhoneLookupRef = useRef(false);
    const phoneLookupDebounceRef = useRef(null);
    const phoneLookupAbortRef = useRef(null);
    const phoneLookupGenRef = useRef(0);

    // ຄິວລໍຖ້າກ່ອນ ຕາມ queued_at, ຕໍ່ດ້ວຍຄິວຂ້າມແລ້ວ — ກົງກັບແຜງ + dropdown ຈັບໂຕະ
    const assignableQueue = useMemo(
        () => [...sortQueueEntriesByJoinedAt(queue), ...sortQueueEntriesByJoinedAt(skippedQueue)],
        [queue, skippedQueue]
    );

    useEffect(() => {
        if (!pairQueueToTable) {
            return;
        }
        const stillHere =
            queue.some((q) => q.id === pairQueueToTable.bookingId) ||
            skippedQueue.some((q) => q.id === pairQueueToTable.bookingId);
        if (!stillHere) {
            setPairQueueToTable(null);
        }
    }, [queue, skippedQueue, pairQueueToTable]);

    const cancelPhoneLookupDebounce = useCallback(() => {
        if (phoneLookupDebounceRef.current !== null) {
            clearTimeout(phoneLookupDebounceRef.current);
            phoneLookupDebounceRef.current = null;
        }
    }, []);

    const resetPhoneLookupState = useCallback(() => {
        phoneLookupGenRef.current += 1;
        cancelPhoneLookupDebounce();
        phoneLookupAbortRef.current?.abort();
        phoneLookupAbortRef.current = null;
        setPhoneLookupLoading(false);
        setReturningCustomerMatch(false);
        nameFromPhoneLookupRef.current = false;
    }, [cancelPhoneLookupDebounce]);

    const runPhoneCustomerLookup = useCallback(
        (digits) => {
            phoneLookupAbortRef.current?.abort();
            const controller = new AbortController();
            phoneLookupAbortRef.current = controller;
            const gen = ++phoneLookupGenRef.current;
            setPhoneLookupLoading(true);

            axios
                .get(route('queue-dashboard.bookings.lookup-customer-by-phone'), {
                    params: { phone: digits },
                    signal: controller.signal,
                })
                .then(({ data }) => {
                    if (gen !== phoneLookupGenRef.current) {
                        return;
                    }
                    const name = typeof data?.name === 'string' ? data.name.trim() : '';
                    const matched = Boolean(data?.matched && name !== '');

                    if (matched) {
                        const current = (addFormDataRef.current.customer_name ?? '').trim();
                        if (current === '' || nameFromPhoneLookupRef.current) {
                            addForm.setData('customer_name', name);
                            nameFromPhoneLookupRef.current = true;
                        }
                        setReturningCustomerMatch(true);
                    } else {
                        if (nameFromPhoneLookupRef.current) {
                            addForm.setData('customer_name', '');
                        }
                        nameFromPhoneLookupRef.current = false;
                        setReturningCustomerMatch(false);
                    }
                })
                .catch((err) => {
                    if (gen !== phoneLookupGenRef.current || err?.code === 'ERR_CANCELED') {
                        return;
                    }
                    setReturningCustomerMatch(false);
                })
                .finally(() => {
                    if (gen !== phoneLookupGenRef.current) {
                        return;
                    }
                    setPhoneLookupLoading(false);
                });
        },
        [addForm]
    );

    const schedulePhoneCustomerLookup = useCallback(
        (digits) => {
            cancelPhoneLookupDebounce();
            if (digits.length < 8) {
                phoneLookupGenRef.current += 1;
                phoneLookupAbortRef.current?.abort();
                phoneLookupAbortRef.current = null;
                setPhoneLookupLoading(false);
                setReturningCustomerMatch(false);
                nameFromPhoneLookupRef.current = false;
                return;
            }
            phoneLookupDebounceRef.current = window.setTimeout(() => {
                phoneLookupDebounceRef.current = null;
                runPhoneCustomerLookup(digits);
            }, PHONE_LOOKUP_DEBOUNCE_MS);
        },
        [cancelPhoneLookupDebounce, runPhoneCustomerLookup]
    );

    const flushPhoneCustomerLookup = useCallback(() => {
        cancelPhoneLookupDebounce();
        const digits = String(addFormDataRef.current.phone ?? '').replace(/\D/g, '');
        if (digits.length >= 8 && digits.length <= 15) {
            runPhoneCustomerLookup(digits);
        }
    }, [cancelPhoneLookupDebounce, runPhoneCustomerLookup]);

    useEffect(() => {
        if (!showAddQueue) {
            resetPhoneLookupState();
        }
    }, [showAddQueue, resetPhoneLookupState]);

    const inertiaOpts = {
        preserveScroll: true,
        only: DASHBOARD_PARTIAL,
        onStart: () => {},
        onFinish: () => setProcessing(null),
    };

    const run = (key, call) => {
        setProcessing(key);
        call();
    };

    const closeAllModals = () => {
        setShowAddQueue(false);
        setPairQueueToTable(null);
        setPairTableToQueue(null);
        setOccupiedDetail(null);
    };

    const openAddQueue = () => {
        closeAllModals();
        setQueueDrawerOpen(false);
        resetPhoneLookupState();
        const empty = emptyAddQueueForm(buffetTiers);
        addForm.setDefaults(empty);
        addForm.setData(empty);
        addForm.clearErrors();
        setShowAddQueue(true);
    };

    const openPairQueueToTable = (bookingId) => {
        closeAllModals();
        setQueueDrawerOpen(false);
        setPairQueueToTable({ bookingId });
        const entry = findQueueEntry(bookingId, queue, skippedQueue);
        const groupSize = entry?.group_size ?? 0;
        setPairQueueSelectedTableIds(suggestedTableIdsForGroup(groupSize, availableTables));
    };

    const openPairTableToQueue = (table) => {
        closeAllModals();
        setPairTableToQueue({
            id: table.id,
            table_no: table.table_no,
            capacity: table.capacity,
        });
        const firstFit = assignableQueue.find((q) => q.group_size <= table.capacity);
        const pick = firstFit ?? assignableQueue[0];
        setPairTableSelectedBookingId(pick ? String(pick.id) : '');
    };

    const handleTableClick = (t) => {
        if (t.status === 'maintenance') {
            return;
        }
        if (t.status === 'available') {
            openPairTableToQueue(t);
            return;
        }
        if (t.status === 'occupied' && t.occupied_detail) {
            closeAllModals();
            setOccupiedDetail({
                table_no: t.table_no,
                capacity: t.capacity,
                ...t.occupied_detail,
            });
        }
    };

    const formatLocalDateTime = (value) => {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '—';
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date);
    };

    const submitAddQueue = (e) => {
        e.preventDefault();
        addForm.post(route('queue-dashboard.queues.store'), {
            ...inertiaOpts,
            onSuccess: () => {
                setShowAddQueue(false);
                resetPhoneLookupState();
                const empty = emptyAddQueueForm(buffetTiers);
                // Inertia updates form defaults to submitted values on success; setDefaults
                // first so that does not run, then clear fields for the next add.
                addForm.setDefaults(empty);
                addForm.setData(empty);
            },
        });
    };

    const skip = (id) => {
        run(`skip-${id}`, () =>
            router.post(route('queue-dashboard.queues.skip', { booking: id }), {}, inertiaOpts)
        );
    };

    const cancel = (id) => {
        run(`cancel-${id}`, () =>
            router.post(route('queue-dashboard.queues.cancel', { booking: id }), {}, inertiaOpts)
        );
    };

    const submitPairQueueToTable = () => {
        if (!pairQueueToTable || pairQueueSelectedTableIds.length === 0) return;
        run('pair-queue', () =>
            router.post(
                route('queue-dashboard.assignments.store'),
                {
                    booking_id: pairQueueToTable.bookingId,
                    table_ids: pairQueueSelectedTableIds.map((id) => Number(id)),
                },
                {
                    ...inertiaOpts,
                    onSuccess: () => setPairQueueToTable(null),
                }
            )
        );
    };

    const submitPairTableToQueue = () => {
        if (!pairTableToQueue || !pairTableSelectedBookingId) return;
        run('pair-table', () =>
            router.post(
                route('queue-dashboard.assignments.store'),
                {
                    booking_id: Number(pairTableSelectedBookingId),
                    table_id: pairTableToQueue.id,
                },
                {
                    ...inertiaOpts,
                    onSuccess: () => setPairTableToQueue(null),
                }
            )
        );
    };

    const cards = statCards(stats);
    const pairQueueEntry = pairQueueToTable
        ? findQueueEntry(pairQueueToTable.bookingId, queue, skippedQueue)
        : null;
    const pairSelectedTables = availableTables.filter((t) => pairQueueSelectedTableIds.includes(String(t.id)));
    const pairSelectedCapacity = pairSelectedTables.reduce((sum, t) => sum + Number(t.capacity || 0), 0);
    const pairQueueCapacityOk = pairQueueEntry && pairSelectedCapacity >= Number(pairQueueEntry.group_size || 0);

    const pairTableBookingEntry = assignableQueue.find((q) => String(q.id) === pairTableSelectedBookingId);
    const pairTableCapacityOk =
        pairTableBookingEntry &&
        pairTableToQueue &&
        pairTableBookingEntry.group_size <= pairTableToQueue.capacity;

    return (
        <AdminLayout>
            <Head title="Dashboard" />

            <div className="font-lao text-slate-900">
                {(pageErrors?.booking || pageErrors?.table_id) && (
                    <div
                        role="alert"
                        className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
                    >
                        {pageErrors.booking && <p>{pageErrors.booking}</p>}
                        {pageErrors.table_id && <p>{pageErrors.table_id}</p>}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {cards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <div
                                key={card.key}
                                className={`flex items-center gap-4 rounded-2xl border p-5 shadow-sm ${card.theme}`}
                            >
                                <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
                                >
                                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium leading-snug text-slate-600">
                                        {card.label}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold tracking-tight">{card.value}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 flex flex-col gap-8 xl:flex-row xl:items-start">
                    <section className="min-w-0 flex-1">
                        <div className="min-h-[min(480px,70vh)] rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-100 via-white to-sky-50/40 p-5 shadow-md ring-1 ring-slate-200/50 md:min-h-[560px] md:p-10">
                            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                                        ຜັງໂຕະ
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-600">
                                        ກົດໂຕະວ່າງເພື່ອຈັບໂຕະໃສ່ຄິວ · ປ່ຽນສະຖານະໂຕະຈະມີໃນໜ້າອື່ນ
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-10">
                                {zones.map((zone) => (
                                    <div key={zone.id}>
                                        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                                            <span className="h-2 w-2 rounded-full bg-[#194c9f]" />
                                            {zone.title}
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                                            {zone.tables.map((t) => (
                                                <TableCard
                                                    key={t.id}
                                                    table={t}
                                                    onClick={handleTableClick}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <aside className="hidden w-full shrink-0 xl:block xl:w-[420px]">
                        <QueuePanel
                            queue={queue}
                            skippedQueue={skippedQueue}
                            processing={processing}
                            addFormProcessing={addForm.processing}
                            activePairBookingId={pairQueueToTable?.bookingId ?? null}
                            onAddClick={openAddQueue}
                            onSkip={skip}
                            onCancel={cancel}
                            onOpenPairQueueToTable={openPairQueueToTable}
                        />
                    </aside>
                </div>

                <button
                    type="button"
                    onClick={() => setQueueDrawerOpen(true)}
                    className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-[#194c9f] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#153d82] xl:hidden"
                >
                    <ListOrdered className="h-5 w-5" />
                    ຄິວ
                </button>

                <div
                    className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity xl:hidden ${queueDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                    onClick={() => setQueueDrawerOpen(false)}
                    aria-hidden
                />

                <div
                    className={`fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-4 shadow-2xl transition-transform duration-300 ease-out xl:hidden ${queueDrawerOpen ? 'translate-y-0' : 'translate-y-full'}`}
                >
                    <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
                    <QueuePanel
                        queue={queue}
                        skippedQueue={skippedQueue}
                        processing={processing}
                        addFormProcessing={addForm.processing}
                        activePairBookingId={pairQueueToTable?.bookingId ?? null}
                        onAddClick={openAddQueue}
                        onSkip={skip}
                        onCancel={cancel}
                        onOpenPairQueueToTable={(id) => {
                            openPairQueueToTable(id);
                            setQueueDrawerOpen(false);
                        }}
                    />
                </div>
            </div>

            {showAddQueue && (
                <DashboardModalShell
                    title="ແບບຟອມເພີ່ມຄິວລູກຄ້າ"
                    icon={UserRound}
                    onClose={() => setShowAddQueue(false)}
                    footer={
                        <ModalFooterActions
                            submitFormId="add-queue-form"
                            onCancel={() => setShowAddQueue(false)}
                            cancelLabel="ຍົກເລີກ"
                            primaryLabel="ເພີ່ມຄິວ"
                            primaryDisabled={addForm.processing}
                            primaryLoading={addForm.processing}
                            primaryLoadingLabel="ກຳລັງບັນທຶກ..."
                        />
                    }
                >
                    <form id="add-queue-form" onSubmit={submitAddQueue} className="space-y-4 font-sans">
                        <div className="space-y-4">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <label className={queueFormLabelClass}>ຊື່ລູກຄ້າ</label>
                                    {returningCustomerMatch && (
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200">
                                            Returning customer
                                        </span>
                                    )}
                                </div>
                                <input
                                    className={queueFormControlClass}
                                    value={addForm.data.customer_name}
                                    onChange={(e) => {
                                        nameFromPhoneLookupRef.current = false;
                                        addForm.setData('customer_name', e.target.value);
                                    }}
                                />
                                {addForm.errors.customer_name && (
                                    <p className="mt-1 text-xs text-rose-600">{addForm.errors.customer_name}</p>
                                )}
                            </div>
                            <div>
                                <label className={queueFormLabelClass}>ຈຳນວນຄົນ</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    className={queueFormControlClass}
                                    value={addForm.data.guest_count}
                                    onChange={(e) => addForm.setData('guest_count', e.target.value)}
                                />
                                {addForm.errors.guest_count && (
                                    <p className="mt-1 text-xs text-rose-600">{addForm.errors.guest_count}</p>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center justify-between gap-2">
                                    <label className={queueFormLabelClass}>ເບີໂທລະສັບ</label>
                                    {phoneLookupLoading && (
                                        <span className="text-[10px] font-medium text-slate-400">ກຳລັງຊອກ...</span>
                                    )}
                                </div>
                                <input
                                    className={queueFormControlClass}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="tel"
                                    placeholder="02012345678"
                                    value={addForm.data.phone}
                                    onChange={(e) => {
                                        const digits = e.target.value.replace(/\D/g, '').slice(0, 15);
                                        addForm.setData('phone', digits);
                                        schedulePhoneCustomerLookup(digits);
                                    }}
                                    onBlur={() => flushPhoneCustomerLookup()}
                                />
                                {addForm.errors.phone && (
                                    <p className="mt-1 text-xs text-rose-600">{addForm.errors.phone}</p>
                                )}
                            </div>
                            <div>
                                <label className={queueFormLabelClass}>ປະເພດບຸບເຟ້</label>
                                <select
                                    className={queueFormControlClass}
                                    value={addForm.data.tier_id}
                                    onChange={(e) => addForm.setData('tier_id', e.target.value)}
                                >
                                    {buffetTiers.map((tier) => (
                                        <option key={tier.id} value={tier.id}>
                                            {tier.tier_name} — {formatLak(tier.price)}
                                        </option>
                                    ))}
                                </select>
                                {addForm.errors.tier_id && (
                                    <p className="mt-1 text-xs text-rose-600">{addForm.errors.tier_id}</p>
                                )}
                            </div>
                        </div>
                    </form>
                </DashboardModalShell>
            )}

            {pairQueueToTable && pairQueueEntry ? (
                <DashboardModalShell
                    title="ຈັບຄິວໃສ່ໂຕະ"
                    icon={Users}
                    onClose={() => setPairQueueToTable(null)}
                    footer={
                        <ModalFooterActions
                            onCancel={() => setPairQueueToTable(null)}
                            cancelLabel="ຍົກເລີກ"
                            onPrimary={submitPairQueueToTable}
                            primaryLabel="ຢືນຢັນ"
                            primaryDisabled={
                                pairQueueSelectedTableIds.length === 0 ||
                                availableTables.length === 0 ||
                                processing === 'pair-queue' ||
                                !pairQueueCapacityOk
                            }
                            primaryLoading={processing === 'pair-queue'}
                            primaryLoadingLabel="ກຳລັງຢືນຢັນ..."
                        />
                    }
                >
                    <div className="space-y-5">
                        <div>
                            <label className={queueFormLabelClass}>ເລືອກຄິວທີ່ລໍຖ້າ</label>
                            <div className="mt-1.5 flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 font-sans">
                                <Users className="h-4 w-4 shrink-0 text-slate-500" />
                                <span className="font-semibold">{pairQueueEntry.customer_name}</span>
                                <span className="text-slate-600">· {pairQueueEntry.group_size} ຄົນ</span>
                            </div>
                        </div>
                        <div>
                            <label className={queueFormLabelClass}>ເລືອກໂຕະວ່າງ (ເລືອກໄດ້ຫຼາຍໂຕະ)</label>
                            {availableTables.length === 0 ? (
                                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                    ບໍ່ມີໂຕະວ່າງໃນຕອນນີ້
                                </p>
                            ) : (
                                <div className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
                                    {availableTables.map((t) => {
                                        const checked = pairQueueSelectedTableIds.includes(String(t.id));
                                        return (
                                            <label
                                                key={t.id}
                                                className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                                                    checked
                                                        ? 'border-[#194c9f] bg-[#194c9f]/10 text-[#194c9f]'
                                                        : 'border-slate-200 bg-white text-slate-700 hover:border-[#194c9f]/30'
                                                }`}
                                            >
                                                <span className="font-semibold">ໂຕະ {t.table_no}</span>
                                                <span className="text-xs">{t.capacity} ບ່ອນນັ່ງ</span>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 accent-[#194c9f]"
                                                    checked={checked}
                                                    onChange={() => {
                                                        const id = String(t.id);
                                                        setPairQueueSelectedTableIds((prev) =>
                                                            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                                                        );
                                                    }}
                                                />
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                            {pairQueueEntry ? (
                                <p className="mt-2 text-xs text-slate-600">
                                    ຄວາມຈຸລວມ: <span className="font-bold text-slate-900">{pairSelectedCapacity}</span> /{' '}
                                    ຕ້ອງການ <span className="font-bold text-slate-900">{pairQueueEntry.group_size}</span> ຄົນ
                                </p>
                            ) : null}
                            {pairQueueEntry && !pairQueueCapacityOk ? (
                                <p className="mt-2 text-sm font-semibold text-rose-700" role="alert">
                                    ຄວາມຈຸໂຕະລວມຍັງບໍ່ພໍ
                                </p>
                            ) : null}
                        </div>
                    </div>
                </DashboardModalShell>
            ) : null}

            {pairTableToQueue && (
                <DashboardModalShell
                    title="ຈັບໂຕະໃສ່ຄິວ"
                    icon={LayoutGrid}
                    onClose={() => setPairTableToQueue(null)}
                    footer={
                        <ModalFooterActions
                            onCancel={() => setPairTableToQueue(null)}
                            cancelLabel="ຍົກເລີກ"
                            onPrimary={submitPairTableToQueue}
                            primaryLabel="ຢືນຢັນ"
                            primaryDisabled={
                                !pairTableSelectedBookingId ||
                                assignableQueue.length === 0 ||
                                processing === 'pair-table' ||
                                !pairTableCapacityOk
                            }
                            primaryLoading={processing === 'pair-table'}
                            primaryLoadingLabel="ກຳລັງຢືນຢັນ..."
                        />
                    }
                >
                    <div className="space-y-5">
                        <div>
                            <label className={queueFormLabelClass}>ເລືອກໂຕະວ່າງ</label>
                            <div className="mt-1.5 flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 font-sans">
                                <Users className="h-4 w-4 shrink-0 text-slate-500" />
                                <span className="font-semibold">ໂຕະ {pairTableToQueue.table_no}</span>
                                <span className="text-slate-600">· {pairTableToQueue.capacity} ບ່ອນນັ່ງ</span>
                            </div>
                        </div>
                        <div>
                            <label className={queueFormLabelClass}>ເລືອກຄິວທີ່ລໍຖ້າ</label>
                            {assignableQueue.length === 0 ? (
                                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                    ບໍ່ມີຄິວລໍຖ້າ
                                </p>
                            ) : (
                                <select
                                    className={queueFormControlClass}
                                    value={pairTableSelectedBookingId}
                                    onChange={(e) => setPairTableSelectedBookingId(e.target.value)}
                                >
                                    {assignableQueue.map((q) => (
                                        <option key={q.id} value={String(q.id)}>
                                            {q.queue_no} · {q.customer_name} · {q.group_size} ຄົນ
                                        </option>
                                    ))}
                                </select>
                            )}
                            {pairTableBookingEntry && pairTableToQueue && !pairTableCapacityOk ? (
                                <p className="mt-2 text-sm font-semibold text-rose-700" role="alert">
                                    ໂຕະນີ້ບັນຈຸບໍ່ພໍ
                                </p>
                            ) : null}
                        </div>
                    </div>
                </DashboardModalShell>
            )}

            {occupiedDetail && (
                <DashboardModalShell
                    title="ລາຍລະອຽດໂຕະທີ່ກຳລັງໃຊ້ງານ"
                    icon={Users}
                    onClose={() => setOccupiedDetail(null)}
                    footer={null}
                >
                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
                        <p><span className="font-bold">ໂຕະ:</span> <span className="text-[#194c9f] font-semibold">{occupiedDetail.table_no}</span></p>
                        <p><span className="font-bold">ຈຳນວນບ່ອນນັ່ງ:</span> {occupiedDetail.capacity}</p>
                        <p><span className="font-bold">ລະຫັດຄິວ:</span> {occupiedDetail.queue_no ?? '—'}</p>
                        <p><span className="font-bold">ລູກຄ້າ:</span> {occupiedDetail.customer_name ?? '—'}</p>
                        <p><span className="font-bold">ເບີໂທ:</span> {occupiedDetail.phone ?? '—'}</p>
                        <p><span className="font-bold">ຈຳນວນຄົນ:</span> {occupiedDetail.guest_count ?? '—'}</p>
                        <p><span className="font-bold">ປະເພດບຸບເຟ້:</span> {occupiedDetail.buffet_tier ?? '—'}</p>
                        <p><span className="font-bold">Service:</span> {occupiedDetail.service_code ?? '—'}</p>
                        <p><span className="font-bold">ເວລາເຂົ້າໃຊ້:</span> {formatLocalDateTime(occupiedDetail.check_in_at)}</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setOccupiedDetail(null)}
                            className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            ປິດ
                        </button>
                    </div>
                </DashboardModalShell>
            )}
        </AdminLayout>
    );
}
