import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock3,
    Minus,
    Phone,
    Plus,
    SquareMenu,
    Ticket,
    User,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { digitsOnly, isValidPhone, PHONE_PLACEHOLDER, PHONE_VALIDATION_MESSAGE } from '@/utils/phoneFormat';
import QueueMonitorSection, { formatQueueNoDisplay } from './Reserve/QueueMonitorSection';

function statusBadge(status) {
    if (status === 'cancelled') {
        return 'ຍົກເລີກແລ້ວ';
    }
    if (status === 'completed' || status === 'finished') {
        return 'ສຳເລັດແລ້ວ';
    }
    if (status === 'confirmed') {
        return 'ຢືນຢັນແລ້ວ';
    }
    if (status === 'pending' || status === 'waiting') {
        return 'ກຳລັງລໍຄິວ';
    }
    if (status === 'calling') {
        return 'ຖືກເອີ້ນແລ້ວ';
    }
    return 'ກຳລັງດຳເນີນການ';
}


function QueueDetailStatusPill({ status }) {
    if (status === 'cancelled') {
        return (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                <X className="h-3.5 w-3.5" />
                ຍົກເລີກແລ້ວ
            </span>
        );
    }
    if (status === 'confirmed') {
        return (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-[#194c9f]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                ຢືນຢັນແລ້ວ
            </span>
        );
    }
    if (status === 'completed' || status === 'finished') {
        return (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                ສຳເລັດແລ້ວ
            </span>
        );
    }
    if (status === 'calling') {
        return (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                <Clock3 className="h-3.5 w-3.5" />
                ຖືກເອີ້ນແລ້ວ
            </span>
        );
    }
    return (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-[#194c9f]">
            <Clock3 className="h-3.5 w-3.5" />
            ກຳລັງລໍຄິວ
        </span>
    );
}

function formatBookingDateLo(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('lo-LA', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
        return '—';
    }
}

function ConfirmModal({ open, queueNo, onCancel, onConfirm, loading }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
            <button type="button" className="absolute inset-0" onClick={onCancel} aria-label="Close cancel confirmation modal" />
            <section className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl" style={{ fontFamily: "'Noto Sans Lao', sans-serif" }}>
                <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-center text-base font-extrabold text-slate-900 sm:text-lg">ຢືນຢັນການຍົກເລີກຄິວ</h3>
                <p className="mt-2 text-center text-xs text-slate-600 sm:text-sm">ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການຍົກເລີກຄິວ {queueNo} ນີ້?</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 sm:text-sm"
                    >
                        ກັບຄືນ
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 sm:text-sm"
                    >
                        {loading ? 'ກຳລັງດຳເນີນການ...' : 'ຢືນຢັນຍົກເລີກ'}
                    </button>
                </div>
            </section>
        </div>
    );
}

export default function ReservePage({
    waiting_count = 0,
    queue_flow = { now_serving: null, now_calling: null, up_next: [], waiting_rows: [], ahead_of_you: null, progress_pct: 0, is_called: false },
    active_queues = [],
    booking_history = [],
    buffet_tiers = [],
    customer_profile = { name: '', phone: '' },
}) {
    const [clock, setClock] = useState(new Date());
    const [waitingCount, setWaitingCount] = useState(waiting_count);
    const [queueFlow, setQueueFlow] = useState(queue_flow);
    const [currentQueues, setCurrentQueues] = useState(active_queues);
    const [history, setHistory] = useState(booking_history);
    const [canceling, setCanceling] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelQueueTarget, setCancelQueueTarget] = useState(null);
    const [detailQueue, setDetailQueue] = useState(null);
    const [detailAnim, setDetailAnim] = useState(false);
    const [detailIsHistory, setDetailIsHistory] = useState(false);

    const closeDetail = () => {
        setDetailQueue(null);
        setDetailIsHistory(false);
    };
    const [form, setForm] = useState({
        customer_name: customer_profile?.name ?? '',
        phone: customer_profile?.phone ?? '',
        guest_count: 1,
        tier_id: buffet_tiers?.[0]?.id ?? '',
        booking_date: new Date().toISOString().slice(0, 10),
        zone_choice: 'standard',
    });

    const refreshStats = async () => {
        const response = await fetch(route('customer.reserve.stats'), {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
        });
        if (!response.ok) return;
        const data = await response.json();
        setWaitingCount(data.waiting_count ?? 0);
        setQueueFlow(data.queue_flow ?? { now_serving: null, now_calling: null, up_next: [], waiting_rows: [], ahead_of_you: null, progress_pct: 0, is_called: false });
        setCurrentQueues(Array.isArray(data.active_queues) ? data.active_queues : []);
        setHistory(Array.isArray(data.booking_history) ? data.booking_history : []);
    };

    useEffect(() => {
        const timer = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setForm((current) => ({
            ...current,
            tier_id: current.tier_id || buffet_tiers?.[0]?.id || '',
            customer_name: current.customer_name || customer_profile?.name || '',
            phone: current.phone || customer_profile?.phone || '',
        }));
    }, [buffet_tiers, customer_profile]);

    useEffect(() => {
        if (!detailQueue) {
            setDetailAnim(false);
            return;
        }
        const id = requestAnimationFrame(() => setDetailAnim(true));
        return () => cancelAnimationFrame(id);
    }, [detailQueue]);

    useEffect(() => {
        const poll = setInterval(async () => {
            try {
                await refreshStats();
            } catch {
                // Silent retry on next interval.
            }
        }, 30000);

        return () => clearInterval(poll);
    }, []);

    const digitalClock = useMemo(
        () =>
            clock.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            }),
        [clock]
    );

    const dayLabel = useMemo(() => clock.toLocaleDateString('en-GB'), [clock]);
    const profileNameTrimmed = (customer_profile?.name ?? '').trim();
    const onFormField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
        setFormErrors((current) => ({ ...current, [field]: undefined }));
    };

    const validateForm = () => {
        const errors = {};

        if (!String(form.customer_name ?? '').trim()) {
            errors.customer_name = 'ກະລຸນາລະບຸຊື່ລູກຄ້າ';
        }
        if (!isValidPhone(form.phone ?? '')) {
            errors.phone = PHONE_VALIDATION_MESSAGE;
        }
        if (!form.tier_id) {
            errors.tier_id = 'ກະລຸນາເລືອກປະເພດບຸບເຟ່';
        }
        if (!form.booking_date) {
            errors.booking_date = 'ກະລຸນາເລືອກວັນທີ';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const submitBooking = async () => {
        if (submitting) return;
        if (!validateForm()) return;
        setSubmitting(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
            const payload = {
                customer_name: form.customer_name,
                phone: form.phone,
                guest_count: form.guest_count,
                tier_id: form.tier_id,
                booking_date: form.booking_date,
                is_vip: form.zone_choice === 'vip_room',
            };
            const response = await window.axios.post(route('customer.reserve.store'), payload, {
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
            });
            const data = response?.data ?? {};

            setShowBookingModal(false);
            setSuccessMessage(`ຈອງຄິວສຳເລັດ: ${data.queue_no}`);
            if (data?.active_queue_item) {
                setCurrentQueues((current) => [data.active_queue_item, ...current]);
            }
            await refreshStats();
        } catch (error) {
            const serverErrors = error?.response?.data?.errors ?? {};
            const normalized = Object.fromEntries(
                Object.entries(serverErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
            );
            setFormErrors((current) => ({ ...current, ...normalized }));
            setErrorMessage(
                error?.response?.data?.message
                    || normalized?.customer_name
                    || normalized?.phone
                    || normalized?.tier_id
                    || normalized?.booking_date
                    || 'ບັນທຶກການຈອງບໍ່ສຳເລັດ, ກະລຸນາລອງໃໝ່'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const openCancelFromDetail = () => {
        if (!detailQueue || detailIsHistory) return;
        const target = detailQueue;
        closeDetail();
        setCancelQueueTarget(target);
        setShowCancelModal(true);
    };

    const cancelActiveQueue = async () => {
        if (!cancelQueueTarget || canceling) return;
        setCanceling(true);
        try {
            setErrorMessage('');
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
            await window.axios.patch(route('customer.reserve.cancel', cancelQueueTarget.id), {}, {
                headers: { 'X-CSRF-TOKEN': csrf, Accept: 'application/json' },
            });
            setShowCancelModal(false);
            setCancelQueueTarget(null);
            setCurrentQueues((current) => current.filter((queue) => queue.id !== cancelQueueTarget.id));
            await refreshStats();
            setSuccessMessage('ຍົກເລີກຄິວສຳເລັດແລ້ວ');
        } catch {
            setErrorMessage('ຍົກເລີກຄິວບໍ່ສຳເລັດ, ກະລຸນາລອງໃໝ່');
        } finally {
            setCanceling(false);
        }
    };

    const nowCallingNo = queueFlow?.now_calling?.queue_no ?? queueFlow?.now_serving ?? null;
    const waitingRows = Array.isArray(queueFlow?.waiting_rows) ? queueFlow.waiting_rows : [];

    return (
        <CustomerLayout>
            <Head title="ຈອງຄິວ" />

            <div className="customer-page w-full min-w-0 space-y-5 sm:space-y-6 md:space-y-7">
                <h1 className="mx-auto max-w-3xl px-1 text-center text-xl font-extrabold leading-snug text-slate-900 sm:text-2xl md:text-3xl">
                    ຈອງຄິວຮ້ານໂອຊິເນ
                </h1>
                {successMessage && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 sm:px-5 sm:text-base">
                        {successMessage}
                    </div>
                )}
                {errorMessage && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 sm:px-5 sm:text-base">
                        {errorMessage}
                    </div>
                )}

                <section className="w-full min-w-0 max-w-full rounded-2xl bg-gradient-to-br from-[#194c9f] via-[#1b4190] to-[#153d82] p-5 text-white shadow-xl ring-1 ring-white/15 sm:p-7 md:p-9">
                    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 sm:gap-7 md:max-w-none md:gap-8">
                        <div className="text-center">
                            <p className="text-2xl font-extrabold tabular-nums tracking-wide text-white sm:text-3xl md:text-4xl">
                                {digitalClock}
                            </p>
                            <p className="mt-1.5 text-sm font-medium text-white/85 sm:text-base">{dayLabel}</p>
                        </div>

                        <div
                            className="flex aspect-square w-[min(100%,12.5rem)] max-w-[12.5rem] flex-col items-center justify-center gap-2 rounded-full border-2 border-white/90 bg-white/10 px-3 py-4 shadow-[inset_0_2px_24px_rgba(0,0,0,0.12)] backdrop-blur-[2px] sm:w-[13.5rem] sm:max-w-[13.5rem] sm:gap-2.5 sm:py-5 md:w-[14rem] md:max-w-[14rem]"
                            aria-live="polite"
                            aria-label={`ຈຳນວນຄິວລໍຖ້າ ${waitingCount}`}
                        >
                            <p className="whitespace-nowrap text-center text-[clamp(2.5rem,11vw,4.25rem)] font-black leading-none tabular-nums text-white">
                                {String(waitingCount).padStart(3, '0')}
                            </p>
                            <p className="max-w-[10rem] text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-white/90 sm:text-xs">
                                ຄິວລໍຖ້າ
                            </p>
                        </div>

                        <div className="w-full px-2 sm:flex sm:justify-center sm:px-0">
                            <button
                                type="button"
                                onClick={() => setShowBookingModal(true)}
                                className="touch-target inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-bold text-[#194c9f] shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition hover:brightness-[1.03] active:scale-[0.99] sm:w-auto sm:min-w-[12rem] sm:py-3"
                            >
                                + ຈອງຄິວໃໝ່
                            </button>
                        </div>
                    </div>
                </section>

                {currentQueues.length === 0 && (
                    <p
                        className="break-words rounded-xl border border-slate-200/90 bg-white px-4 py-4 text-center text-sm leading-relaxed text-slate-600 shadow-sm sm:px-6 sm:py-5 sm:text-base"
                        style={{ fontFamily: "'Noto Sans Lao', sans-serif" }}
                    >
                        ທ່ານຍັງບໍ່ມີຄິວລໍຖ້າ — ກົດ{' '}
                        <span className="font-semibold text-[#194c9f]">+ ຈອງຄິວໃໝ່</span> ເທິງກາດສີຟ້າເພື່ອຈອງ.
                    </p>
                )}

                {currentQueues.length > 0 && (
                    <div className="max-h-[min(24rem,55vh)] space-y-3 overflow-y-auto overscroll-contain pr-1 sm:max-h-80 queue-scroll-panel">
                        {currentQueues.map((queue) => (
                            <section
                                key={queue.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                    setDetailIsHistory(false);
                                    setDetailQueue(queue);
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        setDetailIsHistory(false);
                                        setDetailQueue(queue);
                                    }
                                }}
                                className="flex min-w-0 cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-md outline-none ring-[#194c9f] transition hover:border-slate-300 focus-visible:ring-2"
                                style={{ fontFamily: "'Noto Sans Lao', sans-serif" }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-[#194c9f]/10 p-2">
                                        <Ticket className="h-5 w-5 text-[#194c9f]" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-slate-600 sm:text-base">ຄິວຂອງທ່ານ</p>
                                        <p className="text-xl font-extrabold tabular-nums text-slate-900 sm:text-2xl md:text-3xl">
                                            {queue.is_vip ? <span className="mr-1 inline-block text-lg sm:text-xl">👑</span> : null}
                                            {queue.queue_no}
                                        </p>
                                        <p className="mt-0.5 text-sm text-slate-500 sm:text-base">{queue.guest_count} ຄົນ</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setCancelQueueTarget(queue);
                                            setShowCancelModal(true);
                                        }}
                                        disabled={canceling}
                                        className="touch-target inline-flex items-center justify-center rounded-full text-rose-500 disabled:opacity-50"
                                        aria-label={`Cancel queue ${queue.queue_no}`}
                                    >
                                        <XCircle className="h-7 w-7 sm:h-8 sm:w-8" />
                                    </button>
                                </div>
                            </section>
                        ))}
                    </div>
                )}

                <QueueMonitorSection queueFlow={queueFlow} waitingRows={waitingRows} nowCallingNo={nowCallingNo} />

                <section className="space-y-3">
                    <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl md:text-2xl">ປະຫວັດການຈອງຄິວ</h2>
                    <div className="max-h-[min(26rem,58vh)] space-y-3 overflow-y-auto overscroll-contain pr-1 sm:max-h-96 queue-scroll-panel">
                    {history.map((row) => (
                        <article
                            key={row.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                                setDetailIsHistory(true);
                                setDetailQueue(row);
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    setDetailIsHistory(true);
                                    setDetailQueue(row);
                                }
                            }}
                            className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm outline-none ring-[#194c9f] transition hover:border-slate-300 focus-visible:ring-2"
                            style={{ fontFamily: "'Noto Sans Lao', sans-serif" }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-[#194c9f]/10 px-2 py-1 text-base font-bold text-[#194c9f] sm:text-lg md:text-xl">{row.queue_no}</div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="truncate text-base font-bold text-slate-900 sm:text-lg">{row.customer_name}</p>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{statusBadge(row.status)}</span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1">
                                            <Users className="h-3.5 w-3.5" />
                                            {row.guest_count} ຄົນ
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {row.date}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Clock3 className="h-3.5 w-3.5" />
                                            {row.time}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                    {history.length === 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-6 text-center text-xs text-slate-500 sm:text-sm">
                            ຍັງບໍ່ມີປະຫວັດການຈອງຄິວ
                        </div>
                    )}
                    </div>
                </section>
            </div>

            {showBookingModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 sm:p-4 lg:items-center">
                    <button type="button" className="absolute inset-0" aria-label="Close booking modal" onClick={() => setShowBookingModal(false)} />
                    <section
                        className="relative z-10 flex max-h-[min(92dvh,760px)] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200/90 bg-white shadow-[0_-12px_48px_rgba(15,23,42,0.18)] sm:max-w-lg sm:rounded-2xl sm:shadow-2xl lg:max-w-xl"
                        style={{ fontFamily: "'Noto Sans Lao', sans-serif" }}
                    >
                        <div className="mx-auto mb-1 mt-3 h-1.5 w-14 shrink-0 rounded-full bg-slate-300/90 lg:hidden" />
                        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-2 sm:px-6 sm:pb-7 lg:px-8 lg:pb-8 lg:pt-4">
                        <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-xl font-extrabold text-[#194c9f] sm:text-2xl">ຈອງຄິວ</h2>
                                <p className="mt-1 text-xs text-slate-500 sm:text-sm">ກະລຸນາກວດຄືນຂໍ້ມູນກ່ອນຢືນຢັນ</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowBookingModal(false)}
                                className="-mr-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#194c9f] transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#194c9f]"
                                aria-label="ປິດ"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm">ຊື່ລູກຄ້າ</label>
                                {profileNameTrimmed ? (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 shadow-inner sm:text-base">
                                        <p className="font-semibold">{profileNameTrimmed}</p>
                                        <Link
                                            href={route('customer.profile')}
                                            className="mt-1 inline-block text-xs font-semibold text-[#194c9f] hover:underline"
                                        >
                                            ແກ້ໄຂຊື່ທີ່ໂປຣໄຟລ໌
                                        </Link>
                                    </div>
                                ) : (
                                    <input
                                        value={form.customer_name}
                                        onChange={(event) => onFormField('customer_name', event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-[#194c9f] focus:outline-none focus:ring-2 focus:ring-[#194c9f]/20 sm:text-base"
                                    />
                                )}
                                {formErrors.customer_name && <p className="mt-1 text-xs text-rose-600">{formErrors.customer_name}</p>}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm">ເບີໂທລະສັບ</label>
                                <input
                                    value={form.phone}
                                    onChange={(event) => onFormField('phone', digitsOnly(event.target.value))}
                                    placeholder={PHONE_PLACEHOLDER}
                                    inputMode="numeric"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-[#194c9f] focus:outline-none focus:ring-2 focus:ring-[#194c9f]/20 sm:text-base"
                                />
                                {formErrors.phone && <p className="mt-1 text-xs text-rose-600">{formErrors.phone}</p>}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm">ຈຳນວນຄົນ</label>
                                <div className="flex items-center justify-between gap-6 rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-inner sm:px-3">
                                    <button
                                        type="button"
                                        onClick={() => onFormField('guest_count', Math.max(1, Number(form.guest_count) - 1))}
                                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-[#194c9f]/40 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#194c9f]"
                                        aria-label="ຫຼຸດຈຳນວນ"
                                    >
                                        <Minus className="h-5 w-5" />
                                    </button>
                                    <span className="min-w-[2.5rem] text-center text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">{form.guest_count}</span>
                                    <button
                                        type="button"
                                        onClick={() => onFormField('guest_count', Math.min(20, Number(form.guest_count) + 1))}
                                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-[#194c9f]/40 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#194c9f]"
                                        aria-label="ເພີ່ມຈຳນວນ"
                                    >
                                        <Plus className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm">ປະເພດບຸບເຟ່</label>
                                <select
                                    value={form.tier_id}
                                    onChange={(event) => onFormField('tier_id', event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-[#194c9f] focus:outline-none focus:ring-2 focus:ring-[#194c9f]/20 sm:text-base"
                                >
                                    <option value="">ເລືອກປະເພດບຸບເຟ່</option>
                                    {buffet_tiers.map((tier) => (
                                        <option key={tier.id} value={tier.id}>
                                            {tier.label}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.tier_id && <p className="mt-1 text-xs text-rose-600">{formErrors.tier_id}</p>}
                            </div>

                            <fieldset className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/90 p-3 sm:p-4">
                                <legend className="px-1 text-xs font-semibold text-slate-700 sm:text-sm">ເລືອກໂຊນ / Zone</legend>
                                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 hover:bg-white/80 has-[:checked]:border-[#194c9f]/30 has-[:checked]:bg-white">
                                    <input
                                        type="radio"
                                        name="zone_choice"
                                        className="mt-1 h-4 w-4 shrink-0 accent-[#194c9f]"
                                        checked={form.zone_choice === 'standard'}
                                        onChange={() => onFormField('zone_choice', 'standard')}
                                    />
                                    <span className="min-w-0 text-sm text-slate-800">
                                        <span className="font-bold">ໂຊນມາດຕະຖານ</span>
                                        <span className="mt-0.5 block text-xs text-slate-600">Standard Zone · ຄິວ Q-XXXX</span>
                                    </span>
                                </label>
                                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 hover:bg-amber-50/80 has-[:checked]:border-amber-400/60 has-[:checked]:bg-amber-50">
                                    <input
                                        type="radio"
                                        name="zone_choice"
                                        className="mt-1 h-4 w-4 shrink-0 accent-amber-600"
                                        checked={form.zone_choice === 'vip_room'}
                                        onChange={() => onFormField('zone_choice', 'vip_room')}
                                    />
                                    <span className="min-w-0 text-sm text-slate-900">
                                        <span className="inline-flex flex-wrap items-center gap-1 font-bold">
                                            ຫ້ອງ VIP <span aria-hidden>👑</span>
                                        </span>
                                        <span className="mt-0.5 block text-xs text-amber-900/90">
                                            VIP Room Zone (+200,000 ₭ ຄ່າບໍລິການ ໂຕະຊຳລະຕອນເຊັກບິນ) · ຄິວ V-XXXX
                                        </span>
                                    </span>
                                </label>
                            </fieldset>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm">ວັນທີຈອງ</label>
                                <input
                                    type="date"
                                    min={new Date().toISOString().slice(0, 10)}
                                    value={form.booking_date}
                                    onChange={(event) => onFormField('booking_date', event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-[#194c9f] focus:outline-none focus:ring-2 focus:ring-[#194c9f]/20 sm:text-base"
                                />
                                {formErrors.booking_date && <p className="mt-1 text-xs text-rose-600">{formErrors.booking_date}</p>}
                            </div>

                            <button
                                type="button"
                                onClick={submitBooking}
                                disabled={submitting}
                                className="touch-target mt-2 w-full rounded-xl bg-gradient-to-b from-[#2a63bb] to-[#174896] px-4 py-3.5 text-base font-bold text-white shadow-[0_10px_28px_rgba(25,76,159,0.35)] ring-1 ring-white/25 transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-50 disabled:hover:translate-y-0 sm:text-lg"
                            >
                                {submitting ? 'ກຳລັງບັນທຶກ...' : 'ຢືນຢັນການຈອງ'}
                            </button>
                        </div>
                        </div>
                    </section>
                </div>
            )}

            {detailQueue && (
                <div className="fixed inset-0 z-[55] flex items-end justify-center sm:items-center">
                    <button
                        type="button"
                        className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-200 ${detailAnim ? 'opacity-100' : 'opacity-0'}`}
                        aria-label="Close queue detail"
                        onClick={closeDetail}
                    />
                    <div
                        className={`relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl transition-[transform,opacity] duration-300 ease-out sm:max-w-lg sm:rounded-2xl sm:translate-y-0 lg:max-w-xl ${
                            detailAnim ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 sm:opacity-0'
                        }`}
                        style={{ fontFamily: "'Noto Sans Lao', sans-serif" }}
                    >
                        <div className="mx-auto mt-2 h-1.5 w-14 shrink-0 rounded-full bg-slate-300 sm:hidden" />
                        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-4 pb-2 pt-3">
                            <h2 className="text-base font-extrabold text-[#194c9f] underline decoration-[#194c9f] decoration-2 underline-offset-4 sm:text-lg">ລາຍລະອຽດຄິວ</h2>
                            <button
                                type="button"
                                onClick={closeDetail}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#194c9f] text-white shadow-sm"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-2">
                            <div className="flex flex-col items-center">
                                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#194c9f] px-2 text-white shadow-inner sm:h-32 sm:w-32 md:h-36 md:w-36 md:px-3">
                                    <span className="max-w-full whitespace-normal break-words text-center text-xl font-black leading-none tabular-nums sm:text-2xl md:text-3xl">
                                        {formatQueueNoDisplay(detailQueue.queue_no)}
                                    </span>
                                </div>
                                <QueueDetailStatusPill status={detailQueue.status} />
                            </div>

                            <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
                                <li className="flex gap-3 px-3 py-3">
                                    <User className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">ຊື່ລູກຄ້າ</p>
                                        <p className="font-bold text-slate-900">{detailQueue.customer_name ?? '—'}</p>
                                    </div>
                                </li>
                                <li className="flex gap-3 px-3 py-3">
                                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">ເບີໂທລະສັບ</p>
                                        <p className="font-bold text-slate-900">{detailQueue.phone ?? '—'}</p>
                                    </div>
                                </li>
                                <li className="flex gap-3 px-3 py-3">
                                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">ຈຳນວນຄົນ</p>
                                        <p className="font-bold text-slate-900">{String(detailQueue.guest_count ?? 0).padStart(2, '0')} ຄົນ</p>
                                    </div>
                                </li>
                                <li className="flex gap-3 px-3 py-3">
                                    <SquareMenu className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">ປະເພດບຸບເຟ່</p>
                                        <p className="font-bold text-slate-900">{detailQueue.buffet_tier_label ?? '—'}</p>
                                    </div>
                                </li>
                                <li className="flex gap-3 px-3 py-3">
                                    <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">ໂຊນ / Zone</p>
                                        <p className="font-bold text-slate-900">
                                            {detailQueue.is_vip ? 'VIP Room 👑' : 'Standard Zone'}
                                        </p>
                                    </div>
                                </li>
                                <li className="flex gap-3 px-3 py-3">
                                    <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">ວັນທີຈອງ</p>
                                        <p className="font-bold text-slate-900">
                                            {detailQueue.expected_time
                                                ? formatBookingDateLo(detailQueue.expected_time)
                                                : [detailQueue.date, detailQueue.time].filter(Boolean).join(' ') || '—'}
                                        </p>
                                    </div>
                                </li>
                            </ul>

                            {!detailIsHistory && (
                                <button
                                    type="button"
                                    onClick={openCancelFromDetail}
                                    disabled={canceling}
                                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-50 sm:text-base"
                                >
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-rose-500">
                                        <X className="h-5 w-5" />
                                    </span>
                                    ຍົກເລີກການຈອງ
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={showCancelModal}
                queueNo={cancelQueueTarget ? formatQueueNoDisplay(cancelQueueTarget.queue_no) : '-'}
                onCancel={() => {
                    setShowCancelModal(false);
                    setCancelQueueTarget(null);
                }}
                onConfirm={cancelActiveQueue}
                loading={canceling}
            />
        </CustomerLayout>
    );
}

