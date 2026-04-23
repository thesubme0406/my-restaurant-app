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
    return 'ກຳລັງດຳເນີນການ';
}

const DEFAULT_PHONE_REGEX = /^020\d{8}$/;

function formatQueueNoDisplay(queueNo) {
    if (!queueNo) return '';
    const m = String(queueNo).match(/^Q-?(\d+)$/i);
    if (!m) return String(queueNo);
    return `Q-${String(m[1]).padStart(3, '0')}`;
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
                <h3 className="text-center text-lg font-extrabold text-slate-900">ຢືນຢັນການຍົກເລີກຄິວ</h3>
                <p className="mt-2 text-center text-sm text-slate-600">ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການຍົກເລີກຄິວ {queueNo} ນີ້?</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                    >
                        ກັບຄືນ
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
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
    estimated_wait_minutes = 0,
    active_queues = [],
    booking_history = [],
    buffet_tiers = [],
    customer_profile = { name: '', phone: '' },
}) {
    const [clock, setClock] = useState(new Date());
    const [waitingCount, setWaitingCount] = useState(waiting_count);
    const [estimatedWait, setEstimatedWait] = useState(estimated_wait_minutes);
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
    });

    const refreshStats = async () => {
        const response = await fetch(route('customer.reserve.stats'), {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
        });
        if (!response.ok) return;
        const data = await response.json();
        setWaitingCount(data.waiting_count ?? 0);
        setEstimatedWait(data.estimated_wait_minutes ?? 0);
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
        if (!DEFAULT_PHONE_REGEX.test(String(form.phone ?? ''))) {
            errors.phone = 'ເບີໂທຕ້ອງຢູ່ໃນຮູບແບບ 020xxxxxxxx';
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

    return (
        <CustomerLayout>
            <Head title="ຈອງຄິວ" />

            <div className="space-y-3">
                <h1 className="text-center text-3xl font-extrabold text-[#194c9f]">ຈອງຄິວຮ້ານໂອຊິເນ</h1>
                {successMessage && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{successMessage}</div>}
                {errorMessage && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{errorMessage}</div>}

                <section className="rounded-xl bg-[#194c9f] p-4 text-white shadow-sm">
                    <p className="text-center text-5xl font-extrabold tracking-widest">{digitalClock}</p>
                    <p className="mt-1 text-center text-sm">{dayLabel}</p>

                    <div className="mx-auto mt-3 flex h-36 w-36 flex-col items-center justify-center rounded-full border border-white/80">
                        <p className="text-5xl font-bold">{String(waitingCount).padStart(3, '0')}</p>
                        <p className="text-sm">ຄິວລໍຖ້າ</p>
                    </div>

                    <p className="mt-3 text-center text-sm">~{estimatedWait}ນາທີ ລໍຖ້າໂດຍປະມານ</p>
                    <div className="mt-3 text-center">
                        <button
                            type="button"
                            onClick={() => setShowBookingModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xl font-bold text-[#194c9f]"
                        >
                            + ຈອງຄິວໃໝ່
                        </button>
                    </div>
                </section>

                {currentQueues.length === 0 && (
                    <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm text-slate-600 shadow-sm" style={{ fontFamily: "'Noto Sans Lao', sans-serif" }}>
                        ທ່ານຍັງບໍ່ມີຄິວລໍຖ້າ — ກົດ <span className="font-semibold text-[#194c9f]">+ ຈອງຄິວໃໝ່</span> ເທິງກາດສີຟ້າເພື່ອຈອງ.
                    </p>
                )}

                {currentQueues.length > 0 && (
                    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
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
                                className="flex cursor-pointer items-center justify-between rounded-xl border border-[#194c9f]/40 bg-white p-3 shadow-md outline-none ring-[#194c9f] focus-visible:ring-2"
                                style={{ fontFamily: "'Noto Sans Lao', sans-serif" }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-[#194c9f]/10 p-2">
                                        <Ticket className="h-5 w-5 text-[#194c9f]" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">ຄິວຂອງທ່ານ</p>
                                        <p className="text-3xl font-extrabold text-[#194c9f]">{queue.queue_no}</p>
                                        <p className="text-xs text-slate-500">{queue.guest_count} ຄົນ</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-[#194c9f]">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        ~{queue.estimated_wait_time ?? estimatedWait}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setCancelQueueTarget(queue);
                                            setShowCancelModal(true);
                                        }}
                                        disabled={canceling}
                                        className="rounded-full text-rose-500 disabled:opacity-50"
                                        aria-label={`Cancel queue ${queue.queue_no}`}
                                    >
                                        <XCircle className="h-8 w-8" />
                                    </button>
                                </div>
                            </section>
                        ))}
                    </div>
                )}

                <section className="space-y-2">
                    <h2 className="text-2xl font-extrabold text-slate-900">ປະຫວັດການຈອງຄິວ</h2>
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
                                <div className="rounded-lg bg-[#194c9f]/10 px-2 py-1 text-xl font-bold text-[#194c9f]">{row.queue_no}</div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="truncate text-lg font-bold text-slate-900">{row.customer_name}</p>
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
                </section>
            </div>

            {showBookingModal && (
                <div className="fixed inset-0 z-50 flex items-end bg-slate-900/40">
                    <button type="button" className="absolute inset-0" aria-label="Close booking modal" onClick={() => setShowBookingModal(false)} />
                    <section className="relative z-10 w-full rounded-t-3xl bg-white p-4 shadow-2xl">
                        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-slate-300" />
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-3xl font-extrabold text-[#194c9f]">ຈອງຄິວ</h2>
                            <button type="button" onClick={() => setShowBookingModal(false)} className="rounded-full p-1 text-[#194c9f]">
                                <X className="h-7 w-7" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-600">ຊື່ລູກຄ້າ</label>
                                {profileNameTrimmed ? (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base text-slate-900">
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
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base"
                                    />
                                )}
                                {formErrors.customer_name && <p className="mt-1 text-xs text-rose-600">{formErrors.customer_name}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-600">ເບີໂທລະສັບ</label>
                                <input
                                    value={form.phone}
                                    onChange={(event) => onFormField('phone', event.target.value.replace(/\D/g, '').slice(0, 11))}
                                    placeholder="020xxxxxxxx"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base"
                                />
                                {formErrors.phone && <p className="mt-1 text-xs text-rose-600">{formErrors.phone}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-600">ຈຳນວນຄົນ</label>
                                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                    <button
                                        type="button"
                                        onClick={() => onFormField('guest_count', Math.max(1, Number(form.guest_count) - 1))}
                                        className="rounded-full border border-slate-400 p-1 text-slate-700"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="text-xl font-semibold">{form.guest_count}</span>
                                    <button
                                        type="button"
                                        onClick={() => onFormField('guest_count', Math.min(20, Number(form.guest_count) + 1))}
                                        className="rounded-full border border-slate-400 p-1 text-slate-700"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-600">ປະເພດບຸບເຟ່</label>
                                <select
                                    value={form.tier_id}
                                    onChange={(event) => onFormField('tier_id', event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base"
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

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-600">ວັນທີຈອງ</label>
                                <input
                                    type="date"
                                    min={new Date().toISOString().slice(0, 10)}
                                    value={form.booking_date}
                                    onChange={(event) => onFormField('booking_date', event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base"
                                />
                                {formErrors.booking_date && <p className="mt-1 text-xs text-rose-600">{formErrors.booking_date}</p>}
                            </div>

                            <button
                                type="button"
                                onClick={submitBooking}
                                disabled={submitting}
                                className="w-full rounded-xl bg-[#194c9f] px-4 py-2.5 text-xl font-bold text-white disabled:opacity-50"
                            >
                                {submitting ? 'ກຳລັງບັນທຶກ...' : 'ຢືນຢັນການຈອງ'}
                            </button>
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
                        className={`relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl transition-[transform,opacity] duration-300 ease-out sm:rounded-2xl sm:translate-y-0 ${
                            detailAnim ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 sm:opacity-0'
                        }`}
                        style={{ fontFamily: "'Noto Sans Lao', sans-serif" }}
                    >
                        <div className="mx-auto mt-2 h-1.5 w-14 shrink-0 rounded-full bg-slate-300 sm:hidden" />
                        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-4 pb-2 pt-3">
                            <h2 className="text-lg font-extrabold text-[#194c9f] underline decoration-[#194c9f] decoration-2 underline-offset-4">ລາຍລະອຽດຄິວ</h2>
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
                                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#194c9f] text-3xl font-extrabold text-white shadow-inner">
                                    {formatQueueNoDisplay(detailQueue.queue_no)}
                                </div>
                                <QueueDetailStatusPill status={detailQueue.status} />
                            </div>

                            {!detailIsHistory && (
                                <div className="mt-4 rounded-xl border border-slate-200 border-l-4 border-l-[#194c9f] bg-slate-50 py-3 pl-4 pr-3 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#194c9f]/15 text-[#194c9f]">
                                            <Clock3 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-extrabold text-slate-900">~{detailQueue.estimated_wait_time ?? estimatedWait} ນາທີ</p>
                                            <p className="text-xs text-slate-500">ລໍຖ້າໂດຍປະມານ</p>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 py-3 text-base font-bold text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-50"
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

