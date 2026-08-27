function formatHistoryLabel(row) {
    const queue = row?.queue_no ?? '—';
    const table = row?.table_no;
    if (table && String(table).trim() !== '' && table !== '—') {
        return `${queue} → ${table}`;
    }
    return queue;
}

export default function CallingHistoryPanel({ callingHistory = [] }) {
    return (
        <section className="flex min-w-0 w-full max-w-full flex-col rounded-3xl border border-white/10 bg-[#0c1f3d] p-4 md:p-6 lg:col-span-2 lg:p-[3vh]">
            <p className="fluid-label mb-4 break-words text-center font-bold uppercase tracking-widest text-amber-200/90">
                ຄິວທີ່ເອີ້ນແລ້ວ / Called
            </p>
            {callingHistory.length === 0 ? (
                <p className="fluid-body flex flex-1 items-center justify-center break-words text-center text-white/40">
                    ຍັງບໍ່ມີຄິວອື່ນທີ່ຖືກເອີ້ນ
                </p>
            ) : (
                <ul className="flex flex-1 flex-col gap-2 md:gap-3">
                    {callingHistory.map((row, index) => (
                        <li
                            key={row.id ?? `${row.queue_no}-${index}`}
                            className={`min-w-0 rounded-2xl border p-3 md:p-4 ${
                                row.is_vip
                                    ? 'border-amber-300/50 bg-gradient-to-r from-amber-500/20 to-amber-400/5'
                                    : 'border-amber-400/25 bg-amber-400/10'
                            }`}
                        >
                            <p className="fluid-queue-card-hero flex flex-wrap items-center gap-2 break-words font-black tracking-wide text-amber-200">
                                {row.is_vip ? <span title="VIP">👑</span> : null}
                                <span>{formatHistoryLabel(row)}</span>
                            </p>
                            <p className="fluid-body mt-1 break-words text-white/70">{row.customer_name}</p>
                            <p className="fluid-label font-semibold text-white/50">{row.guest_count} ຄົນ</p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
