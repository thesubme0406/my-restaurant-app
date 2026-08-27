// ແຜງຄິວ + ໂຕະ (ສະຕາດ + ໂຊນ)
import DashboardModalShell, { ModalFooterActions } from '@/Components/QueueDashboard/DashboardModalShell';
import QueuePanel from '@/Components/QueueDashboard/QueuePanel';
import TableCard from '@/Components/QueueDashboard/TableCard';
import AdminLayout from '@/Layouts/AdminLayout';
import { usePhoneCustomerLookup } from '@/hooks/usePhoneCustomerLookup';
import { useQueueDashboardPrint } from '@/hooks/useQueueDashboardPrint';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, ListOrdered, UserRound, Users } from 'lucide-react';
import {
    buildDashboardStatCards,
    DASHBOARD_PARTIAL,
    emptyAddQueueForm,
    findQueueEntry,
    formatLak,
    formatLocalDateTime,
    sortQueueEntriesByJoinedAt,
    suggestedTableIdsForGroup,
} from '@/utils/queueDashboardUtils';
import { digitsOnly, PHONE_PLACEHOLDER } from '@/utils/phoneFormat';

export default function AdminDashboard({ stats, zones, queue, skippedQueue, buffetTiers, availableTables }) {
    const { errors: pageErrors, flash } = usePage().props;
    const { handlePrintFlash } = useQueueDashboardPrint();

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
        is_vip: false,
    });


    const {
        returningCustomerMatch,
        phoneLookupLoading,
        nameFromPhoneLookupRef,
        resetPhoneLookupState,
        schedulePhoneCustomerLookup,
        flushPhoneCustomerLookup,
    } = usePhoneCustomerLookup({ enabled: showAddQueue, addForm });

    const assignableQueue = useMemo(
        () => [...sortQueueEntriesByJoinedAt(queue), ...sortQueueEntriesByJoinedAt(skippedQueue)],
        [queue, skippedQueue]
    );

    const pairTableAssignableQueue = useMemo(() => {
        if (!pairTableToQueue) {
            return [];
        }
        const tableIsVip = Boolean(pairTableToQueue.is_vip_zone);
        return assignableQueue.filter((q) => Boolean(q.is_vip) === tableIsVip);
    }, [assignableQueue, pairTableToQueue]);

    useEffect(() => {
        if (!pairTableToQueue) {
            return;
        }
        const firstFit = pairTableAssignableQueue.find((q) => q.group_size <= pairTableToQueue.capacity);
        const pick = firstFit ?? pairTableAssignableQueue[0];
        setPairTableSelectedBookingId(pick ? String(pick.id) : '');
    }, [pairTableToQueue, pairTableAssignableQueue]);

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

    const inertiaOpts = {
        preserveScroll: true,
        only: DASHBOARD_PARTIAL,
        onStart: () => {},
        onFinish: () => setProcessing(null),
        onFlash: handlePrintFlash,
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
        const needVip = Boolean(entry?.is_vip);
        const filtered = availableTables.filter((t) => Boolean(t.is_vip_zone) === needVip);
        setPairQueueSelectedTableIds(suggestedTableIdsForGroup(groupSize, filtered));
    };

    const openPairTableToQueue = (table) => {
        closeAllModals();
        setPairTableToQueue({
            id: table.id,
            table_no: table.table_no,
            capacity: table.capacity,
            is_vip_zone: Boolean(table.is_vip_zone),
        });
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

    const submitAddQueue = (e) => {
        e.preventDefault();
        addForm.post(route('queue-dashboard.queues.store'), {
            ...inertiaOpts,
            onSuccess: (page) => {
                setShowAddQueue(false);
                resetPhoneLookupState();
                const empty = emptyAddQueueForm(buffetTiers);
                // ຫຼັງບັນທຶກສຳເລັດ Inertia ຈະດຶງຄ່າຟອມເປັນຄ່າເລີ່ມ — setDefaults ກ່ອນແລ້ວ reset ຟອມເພື່ອເພີ່ມຄິວຄັ້ງໃໝ່.
                addForm.setDefaults(empty);
                addForm.setData(empty);
                handlePrintFlash(page);
            },
        });
    };

    const skip = (id) => {
        run(`skip-${id}`, () =>
            router.post(route('queue-dashboard.queues.skip', { booking: id }), {}, inertiaOpts)
        );
    };

    const callQueue = (id) => {
        run(`call-${id}`, () =>
            router.post(route('queue-dashboard.queues.call', { booking: id }), {}, inertiaOpts)
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
                    onSuccess: (page) => {
                        setPairQueueToTable(null);
                        handlePrintFlash(page);
                    },
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
                    onSuccess: (page) => {
                        setPairTableToQueue(null);
                        handlePrintFlash(page);
                    },
                }
            )
        );
    };

    const cards = buildDashboardStatCards(stats);
    const pairQueueEntry = pairQueueToTable
        ? findQueueEntry(pairQueueToTable.bookingId, queue, skippedQueue)
        : null;
    const tablesForPairQueue = useMemo(() => {
        if (!pairQueueEntry) {
            return availableTables;
        }
        const needVip = Boolean(pairQueueEntry.is_vip);
        return availableTables.filter((t) => Boolean(t.is_vip_zone) === needVip);
    }, [availableTables, pairQueueEntry]);
    const pairSelectedTables = tablesForPairQueue.filter((t) => pairQueueSelectedTableIds.includes(String(t.id)));
    const pairSelectedCapacity = pairSelectedTables.reduce((sum, t) => sum + Number(t.capacity || 0), 0);
    const pairQueueCapacityOk = pairQueueEntry && pairSelectedCapacity >= Number(pairQueueEntry.group_size || 0);

    const pairTableBookingEntry = pairTableAssignableQueue.find((q) => String(q.id) === pairTableSelectedBookingId);
    const pairTableCapacityOk =
        pairTableBookingEntry &&
        pairTableToQueue &&
        pairTableBookingEntry.group_size <= pairTableToQueue.capacity;

    return (
        <AdminLayout>
            <Head title="Dashboard" />

            <div className="font-lao text-slate-900">
                {flash?.success && (
                    <div
                        role="status"
                        className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
                    >
                        {flash.success}
                    </div>
                )}
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
                                        ກົດໂຕະວ່າງເພື່ອຈັບຄິວໃສ່ໂຕະ · ປ່ຽນສະຖານະໂຕະຈະມີໃນໜ້າອື່ນ
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-10">
                                {zones.map((zone) => (
                                    <div
                                        key={zone.id}
                                        className={
                                            zone.id === 'vip'
                                                ? 'rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-50/40 to-transparent p-4 shadow-[0_0_0_1px_rgba(251,191,36,0.15)] md:p-6'
                                                : ''
                                        }
                                    >
                                        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                                            <span
                                                className={`h-2 w-2 rounded-full ${zone.id === 'vip' ? 'bg-amber-500' : 'bg-[#194c9f]'}`}
                                            />
                                            {zone.id === 'vip' ? <span className="inline-flex items-center gap-1">👑 {zone.title}</span> : zone.title}
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
                            onCall={callQueue}
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
                        onCall={callQueue}
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
                                    <label className="queue-form-label">ຊື່ລູກຄ້າ</label>
                                    {returningCustomerMatch && (
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200">
                                            Returning customer
                                        </span>
                                    )}
                                </div>
                                <input
                                    className="queue-form-control"
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
                                <label className="queue-form-label">ຈຳນວນຄົນ</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    className="queue-form-control"
                                    value={addForm.data.guest_count}
                                    onChange={(e) => addForm.setData('guest_count', e.target.value)}
                                />
                                {addForm.errors.guest_count && (
                                    <p className="mt-1 text-xs text-rose-600">{addForm.errors.guest_count}</p>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center justify-between gap-2">
                                    <label className="queue-form-label">ເບີໂທລະສັບ</label>
                                    {phoneLookupLoading && (
                                        <span className="text-[10px] font-medium text-slate-400">ກຳລັງຊອກ...</span>
                                    )}
                                </div>
                                <input
                                    className="queue-form-control"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="tel"
                                    placeholder={PHONE_PLACEHOLDER}
                                    value={addForm.data.phone}
                                    onChange={(e) => {
                                        const digits = digitsOnly(e.target.value);
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
                                <label className="queue-form-label">ປະເພດບຸບເຟ້</label>
                                <select
                                    className="queue-form-control"
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
                            <div className="rounded-xl border border-slate-200 bg-amber-50/50 p-3">
                                <label className="flex cursor-pointer items-start gap-3 font-sans">
                                    <input
                                        type="checkbox"
                                        className="mt-1 h-4 w-4 shrink-0 accent-amber-600"
                                        checked={Boolean(addForm.data.is_vip)}
                                        onChange={(e) => addForm.setData('is_vip', e.target.checked)}
                                    />
                                    <span>
                                        <span className="block text-sm font-bold text-slate-900">ຄິວ VIP (ຫ້ອງ VIP)</span>
                                        <span className="mt-0.5 block text-xs text-slate-600">
                                            ເລກຄິວຈະເປັນຊຸດ V — ຈັບໂຕະໂຊນ VIP ເທົ່ານັ້ນ.
                                        </span>
                                    </span>
                                </label>
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
                                tablesForPairQueue.length === 0 ||
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
                            <label className="queue-form-label">ເລືອກຄິວທີ່ລໍຖ້າ</label>
                            <div className="mt-1.5 flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 font-sans">
                                <Users className="h-4 w-4 shrink-0 text-slate-500" />
                                <span className="font-semibold">{pairQueueEntry.customer_name}</span>
                                <span className="text-slate-600">· {pairQueueEntry.group_size} ຄົນ</span>
                            </div>
                        </div>
                        <div>
                            <label className="queue-form-label">ເລືອກໂຕະວ່າງ (ເລືອກໄດ້ຫຼາຍໂຕະ)</label>
                            {tablesForPairQueue.length === 0 ? (
                                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                    ບໍ່ມີໂຕະວ່າງໃນຕອນນີ້
                                    {pairQueueEntry?.is_vip ? ' (ໂຊນ VIP)' : ''}
                                </p>
                            ) : (
                                <div className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
                                    {tablesForPairQueue.map((t) => {
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
                    title="ຈັບຄິວໃສ່ໂຕະ"
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
                                pairTableAssignableQueue.length === 0 ||
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
                            <label className="queue-form-label">ເລືອກໂຕະວ່າງ</label>
                            <div className="mt-1.5 flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 font-sans">
                                <Users className="h-4 w-4 shrink-0 text-slate-500" />
                                <span className="font-semibold">ໂຕະ {pairTableToQueue.table_no}</span>
                                <span className="text-slate-600">· {pairTableToQueue.capacity} ບ່ອນນັ່ງ</span>
                            </div>
                        </div>
                        <div>
                            <label className="queue-form-label">ເລືອກຄິວທີ່ລໍຖ້າ</label>
                            {pairTableAssignableQueue.length === 0 ? (
                                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                    ບໍ່ມີຄິວລໍຖ້າ
                                    {pairTableToQueue?.is_vip_zone ? ' ສຳລັບໂຊນ VIP' : ''}
                                </p>
                            ) : (
                                <select
                                    className="queue-form-control"
                                    value={pairTableSelectedBookingId}
                                    onChange={(e) => setPairTableSelectedBookingId(e.target.value)}
                                >
                                    {pairTableAssignableQueue.map((q) => (
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
                        <p>
                            <span className="font-bold">ລະຫັດບໍລິການ:</span>{' '}
                            {occupiedDetail.service_id != null && occupiedDetail.service_id !== ''
                                ? String(occupiedDetail.service_id).padStart(2, '0')
                                : '—'}
                        </p>
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
