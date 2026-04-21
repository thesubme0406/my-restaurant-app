import { Armchair } from 'lucide-react';

const statusConfig = {
    available: {
        label: 'ໂຕະວ່າງ',
        bar: 'bg-emerald-500',
        ring: 'ring-emerald-200/80',
        text: 'text-emerald-800',
        subtle: 'text-emerald-700/90',
    },
    occupied: {
        label: 'ໂຕະຖືກໃຊ້ງານ',
        bar: 'bg-rose-500',
        ring: 'ring-rose-200/80',
        text: 'text-rose-900',
        subtle: 'text-rose-800/90',
    },
    maintenance: {
        label: 'ກຳລັງປັບປຸງ/ອື່ນໆ',
        bar: 'bg-slate-400',
        ring: 'ring-slate-200/80',
        text: 'text-slate-700',
        subtle: 'text-slate-600',
    },
};

export default function TableCard({ table, onClick }) {
    const cfg = statusConfig[table.status] ?? statusConfig.available;

    return (
        <button
            type="button"
            onClick={() => onClick?.(table)}
            className={`group relative flex w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-left shadow-md ring-1 ring-transparent transition-all duration-200 hover:scale-105 hover:shadow-lg hover:ring-slate-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#194c9f] focus-visible:ring-offset-2 ${cfg.ring}`}
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
                        </p>
                        <p className={`mt-0.5 text-xl font-bold tracking-tight ${cfg.text}`}>
                            {table.table_no}
                        </p>
                    </div>
                    <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition group-hover:bg-white group-hover:shadow-sm ${cfg.text}`}
                    >
                        <Armchair className="h-5 w-5" strokeWidth={1.75} />
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
