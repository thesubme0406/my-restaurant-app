import { Head, Link } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { ChevronRight } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { formatAmount } from '@/utils/formatAmount';

// ສີຟ້າ OSHINEI (#194c9f) ກົງກັບ admin constants
const brandBlue = '#194c9f';
const goldCard = '#e8c547';

function formatKipPerPerson(price) {
    const n = Number(price);
    if (Number.isNaN(n)) {
        return '—';
    }
    return `${formatAmount(n)} ກີບ/ຄົນ`;
}

export default function MenuPage({
    buffetTiers = [],
    initialTierId = null,
    buffetTimeLimitHours = 2,
}) {
    const [selectedTierId, setSelectedTierId] = useState(() => initialTierId ?? buffetTiers[0]?.id ?? null);
    const tabScrollRef = useRef(null);
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
        const scroller = tabScrollRef.current;
        if (id == null || !scroller || buffetTiers.length === 0) {
            return;
        }

        const el = tabBtnRefs.current[id];
        if (!el) {
            return;
        }

        const firstId = Number(buffetTiers[0]?.id);
        const lastId = Number(buffetTiers[buffetTiers.length - 1]?.id);
        const selected = Number(id);

        if (selected === firstId) {
            scroller.scrollTo({ left: 0, behavior: 'smooth' });
            return;
        }

        if (selected === lastId) {
            scroller.scrollTo({ left: scroller.scrollWidth, behavior: 'smooth' });
            return;
        }

        el.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
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

    const tierTabGrid = buffetTiers.length <= 4;

    return (
        <CustomerLayout>
            <Head title="ເມນູບຸບເຟ່" />

            <div className="customer-page space-y-4 pb-6 sm:space-y-5 md:space-y-6 lg:space-y-7">
                {/* Hero (navy) */}
                <section className="relative overflow-hidden rounded-2xl bg-[#0f2d5c] px-4 pb-5 pt-4 text-white shadow-xl sm:px-6 sm:pb-6 sm:pt-5 md:px-8 md:pb-7 md:pt-6">
                    <div className="pointer-events-none absolute -right-8 top-0 h-40 w-40 rounded-full bg-white/5" aria-hidden />
                    <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-white/5" aria-hidden />
                    <p className="text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-white/50">Customer Menu</p>
                    <h1 className="mt-2 text-center text-xl font-extrabold leading-tight tracking-tight sm:text-2xl lg:text-3xl">
                        ເມນູ ບຸບເຟ່ ອາຫານຍີ່ປຸ່ນ
                    </h1>
                    <p className="mx-auto mt-3 max-w-4xl text-center text-xs leading-relaxed text-white/85 lg:text-sm">
                        ເລືອກແພັກເກັດລາຄາທີ່ເໝາະກັບທ່ານ ແລະ ສຳຜັດຄວາມອົບອຸ່ນຂອງບຸບເຟ່ຍີ່ປຸ່ນແບບບຸບເຟ່ບໍ່ຈຳກັດພາຍໃນເວລາ 2–3 ຊົ່ວໂມງ.
                    </p>
                </section>

                {/* Tier tabs — every tier from DB; horizontal scroll for 4+ packages */}
                {buffetTiers.length > 0 ? (
                    <section className="rounded-2xl border border-slate-200 bg-white px-0 pb-2 pt-3 shadow-sm sm:px-2 md:px-3">
                        <div className="relative w-full">
                            {!tierTabGrid ? (
                                <>
                                    <div
                                        className="pointer-events-none absolute inset-y-1 left-0 z-[1] w-6 bg-gradient-to-r from-white to-transparent sm:w-8"
                                        aria-hidden
                                    />
                                    <div
                                        className="pointer-events-none absolute inset-y-1 right-0 z-[1] w-6 bg-gradient-to-l from-white to-transparent sm:w-8"
                                        aria-hidden
                                    />
                                </>
                            ) : null}
                            <div
                                ref={tabScrollRef}
                                className={`w-full min-w-0 pb-2 pt-1 ${
                                    tierTabGrid
                                        ? 'grid grid-cols-2 gap-2 px-3 sm:grid-cols-4 sm:gap-2.5 sm:px-4'
                                        : 'flex snap-x snap-mandatory justify-start gap-2 overflow-x-auto overscroll-x-contain scroll-pb-1 px-3 [-webkit-overflow-scrolling:touch] sm:px-4'
                                }`}
                                style={tierTabGrid ? undefined : { scrollbarWidth: 'thin', scrollbarColor: 'rgba(148,163,184,0.85) transparent' }}
                            >
                                {buffetTiers.map((tier) => {
                                    const active = Number(tier.id) === Number(selectedTierId);
                                    const formatted = formatAmount(tier.price);
                                    return (
                                        <button
                                            key={tier.id}
                                            ref={(el) => {
                                                tabBtnRefs.current[tier.id] = el;
                                            }}
                                            type="button"
                                            onClick={() => setSelectedTierId(Number(tier.id))}
                                            className={`rounded-2xl border-2 px-3 py-2.5 text-left shadow-sm transition ${
                                                tierTabGrid
                                                    ? 'w-full min-w-0'
                                                    : 'shrink-0 snap-start scroll-ml-3 first:scroll-ml-0 min-w-[8.25rem] max-w-[10.5rem] sm:min-w-[10.5rem] sm:max-w-[12rem]'
                                            } ${
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
                        {!tierTabGrid ? (
                            <p className="w-full px-3 pb-1 text-center text-[10px] font-medium leading-relaxed text-slate-500 sm:px-4 sm:text-xs">
                                ມີທັງໝົດ <span className="font-bold text-[#194c9f]">{buffetTiers.length}</span> ແພັກເກັດ · ເລື່ອນແນວນອນເພື່ອເບິ່ງທັງໝົດ
                            </p>
                        ) : null}
                    </section>
                ) : null}

                {/* Summary card */}
                {selectedTier ? (
                    <section className="rounded-2xl bg-slate-50 p-2.5 sm:p-3 md:p-4">
                        <div
                            className="w-full overflow-hidden rounded-2xl px-4 py-4 shadow-md sm:px-5 sm:py-4 md:px-6 md:py-5"
                            style={{ backgroundColor: goldCard }}
                        >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-base font-extrabold text-slate-900 sm:text-lg md:text-xl">{selectedTier.tier_name}</h2>
                                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-800/90 sm:text-sm">
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
                                <div className="shrink-0 rounded-xl bg-white/80 px-4 py-2.5 text-left shadow-sm sm:min-w-[160px] sm:text-right md:min-w-[180px]">
                                    <p className="text-[11px] font-bold tracking-wide text-slate-500">ລາຄາ</p>
                                    <p className="mt-1 text-base font-black leading-none text-slate-900 sm:text-lg md:text-xl">{formatKipPerPerson(selectedTier.price)}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                ) : (
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
                        ຍັງບໍ່ມີຂໍ້ມູນແພັກເກັດບຸບເຟ່.
                    </div>
                )}

                {/* Categories + grid */}
                {selectedTier && selectedTier.categories?.length > 0 ? (
                    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white px-3 pb-5 pt-4 shadow-sm sm:space-y-6 sm:px-4 sm:pb-6 sm:pt-5 md:px-5 md:pb-8 md:pt-6">
                        {selectedTier.categories.map((cat) => (
                            <section key={cat.category_id}>
                                <p className="mb-3 px-1 text-center text-[10px] font-bold tracking-wide text-slate-500 sm:mb-4 sm:text-[11px] md:text-xs">
                                    ——— {cat.category_name}
                                    {cat.category_name_en ? (
                                        <>
                                            {' '}
                                            <span className="text-slate-400">/</span> {cat.category_name_en}
                                        </>
                                    ) : null}{' '}
                                    ———
                                </p>
                                <div className="customer-menu-grid">
                                    {cat.items.map((item) => (
                                        <article
                                            key={item.id}
                                            className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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
                                            <div className="p-2 sm:p-2.5">
                                                <p className="line-clamp-3 text-center text-[10px] font-bold leading-snug text-slate-900 sm:text-[11px] md:text-xs">
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
                    <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
                        ຍັງບໍ່ມີເມນູສຳລັບແພັກເກັດນີ້.
                    </p>
                ) : null}

                <div className="pt-1 text-center">
                    <Link href={route('customer.home')} className="text-xs font-bold sm:text-sm" style={{ color: brandBlue }}>
                        ← ກັບໜ້າຫຼັກ
                    </Link>
                </div>
            </div>
        </CustomerLayout>
    );
}
