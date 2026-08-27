import { Phone, Users, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const STATUS_LABELS = {
    waiting: 'ລໍຖ້າ',
    pending: 'ລໍຖ້າ',
    confirmed: 'ລໍຖ້າ',
    calling: 'ຖືກເອີ້ນແລ້ວ',
    skipped: 'ຂ້າມແລ້ວ',
};

/** Cooldown after ກົດເອີ້ນ — ສະແດງ «ເອີ້ນແລ້ວ» ສີຂຽວກ່ອນກັບໄປເອີ້ນອີກ */
const CALL_ACK_COOLDOWN_MS = 4500;

/**
 * ກາດຄິວ — Call / Recall / Pair Table ຕາມສະຖານະ
 */
export default function QueueCard({
    entry,
    processing,
    activePairBookingId,
    variant = 'waiting',
    onSkip,
    onCancel,
    onCall,
    onOpenPairQueueToTable,
}) {
    const isSkipped = variant === 'skipped';
    const isCalling = entry.status === 'calling';
    const isWaiting = !isCalling && !isSkipped;
    const modalOpenForThis = activePairBookingId === entry.id;
    const statusLabel = STATUS_LABELS[entry.status] ?? entry.status ?? '—';

    const isVip = Boolean(entry.is_vip);

    const [callAckUntil, setCallAckUntil] = useState(0);
    const callAckTimerRef = useRef(null);

    const clearCallAckTimer = useCallback(() => {
        if (callAckTimerRef.current !== null) {
            clearTimeout(callAckTimerRef.current);
            callAckTimerRef.current = null;
        }
    }, []);

    const beginCallAck = useCallback(() => {
        const until = Date.now() + CALL_ACK_COOLDOWN_MS;
        setCallAckUntil(until);
        clearCallAckTimer();
        callAckTimerRef.current = window.setTimeout(() => {
            setCallAckUntil(0);
            callAckTimerRef.current = null;
        }, CALL_ACK_COOLDOWN_MS);
    }, [clearCallAckTimer]);

    useEffect(() => {
        return () => clearCallAckTimer();
    }, [clearCallAckTimer]);

    useEffect(() => {
        setCallAckUntil(0);
        clearCallAckTimer();
    }, [entry.id, clearCallAckTimer]);

    const isCallLoading = processing === `call-${entry.id}`;
    const inCallAck = callAckUntil > Date.now();

    const handleCall = () => {
        onCall?.(entry.id);
        beginCallAck();
    };

    const recallBtnClass = () => {
        if (inCallAck) {
            return 'inline-flex items-center justify-center gap-1 rounded-lg border-2 border-emerald-500 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-900 shadow-[0_0_0_1px_rgba(16,185,129,0.2)] ring-2 ring-emerald-400/35 transition disabled:opacity-60';
        }
        return 'inline-flex items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-100 px-2.5 py-1.5 text-[11px] font-bold text-amber-950 transition hover:bg-amber-200 disabled:opacity-50';
    };

    const firstCallBtnClass = inCallAck
        ? 'inline-flex items-center justify-center gap-1 rounded-lg border-2 border-emerald-500 bg-emerald-100 px-2.5 py-1.5 text-[11px] font-bold text-emerald-950 shadow-[0_0_12px_rgba(16,185,129,0.35)] ring-2 ring-emerald-400/40 transition disabled:opacity-60'
        : 'inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50';

    const recallLabel = () => {
        if (isCallLoading) {
            return '...';
        }
        if (inCallAck) {
            return 'ເອີ້ນແລ້ວ';
        }
        return 'ເອີ້ນອີກ';
    };

    const firstCallLabel = () => {
        if (isCallLoading) {
            return '...';
        }
        if (inCallAck) {
            return 'ເອີ້ນແລ້ວ';
        }
        return 'ເອີ້ນ';
    };

    const callDisabled = !!processing || inCallAck;

    return (
        <div
            className={`rounded-xl border bg-white p-2.5 shadow-sm transition-colors ${
                isVip ? 'border-amber-400/80 ring-1 ring-amber-200/80' : ''
            } ${
                modalOpenForThis
                    ? 'border-sky-400 ring-2 ring-sky-200'
                    : isCalling
                      ? 'border-amber-300/90 bg-amber-50/50'
                      : isSkipped
                        ? 'border-amber-200/90 bg-amber-50/40'
                        : 'border-slate-200/90'
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">ຄິວ</span>
                        <span className="text-sm font-extrabold leading-tight text-slate-900">
                            {isVip ? <span className="mr-0.5" title="VIP queue">👑</span> : null}
                            {entry.queue_no}
                        </span>
                        <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                isCalling
                                    ? 'bg-amber-200 text-amber-950'
                                    : 'bg-sky-100 text-sky-900'
                            }`}
                        >
                            {statusLabel}
                        </span>
                        <span className="max-w-[min(120px,40%)] truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {entry.buffet_type}
                        </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-bold leading-snug text-slate-900">{entry.customer_name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] leading-tight text-slate-600">
                        <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
                            {entry.group_size} ທ່ານ
                        </span>
                        <span className="inline-flex min-w-0 max-w-full items-center gap-1">
                            <Phone className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
                            <span className="truncate">{entry.phone}</span>
                        </span>
                    </div>
                    {isSkipped && typeof entry.skip_count === 'number' ? (
                        <p className="mt-1 text-[10px] font-semibold leading-tight text-amber-800">
                            ຂ້າມແລ້ວ {entry.skip_count} ຄັ້ງ
                            {entry.skip_count === 1 ? ' · ອີກຄັ້ງຈະຍົກເລີກອັດຕະໂນມັດ' : ''}
                        </p>
                    ) : null}
                </div>

                <div className="flex shrink-0 flex-col gap-1.5">
                    {isCalling ? (
                        <>
                            <button
                                type="button"
                                disabled={callDisabled}
                                onClick={handleCall}
                                className={recallBtnClass()}
                                title={
                                    inCallAck
                                        ? 'ເອີ້ນແລ້ວ — ລໍຖ້າຊົ່ວຄາວກ່ອນເອີ້ນອີກ'
                                        : 'ເອີ້ນຄິວອີກຄັ້ງ'
                                }
                            >
                                <Volume2 className={`h-3.5 w-3.5 ${inCallAck ? 'text-emerald-700' : ''}`} />
                                {recallLabel()}
                            </button>
                            {onOpenPairQueueToTable ? (
                                <button
                                    type="button"
                                    disabled={!!processing}
                                    onClick={() => onOpenPairQueueToTable(entry.id)}
                                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold leading-tight shadow-sm transition disabled:opacity-50 ${
                                        modalOpenForThis
                                            ? 'bg-sky-600 text-white ring-1 ring-sky-300 hover:bg-sky-700'
                                            : 'bg-[#194c9f] text-white hover:bg-[#153d82]'
                                    }`}
                                >
                                    ຈັບຄິວໃສ່ໂຕະ
                                </button>
                            ) : null}
                        </>
                    ) : isSkipped && onCall ? (
                        <>
                            <button
                                type="button"
                                disabled={callDisabled}
                                onClick={handleCall}
                                className={recallBtnClass()}
                                title={
                                    inCallAck
                                        ? 'ເອີ້ນແລ້ວ — ລໍຖ້າຊົ່ວຄາວກ່ອນເອີ້ນອີກ'
                                        : 'ເອີ້ນຄິວອີກຄັ້ງ (ຈາກຄິວຂ້າມ)'
                                }
                            >
                                <Volume2 className={`h-3.5 w-3.5 ${inCallAck ? 'text-emerald-700' : ''}`} />
                                {recallLabel()}
                            </button>
                            {onOpenPairQueueToTable ? (
                                <button
                                    type="button"
                                    disabled={!!processing}
                                    onClick={() => onOpenPairQueueToTable(entry.id)}
                                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold leading-tight shadow-sm transition disabled:opacity-50 ${
                                        modalOpenForThis
                                            ? 'bg-sky-600 text-white ring-1 ring-sky-300 hover:bg-sky-700'
                                            : 'bg-[#194c9f] text-white hover:bg-[#153d82]'
                                    }`}
                                >
                                    ຈັບຄິວໃສ່ໂຕະ
                                </button>
                            ) : null}
                        </>
                    ) : isWaiting && onCall ? (
                        <button
                            type="button"
                            disabled={callDisabled}
                            onClick={handleCall}
                            className={firstCallBtnClass}
                            title={
                                inCallAck
                                    ? 'ເອີ້ນແລ້ວ — ລໍຖ້າຊົ່ວຄາວກ່ອນເອີ້ນອີກ'
                                    : 'ເອີ້ນຄິວ'
                            }
                        >
                            <Volume2 className="h-3.5 w-3.5" />
                            {firstCallLabel()}
                        </button>
                    ) : onOpenPairQueueToTable ? (
                        <button
                            type="button"
                            disabled={!!processing}
                            onClick={() => onOpenPairQueueToTable(entry.id)}
                            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold leading-tight shadow-sm transition disabled:opacity-50 ${
                                modalOpenForThis
                                    ? 'bg-sky-600 text-white ring-1 ring-sky-300 hover:bg-sky-700'
                                    : 'bg-[#194c9f] text-white hover:bg-[#153d82]'
                            }`}
                        >
                            ຈັບຄິວໃສ່ໂຕະ
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
                <button
                    type="button"
                    disabled={!!processing}
                    onClick={() => onSkip(entry.id)}
                    className="min-h-[32px] rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                    {processing === `skip-${entry.id}` ? 'ກຳລັງ...' : 'ຂ້າມ'}
                </button>
                <button
                    type="button"
                    disabled={!!processing}
                    onClick={() => onCancel(entry.id)}
                    className="min-h-[32px] rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-800 transition hover:bg-rose-100 disabled:opacity-50"
                >
                    {processing === `cancel-${entry.id}` ? 'ກຳລັງ...' : 'ຍົກເລີກ'}
                </button>
            </div>
        </div>
    );
}
