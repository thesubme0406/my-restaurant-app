import { Head, Link } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { formatAmount } from '@/utils/formatAmount';

// ລາຄາ: ຈຸດທສັນຍະເຊັ່ນ 1,000,000
function formatPriceDigits(price) {
    const n = Number(price);
    if (Number.isNaN(n)) {
        return '—';
    }
    return formatAmount(n);
}

function BuffetTierCard({ tier }) {
    return (
        <article
            className="relative aspect-[5/3] w-[min(88vw,340px)] shrink-0 snap-center overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/10"
            aria-label={`${tier.tier_name} buffet`}
        >
            {tier.image_url ? (
                <>
                    <img src={tier.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/70 to-black/90" aria-hidden />
                </>
            ) : (
                <>
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black" />
                    <div
                        className="absolute inset-0 opacity-[0.07]"
                        style={{
                            backgroundImage:
                                'repeating-linear-gradient(-45deg, #fff 0px, #fff 1px, transparent 1px, transparent 6px)',
                        }}
                        aria-hidden
                    />
                </>
            )}

            {/* Enso-style gold ring */}
            <div className="pointer-events-none absolute left-1/2 top-[52%] h-[min(58vw,220px)] w-[min(58vw,220px)] -translate-x-1/2 -translate-y-1/2 rounded-full border-[10px] border-[#c9a227]/35 border-t-[#e8c547]/50 shadow-[0_0_40px_rgba(232,197,71,0.12)]" />

            <div className="relative flex h-full flex-col items-center justify-between px-4 pb-5 pt-6 text-center">
                <div>
                    <p className="font-serif text-[11px] font-semibold uppercase tracking-[0.35em] text-white/95">Oshinei Buffet</p>
                    <p className="mt-0.5 text-xs font-semibold tracking-wide text-white/70">{tier.tier_name}</p>
                </div>

                <div className="flex flex-wrap items-baseline justify-center gap-x-1 gap-y-0">
                    <span className="text-[clamp(2.25rem,10vw,3.25rem)] font-black leading-none tracking-tight text-[#e8c547] drop-shadow-sm">
                        {formatPriceDigits(tier.price)}
                    </span>
                    <span className="text-sm font-bold text-white/90">ກີບ</span>
                </div>
            </div>

            {/* Vertical katakana + BUFFET (design reference) */}
            <div
                className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1.5 text-white/75"
                aria-hidden
            >
                <span
                    className="select-none font-sans text-[11px] font-medium tracking-[0.15em] text-white/85"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                    ビュッフェ
                </span>
                <span className="font-serif text-[7px] font-semibold uppercase tracking-[0.2em] text-white/50">Buffet</span>
            </div>
        </article>
    );
}

export default function CustomerHomePage({ buffetTiersWithMenus = [] }) {
    const [queueCount] = useState('023');

    const promoBanners = [
        'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1615361200141-f45040f367be?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&w=1200&q=80',
    ];

    return (
        <CustomerLayout>
            <Head title="Oshinei First Page" />

            <div className="space-y-4">
                <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="relative h-52">
                        <img
                            src="https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=1400&q=80"
                            alt="Oshinei premium Japanese food"
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-base font-bold text-white">
                                ຄິວລໍຖ້າປັດຈຸບັນ <span className="text-2xl text-[#7db7ff]">{queueCount}</span> ຄິວ
                            </p>
                            <Link
                                href={route('customer.reserve')}
                                className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-[#194c9f] px-4 py-2.5 text-lg font-bold text-white"
                            >
                                ຈອງຄິວ
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <h2 className="text-2xl font-extrabold text-slate-900">ເມນູບຸບເຟ່</h2>
                        <Link
                            href={route('customer.menu')}
                            className="inline-flex shrink-0 items-center gap-0.5 text-sm font-bold text-[#194c9f]"
                        >
                            ເບິ່ງທັງໝົດ
                            <span aria-hidden className="text-xs font-black">
                                {'>>'}
                            </span>
                        </Link>
                    </div>
                    {buffetTiersWithMenus.length === 0 ? (
                        <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-slate-600">ຍັງບໍ່ມີຂໍ້ມູນປະເພດບຸບເຟ່.</p>
                    ) : (
                        <div
                            className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 pt-0.5 [scrollbar-width:thin]"
                            style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                            {buffetTiersWithMenus.map((tier) => (
                                <BuffetTierCard key={tier.id} tier={tier} />
                            ))}
                        </div>
                    )}
                </section>

                <section className="rounded-2xl bg-white p-3 shadow-sm">
                    <h2 className="mb-2 inline-flex rounded-md bg-[#194c9f] px-3 py-1.5 text-sm font-bold text-white">ໂປຣໂມຊັ່ນ ແລະ ແຈ້ງການ</h2>
                    <div className="relative">
                        <button className="promo-prev absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-[#194c9f] shadow">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button className="promo-next absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-[#194c9f] shadow">
                            <ChevronRight className="h-4 w-4" />
                        </button>

                        <Swiper
                            modules={[Navigation, Pagination, Autoplay]}
                            navigation={{ prevEl: '.promo-prev', nextEl: '.promo-next' }}
                            pagination={{ clickable: true }}
                            autoplay={{ delay: 3200 }}
                            loop
                        >
                            {promoBanners.map((img, idx) => (
                                <SwiperSlide key={`promo-${idx}`}>
                                    <Link
                                        href={route('customer.news')}
                                        className="block h-36 overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#194c9f] focus-visible:ring-offset-2"
                                    >
                                        <img src={img} alt={`Promotion ${idx + 1}`} className="h-full w-full object-cover" />
                                    </Link>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                    <div className="mt-3 text-center">
                        <Link
                            href={route('customer.news')}
                            className="inline-flex rounded-lg border border-[#194c9f] px-4 py-1.5 text-sm font-semibold text-[#194c9f] hover:bg-[#194c9f]/5"
                        >
                            ລາຍລະອຽດເພີ່ມເຕີມ
                        </Link>
                    </div>
                </section>

                <section className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h3 className="text-5xl font-extrabold leading-none text-[#194c9f]">ຈອງກ່ອນ</h3>
                            <h3 className="text-5xl font-extrabold leading-none text-[#194c9f]">ແຊບກ່ອນ</h3>
                            <p className="mt-2 text-sm text-slate-600">ສະແກນຈອງຄິວໄວ້ລ່ວງໜ້າໄດ້ທຸກມື້</p>
                        </div>
                        <Link href={route('customer.reserve')} className="rounded-lg bg-[#194c9f] px-5 py-2.5 text-lg font-bold text-white">
                            ຈອງຄິວ
                        </Link>
                    </div>
                </section>
            </div>
        </CustomerLayout>
    );
}

