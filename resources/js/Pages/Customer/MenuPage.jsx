import { Head, Link } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { ChevronRight } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const brandBlue = '#194c9f';
const goldCard = '#e8c547';

function formatKipPerPerson(price) {
    const n = Number(price);
    if (Number.isNaN(n)) {
        return '—';
    }
    const formatted = Number.isInteger(n)
        ? n.toLocaleString('en-US')
        : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formatted} ກີບ/ຄົນ`;
}

export default function MenuPage({
    buffetTiers = [],
    initialTierId = null,
    buffetTimeLimitHours = 2,
}) {
    const [selectedTierId, setSelectedTierId] = useState(() => initialTierId ?? buffetTiers[0]?.id ?? null);
    const tabBtnRefs = useRef({});

    useEffect(() => {
        if (buffetTiers.length === 0) {
            return;
        }
        setSelectedTierId((prev) => {
            const inList = (id) => id != null && buffetTiers.some((t) => Number(t.id) === Number(id));
            if (inList(prev)) {
                return Number(prev);
            }
            if (initialTierId != null && inList(initialTierId)) {
                return Number(initialTierId);
            }
            return Number(buffetTiers[0].id);
        });
    }, [initialTierId, buffetTiers]);

    useLayoutEffect(() => {
        const id = selectedTierId;
        if (id == null) {
            return;
        }
        const el = tabBtnRefs.current[id];
        el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [selectedTierId, buffetTiers]);

    const selectedTier = useMemo(
        () => buffetTiers.find((t) => Number(t.id) === Number(selectedTierId)) ?? null,
        [buffetTiers, selectedTierId]
    );

    const menuBadgeLabel = selectedTier
        ? selectedTier.menu_count >= 20
            ? '20+ ເມນູ'
            : `${selectedTier.menu_count}+ ເມນູ`
        : '';

    return (
        <CustomerLayout>
            <Head title="ເມນູບຸບເຟ່" />

            <div className="space-y-0 pb-8">
                {/* Hero (navy) */}
                <section className="relative overflow-hidden bg-[#0f2d5c] px-4 pb-6 pt-5 text-white">
                    <div className="pointer-events-none absolute -right-8 top-0 h-40 w-40 rounded-full bg-white/5" aria-hidden />
                    <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-white/5" aria-hidden />
                    <p className="text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-white/50">Customer Menu</p>
                    <h1 className="mt-2 text-center text-2xl font-extrabold leading-tight tracking-tight">
                        ເມນູ ບຸບເຟ່ ອາຫານຍີ່ປຸ່ນ
                    </h1>
                    <p className="mx-auto mt-3 max-w-md text-center text-xs leading-relaxed text-white/85">
                        ເລືອກແພັກເກັດລາຄາທີ່ເໝາະກັບທ່ານ ແລະ ສຳຜັດຄວາມອົບອຸ່ນຂອງບຸບເຟ່ຍີ່ປຸ່ນແບບບຸບເຟ່ບໍ່ຈຳກັດພາຍໃນເວລາ 2–3 ຊົ່ວໂມງ.
                    </p>
                </section>

                {/* Tier tabs — every tier from DB; horizontal scroll for 4+ packages */}
                {buffetTiers.length > 0 ? (
                    <div className="-mt-1 bg-white px-0 pb-1 pt-3 shadow-sm">
                        <div className="relative mx-auto max-w-lg">
                            <div
                                className="pointer-events-none absolute inset-y-1 left-0 z-[1] w-8 bg-gradient-to-r from-white to-transparent"
                                aria-hidden
                            />
                            <div
                                className="pointer-events-none absolute inset-y-1 right-0 z-[1] w-8 bg-gradient-to-l from-white to-transparent"
                                aria-hidden
                            />
                            <div
                                className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-pb-1 scroll-pl-3 scroll-pr-3 px-3 pb-2 pt-1 [-webkit-overflow-scrolling:touch]"
                                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(148,163,184,0.85) transparent' }}
                            >
                                {buffetTiers.map((tier) => {
                                    const active = Number(tier.id) === Number(selectedTierId);
                                    const formatted = Number.isInteger(Number(tier.price))
                                        ? Number(tier.price).toLocaleString('en-US')
                                        : Number(tier.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                                    return (
                                        <button
                                            key={tier.id}
                                            ref={(el) => {
                                                tabBtnRefs.current[tier.id] = el;
                                            }}
                                            type="button"
                                            onClick={() => setSelectedTierId(Number(tier.id))}
                                            className={`shrink-0 snap-center rounded-2xl border-2 px-3 py-2.5 text-left shadow-sm transition sm:min-w-[10.5rem] sm:max-w-[13.5rem] ${
                                                active
                                                    ? 'border-[#194c9f] bg-[#194c9f] text-white shadow-md shadow-[#194c9f]/25'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:border-[#194c9f]/40 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span
                                                className={`block text-[11px] font-bold leading-snug sm:text-xs ${active ? 'text-white' : 'text-slate-900'} line-clamp-2 break-words`}
                                            >
                                                {tier.tier_name}
                                            </span>
                                            <span
                                                className={`mt-1 flex items-center gap-0.5 text-[10px] font-semibold sm:text-[11px] ${active ? 'text-white/90' : 'text-slate-500'}`}
                                            >
                                                {formatted} ກີບ
                                                <ChevronRight className={`h-3 w-3 shrink-0 opacity-70 ${active ? 'text-white' : 'text-slate-400'}`} aria-hidden />
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <p className="mx-auto max-w-lg px-4 pb-1 text-center text-[10px] font-medium leading-relaxed text-slate-500">
                            ມີທັງໝົດ <span className="font-bold text-[#194c9f]">{buffetTiers.length}</span> ແພັກເກັດ · ເລື່ອນແນວນອນເພື່ອເບິ່ງທັງໝົດ
                        </p>
                    </div>
                ) : null}

                {/* Summary card */}
                {selectedTier ? (
                    <div className="bg-slate-50 px-3 pb-4 pt-3">
                        <div
                            className="mx-auto max-w-md overflow-hidden rounded-2xl px-4 py-4 shadow-md"
                            style={{ backgroundColor: goldCard }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg font-extrabold text-slate-900">{selectedTier.tier_name}</h2>
                                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-800/90">
                                        {selectedTier.description || 'ເມນູຄັດສັນສຳລັບແພັກເກັດນີ້ — ກິນໄດ້ບໍ່ຈຳກັດຕາມເວລາທີ່ກຳນົດ.'}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="inline-flex rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-slate-800 shadow-sm">
                                            {menuBadgeLabel}
                                        </span>
                                        <span className="inline-flex rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-slate-800 shadow-sm">
                                            {buffetTimeLimitHours} ຊົ່ວໂມງ
                                        </span>
                                    </div>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-lg font-black leading-none text-slate-900">{formatKipPerPerson(selectedTier.price)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="px-4 py-8 text-center text-sm text-slate-600">ຍັງບໍ່ມີຂໍ້ມູນແພັກເກັດບຸບເຟ່.</div>
                )}

                {/* Categories + grid */}
                {selectedTier && selectedTier.categories?.length > 0 ? (
                    <div className="space-y-8 bg-white px-3 pb-10 pt-6">
                        {selectedTier.categories.map((cat) => (
                            <section key={cat.category_id} className="mx-auto max-w-md">
                                <p className="mb-4 text-center text-[11px] font-bold tracking-wide text-slate-500">
                                    ——— {cat.category_name}
                                    {cat.category_name_en ? (
                                        <>
                                            {' '}
                                            <span className="text-slate-400">/</span> {cat.category_name_en}
                                        </>
                                    ) : null}{' '}
                                    ———
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {cat.items.map((item) => (
                                        <article
                                            key={item.id}
                                            className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50/80 shadow-sm"
                                        >
                                            <div className="aspect-square w-full overflow-hidden bg-slate-200">
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url}
                                                        alt=""
                                                        loading="lazy"
                                                        decoding="async"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-[9px] font-bold text-slate-400">
                                                        OSHINEI
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-1.5">
                                                <p className="line-clamp-3 text-center text-[10px] font-bold leading-snug text-slate-900">
                                                    {item.name}
                                                    {item.name_en ? (
                                                        <>
                                                            <span className="font-normal text-slate-500"> / </span>
                                                            <span className="font-semibold uppercase tracking-tight text-slate-700">{item.name_en}</span>
                                                        </>
                                                    ) : null}
                                                </p>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : selectedTier ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-600">ຍັງບໍ່ມີເມນູສຳລັບແພັກເກັດນີ້.</p>
                ) : null}

                <div className="px-4 pt-2 text-center">
                    <Link href={route('customer.home')} className="text-sm font-bold" style={{ color: brandBlue }}>
                        ← ກັບໜ້າຫຼັກ
                    </Link>
                </div>
            </div>
        </CustomerLayout>
    );
}
