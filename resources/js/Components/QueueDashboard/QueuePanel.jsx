import QueueCard from '@/Components/QueueDashboard/QueueCard';
import { Plus } from 'lucide-react';

export default function QueuePanel({
    queue,
    skippedQueue,
    processing,
    addFormProcessing,
    activePairBookingId,
    onAddClick,
    onSkip,
    onCancel,
    onCall,
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
                                onCall={onCall}
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
                            ກັບມາເອີ້ນຄິວໃໝ່ໄດ້ · ຂ້າມຄົບ 2 ຄັ້ງຈະຍົກເລີກອັດຕະໂນມັດ
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
                                onCall={onCall}
                                onOpenPairQueueToTable={onOpenPairQueueToTable}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
