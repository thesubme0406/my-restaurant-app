export function formatQueueNoDisplay(queueNo) {
    if (!queueNo) return '';
    return String(queueNo);
}

export default function QueueMonitorSection({ queueFlow, waitingRows, nowCallingNo }) {
    const progressPct = Math.max(0, Math.min(100, Number(queueFlow?.progress_pct ?? 0)));

    return (
        <section className="my-5 w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-[#194c9f]/20 bg-gradient-to-br from-[#123d84] via-[#194c9f] to-[#2158b0] p-5 text-white shadow-xl ring-1 ring-[#194c9f]/25 sm:p-6 md:p-8">
            <div className="mb-5 flex min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1 pr-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75 sm:text-xs">
                        Queue Monitor
                    </p>
                    <h3 className="mt-1 text-lg font-extrabold leading-snug sm:text-xl md:text-2xl">ສະຖານະຄິວປະຈຸບັນ</h3>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-emerald-200/40 bg-emerald-400/15 px-3 py-1.5 text-xs font-bold text-emerald-100 sm:text-sm">
                    <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300" />
                    Live
                </span>
            </div>

            {/* Mobile: stack · Tablet+: side-by-side calling + wait status */}
            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                <div className="min-w-0 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70 sm:text-xs">ກຳລັງເອີ້ນ</p>
                    <p
                        className={`mt-3 min-w-0 break-words text-3xl font-black tabular-nums leading-none sm:text-4xl md:text-5xl ${
                            queueFlow?.is_called ? 'text-[#ffe082]' : 'text-white'
                        }`}
                    >
                        {queueFlow?.now_calling?.is_vip ? (
                            <span className="mr-1 inline-block align-middle text-[0.65em] sm:text-[0.7em]" aria-hidden>
                                👑
                            </span>
                        ) : null}
                        <span className="inline-block">{formatQueueNoDisplay(nowCallingNo) || '—'}</span>
                    </p>
                    {queueFlow?.now_calling ? (
                        <p className="mt-3 break-words text-sm font-medium leading-relaxed text-white/85 sm:text-base">
                            {queueFlow.now_calling.customer_name} · {queueFlow.now_calling.guest_count} ຄົນ
                        </p>
                    ) : null}
                </div>

                <div className="flex min-w-0 flex-col justify-center rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
                    <p className="break-words text-sm font-semibold leading-relaxed text-white sm:text-base">
                        {queueFlow?.is_called
                            ? 'ຮອດຄິວຂອງທ່ານແລ້ວ — ກະລຸນາມາທີ່ເຄົາເຕີ'
                            : typeof queueFlow?.your_position === 'number'
                              ? `ຄິວຂອງທ່ານຢູ່ລຳດັບທີ ${queueFlow.your_position} · ອີກ ${queueFlow.ahead_of_you ?? 0} ຄິວກ່ອນເຖິງຄິວຂອງທ່ານ`
                              : typeof queueFlow?.ahead_of_you === 'number'
                                ? `ອີກ ${queueFlow.ahead_of_you} ຄິວ ຈຶ່ງຈະເຖິງຄິວຂອງທ່ານ`
                                : 'ຍັງບໍ່ມີຄິວຂອງທ່ານໃນລະບົບ'}
                    </p>
                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/25">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                queueFlow?.is_called
                                    ? 'bg-gradient-to-r from-[#ffe082] to-[#e8c547]'
                                    : 'bg-gradient-to-r from-white to-[#cfe0ff]'
                            }`}
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-5 min-w-0 rounded-xl border border-white/15 bg-white/5 p-4 sm:p-5">
                <p className="mb-3 text-sm font-semibold text-white/90 sm:text-base">ຄິວຖັດໄປ</p>
                {waitingRows.length > 0 ? (
                    <ul className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {waitingRows.map((row) => (
                            <li
                                key={row.id ?? row.queue_no}
                                className={`flex min-w-0 items-center gap-2.5 rounded-lg border px-3 py-2.5 sm:gap-3 sm:px-3.5 sm:py-3 ${
                                    row.is_vip
                                        ? 'border-amber-300/50 bg-amber-400/15'
                                        : 'border-white/20 bg-white/10'
                                }`}
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-black tabular-nums text-[#ffe082] sm:h-10 sm:w-10 sm:text-base">
                                    {row.position}
                                </span>
                                <span className="flex min-w-0 flex-1 items-center gap-1.5 text-base font-extrabold tabular-nums text-white sm:text-lg">
                                    {row.is_vip ? <span title="VIP">👑</span> : null}
                                    <span className="min-w-0 break-words">{formatQueueNoDisplay(row.queue_no)}</span>
                                </span>
                                <span className="shrink-0 text-xs text-white/80 sm:text-sm">{row.guest_count} ຄົນ</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <span className="text-sm text-white/70 sm:text-base">ຍັງບໍ່ມີຄິວຕໍ່ໄປ</span>
                )}
            </div>
        </section>
    );
}
