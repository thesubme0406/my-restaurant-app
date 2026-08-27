import { AlertTriangle, Armchair } from 'lucide-react';

// ສີໂຕະແຜງຄິວ: available=ຫວ່າງ+ພ້ອມ, occupied=ມີບໍລິການຄ້າງຊຳລະ, maintenance=ໂຕະປິດ/ຊຳຮຸດ (readiness)
const statusConfig = {
    available: {
        label: 'ໂຕະວ່າງ (ພ້ອມນັ່ງ)',
        bar: 'bg-emerald-500',
        ring: 'ring-emerald-200/80',
        text: 'text-emerald-800',
        subtle: 'text-emerald-700/90',
    },
    occupied: {
        label: 'ໂຕະຖືກໃຊ້ງານ (ມີລູກຄ້າ)',
        bar: 'bg-rose-500',
        ring: 'ring-rose-200/80',
        text: 'text-rose-900',
        subtle: 'text-rose-800/90',
    },
    maintenance: {
        label: 'ປິດປັບປຸງ / ບໍ່ພ້ອມໃຊ້',
        bar: 'bg-slate-400',
        ring: 'ring-amber-200/80',
        text: 'text-slate-700',
        subtle: 'text-slate-600',
    },
};

export default function TableCard({ table, onClick }) {
    const cfg = statusConfig[table.status] ?? statusConfig.available;
    const vipZone = Boolean(table.is_vip_zone);

    return (
        <button
            type="button"
            onClick={() => onClick?.(table)}
            className={`group relative flex w-full cursor-pointer overflow-hidden rounded-2xl border bg-white text-left shadow-md ring-1 transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#194c9f] focus-visible:ring-offset-2 ${
                vipZone
                    ? 'border-amber-400/90 ring-2 ring-amber-300/80 shadow-amber-100/40'
                    : `border-slate-200/90 ring-transparent hover:ring-slate-200/60 ${cfg.ring}`
            }`}
        >
            <span
                className={`absolute inset-y-3 left-0 w-1.5 rounded-full ${cfg.bar}`}
                aria-hidden
            />
            <div className="flex flex-1 flex-col ps-5 pe-4 py-4">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className={`text-xs font-semibold uppercase tracking-wide ${cfg.subtle}`}>
                            ໂຕະ
                            {vipZone ? <span className="ms-1 inline-flex items-center gap-0.5 text-amber-700" title="VIP zone">👑</span> : null}
                        </p>
                        <p className={`mt-0.5 text-xl font-bold tracking-tight ${cfg.text}`}>
                            {table.table_no}
                        </p>
                    </div>
                    <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition group-hover:bg-white group-hover:shadow-sm ${cfg.text}`}
                    >
                        {table.status === 'maintenance' ? (
                            <AlertTriangle className="h-5 w-5 text-amber-600" strokeWidth={1.75} />
                        ) : (
                            <Armchair className="h-5 w-5" strokeWidth={1.75} />
                        )}
                    </div>
                </div>
                <p className="mt-3 text-sm font-medium text-slate-700">
                    {table.capacity} ບ່ອນນັ່ງ
                </p>
                <p className={`mt-2 text-xs font-semibold ${cfg.text}`}>{cfg.label}</p>
            </div>
        </button>
    );
}
