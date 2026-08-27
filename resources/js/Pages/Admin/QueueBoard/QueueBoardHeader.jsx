export default function QueueBoardHeader({ boardDate, liveNow, formatClock }) {
    return (
        <header className="flex w-full min-w-0 max-w-full shrink-0 flex-col gap-4 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between md:p-8 lg:p-12">
            <div className="flex min-w-0 items-center gap-3 md:gap-4">
                <img
                    src="/images/oshinei-logo.png"
                    alt="OSHINEI"
                    className="h-12 w-12 shrink-0 rounded-full border-2 border-amber-400/60 bg-white object-cover md:h-16 md:w-16 lg:h-[8vh] lg:min-h-12 lg:w-[8vh] lg:min-w-12"
                />
                <div className="min-w-0">
                    <p className="fluid-label break-words font-semibold uppercase tracking-[0.25em] text-amber-300/90">
                        OSHINEI RESTAURANT
                    </p>
                    <h1 className="fluid-section-title break-words font-black text-white">ບອດຄິວໜ້າຮ້ານ</h1>
                </div>
            </div>
            <div className="min-w-0 text-left md:text-right">
                <p className="fluid-body break-words text-white/70">ວັນທີ {boardDate ?? '—'}</p>
                <p className="fluid-clock font-bold tabular-nums text-amber-300">{formatClock(liveNow)}</p>
            </div>
        </header>
    );
}
