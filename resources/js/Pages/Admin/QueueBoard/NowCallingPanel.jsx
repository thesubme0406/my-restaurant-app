export default function NowCallingPanel({ nowCalling, nowServing }) {
    const queueNo = nowCalling?.queue_no ?? nowServing ?? '—';
    const animateKey = nowCalling?.id ? `${nowCalling.id}:${nowCalling.called_at ?? ''}` : 'empty';

    return (
        <section className="flex min-w-0 w-full max-w-full flex-col items-center justify-center rounded-3xl border-2 border-amber-400/40 bg-gradient-to-b from-[#0f2a52] to-[#0a1d3a] p-4 text-center shadow-[0_0_60px_rgba(251,191,36,0.12)] md:p-8 lg:col-span-3 lg:p-[4vh]">
            <p className="fluid-label font-bold uppercase tracking-[0.2em] text-amber-300">
                ກຳລັງເອີ້ນ / Now Calling
            </p>
            <p
                key={animateKey}
                className={`queue-board-hero fluid-queue-board-hero mt-4 font-black text-amber-300 drop-shadow-[0_4px_24px_rgba(251,191,36,0.45)] ${
                    nowCalling?.is_vip ? 'ring-2 ring-amber-200/40 rounded-2xl px-4 py-2' : ''
                }`}
            >
                {nowCalling?.is_vip ? <span className="mr-2 inline-block align-middle text-[0.65em]">👑</span> : null}
                {queueNo}
            </p>
            {nowCalling ? (
                <div className="mt-4 flex w-full min-w-0 max-w-full flex-col items-center gap-1 md:mt-6 md:flex-row md:flex-wrap md:justify-center md:gap-4">
                    <p className="fluid-body max-w-full break-words text-center font-bold text-white">
                        {nowCalling.customer_name}
                    </p>
                    <p className="fluid-body shrink-0 font-semibold text-white/80">
                        {nowCalling.guest_count} ຄົນ
                    </p>
                </div>
            ) : (
                <p className="fluid-body mt-4 break-words text-center font-medium text-white/50">
                    ຍັງບໍ່ມີຄິວທີ່ຖືກເອີ້ນ
                </p>
            )}
        </section>
    );
}
