import { Phone, Users } from 'lucide-react';

/**
 * ກາດຄິວແບບກະທັດລັດ — ຄິວ, ຊື່, ປຸ່ມຈັບໂຕະຈັດແຖວໃຫ້ອ່ານງ່າຍ
 */
export default function QueueCard({
    entry,
    processing,
    activePairBookingId,
    variant = 'waiting',
    onSkip,
    onCancel,
    onOpenPairQueueToTable,
}) {
    const isSkipped = variant === 'skipped';
    const modalOpenForThis = activePairBookingId === entry.id;

    return (
        <div
            className={`rounded-xl border bg-white p-2.5 shadow-sm transition-colors ${
                modalOpenForThis
                    ? 'border-sky-400 ring-2 ring-sky-200'
                    : isSkipped
                      ? 'border-amber-200/90 bg-amber-50/40'
                      : 'border-slate-200/90'
            }`}
        >
            {/* ແຖວເທິງ: ລະຫັດຄິວ + ປະເພດ + ຈັບໂຕະ (ຈັດຊິ້ນກັນໃນກາດນ້ອຍ) */}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">ຄິວ</span>
                        <span className="text-sm font-extrabold leading-tight text-slate-900">{entry.queue_no}</span>
                        <span className="max-w-[min(140px,45%)] truncate rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-900">
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
                {onOpenPairQueueToTable ? (
                    <button
                        type="button"
                        disabled={!!processing}
                        onClick={() => onOpenPairQueueToTable(entry.id)}
                        className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold leading-tight shadow-sm transition disabled:opacity-50 ${
                            modalOpenForThis
                                ? 'bg-sky-600 text-white ring-1 ring-sky-300 hover:bg-sky-700'
                                : 'bg-[#194c9f] text-white hover:bg-[#153d82]'
                        }`}
                    >
                        ຈັບຄິວໃສ່ໂຕະ
                    </button>
                ) : null}
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
