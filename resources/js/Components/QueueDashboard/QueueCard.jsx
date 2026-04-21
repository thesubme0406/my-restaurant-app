import { Phone, Users } from 'lucide-react';

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
            className={`rounded-2xl border bg-white p-4 shadow-md transition-colors ${
                modalOpenForThis
                    ? 'border-sky-400 ring-2 ring-sky-200'
                    : isSkipped
                      ? 'border-amber-200/90 bg-amber-50/30'
                      : 'border-slate-200/90'
            }`}
        >
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        ຄິວ
                    </p>
                    <p className="text-lg font-bold text-slate-900">{entry.queue_no}</p>
                </div>
                <span className="max-w-[55%] truncate rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-900">
                    {entry.buffet_type}
                </span>
            </div>

            <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p className="text-base font-semibold text-slate-900">{entry.customer_name}</p>
                <div className="flex items-center gap-2 text-slate-600">
                    <Users className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{entry.group_size} ທ່ານ</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="break-all">{entry.phone}</span>
                </div>
                {isSkipped && typeof entry.skip_count === 'number' ? (
                    <p className="text-xs font-semibold text-amber-800">
                        ຂ້າມແລ້ວ {entry.skip_count} ຄັ້ງ
                        {entry.skip_count >= 3 ? ' · ອີກຄັ້ງຈະຍົກເລີກອັດຕະໂນມັດ' : ''}
                    </p>
                ) : null}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                    type="button"
                    disabled={!!processing}
                    onClick={() => onSkip(entry.id)}
                    className="min-h-[40px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                    {processing === `skip-${entry.id}` ? 'ກຳລັງ...' : 'ຂ້າມ'}
                </button>
                <button
                    type="button"
                    disabled={!!processing}
                    onClick={() => onCancel(entry.id)}
                    className="min-h-[40px] rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 disabled:opacity-50"
                >
                    {processing === `cancel-${entry.id}` ? 'ກຳລັງ...' : 'ຍົກເລີກ'}
                </button>
                {onOpenPairQueueToTable ? (
                    <button
                        type="button"
                        disabled={!!processing}
                        onClick={() => onOpenPairQueueToTable(entry.id)}
                        className={`min-h-[40px] rounded-xl px-3 py-2.5 text-sm font-bold shadow-sm transition disabled:opacity-50 sm:ms-auto ${
                            modalOpenForThis
                                ? 'bg-sky-600 text-white ring-2 ring-sky-300 hover:bg-sky-700'
                                : 'bg-[#194c9f] text-white hover:bg-[#153d82]'
                        }`}
                    >
                        ຈັບຄິວໃສ່ໂຕະ
                    </button>
                ) : null}
            </div>
        </div>
    );
}
