export default function UpNextPanel({ waitingRows }) {
    return (
        <section className="flex min-w-0 w-full max-w-full flex-col rounded-3xl border border-white/10 bg-[#0c1f3d] p-4 md:p-6 lg:col-span-5 lg:p-[3vh]">
            <p className="fluid-label mb-4 break-words text-center font-bold uppercase tracking-widest text-amber-200/90">
                ຄິວຖັດໄປ / Up Next
            </p>
            {waitingRows.length === 0 ? (
                <p className="fluid-body flex flex-1 items-center justify-center break-words text-center text-white/40">
                    ບໍ່ມີຄິວລໍຖ້າ
                </p>
            ) : (
                <ul className="grid min-w-0 grid-cols-1 gap-2 md:grid-cols-2 lg:flex lg:flex-col lg:gap-3">
                    {waitingRows.map((row) => (
                        <li
                            key={row.id ?? row.queue_no}
                            className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 md:p-4 ${
                                row.is_vip
                                    ? 'border-amber-400/40 bg-amber-400/15'
                                    : 'border-white/10 bg-white/5'
                            }`}
                        >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-base font-black text-amber-300 md:h-12 md:w-12 md:text-lg">
                                {row.position}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="fluid-queue-card-hero flex flex-wrap items-center gap-2 break-words font-black text-white">
                                    {row.is_vip ? <span title="VIP queue">👑</span> : null}
                                    <span>{row.queue_no}</span>
                                </p>
                                <p className="fluid-body break-words text-white/70">{row.customer_name}</p>
                            </div>
                            <span className="fluid-body shrink-0 font-semibold text-amber-200/90">
                                {row.guest_count} ຄົນ
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
