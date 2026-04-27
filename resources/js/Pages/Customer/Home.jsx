import { Head, Link, usePage } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { formatAmount } from '@/utils/formatAmount';

// ຈັດຮູບແບບລາຄາໃຫ້ອ່ານງ່າຍ
function formatPriceDigits(price) {
    const n = Number(price);
    if (Number.isNaN(n)) {
        return '—';
    }
    return formatAmount(n);
}

function BuffetTierCard({ tier }) {
    return (
        <Link
            href={`${route('customer.menu')}?tier=${encodeURIComponent(String(tier.id))}`}
            className="group relative aspect-[5/3] w-[min(88vw,340px)] shrink-0 snap-center overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#194c9f] focus-visible:ring-offset-2 lg:w-[360px]"
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
        </Link>
    );
}

export default function CustomerHomePage({
    buffetTiersWithMenus = [],
    waitingQueueCount = 0,
    currentDateTime = '',
}) {
    const { auth } = usePage().props;
    const isAuthenticated = Boolean(auth?.user);
    const [loginPromptOpen, setLoginPromptOpen] = useState(false);
    const [redirectAfterLogin, setRedirectAfterLogin] = useState(route('customer.home'));
    const [liveNow, setLiveNow] = useState(() => {
        const parsed = currentDateTime ? new Date(currentDateTime) : new Date();
        return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    });

    const promoBanners = [
        'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1615361200141-f45040f367be?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&w=1200&q=80',
    ];

    const promptLoginForBooking = () => {
        if (isAuthenticated) {
            window.location.href = route('customer.reserve');
            return;
        }
        setRedirectAfterLogin(`${window.location.pathname}${window.location.search}`);
        setLoginPromptOpen(true);
    };

    const loginHref = `${route('login')}?redirect_to=${encodeURIComponent(redirectAfterLogin)}`;

    useEffect(() => {
        const timer = window.setInterval(() => {
            setLiveNow(new Date());
        }, 1000);

        return () => window.clearInterval(timer);
    }, []);

    const nowLabel = useMemo(() => {
        if (!liveNow || Number.isNaN(liveNow.getTime())) {
            return '';
        }
        return liveNow.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }, [liveNow]);

    return (
        <CustomerLayout>
            <Head title="Oshinei First Page" />

            <div className="relative isolate space-y-6 py-2 lg:space-y-10 lg:py-6">
                {/* ພື້ນຫຼັງລາຍບາງໆ ແຕ່ເຫັນໄດ້ຊັດ */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 rounded-3xl"
                    style={{
                        background:
                            'linear-gradient(180deg, rgba(25,76,159,0.08) 0%, rgba(25,76,159,0.02) 50%, rgba(25,76,159,0.08) 100%)',
                    }}
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 rounded-3xl opacity-[0.12]"
                    style={{
                        backgroundImage: "url('/images/sushi.png')",
                        backgroundRepeat: 'repeat',
                        backgroundSize: '190px',
                        backgroundPosition: 'center',
                    }}
                />
                <section className="relative overflow-hidden rounded-2xl bg-white/95 shadow-md ring-1 ring-[#194c9f]/10">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-[0.08]"
                        style={{
                            backgroundImage:
                                "radial-gradient(circle at 12% 18%, rgba(25,76,159,0.18) 0, rgba(25,76,159,0.18) 2px, transparent 2px), radial-gradient(circle at 84% 82%, rgba(25,76,159,0.14) 0, rgba(25,76,159,0.14) 2px, transparent 2px)",
                            backgroundSize: '34px 34px, 38px 38px',
                        }}
                    />
                    <div className="relative h-64 lg:h-[500px]">
                        <img
                            src="/images/foodshowing.jpg?v=1"
                            alt="Oshinei premium Japanese food"
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0">
                            {/* ແຖບ glass ໂປ່ງໃສຄຸມຕະຫຼອດຂອບລຸ່ມຂອງຮູບ */}
                            <div className="flex items-center justify-between gap-3 rounded-b-2xl border-t border-white/35 bg-white/20 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3 lg:px-6 lg:py-3.5">
                                <div>
                                    <p className="text-base font-extrabold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.55)] lg:text-2xl">
                                        ຄິວລໍຖ້າປັດຈຸບັນ{' '}
                                        <span className="text-3xl text-[#7dc6ff] lg:text-5xl">{String(waitingQueueCount).padStart(3, '0')}</span>{' '}
                                        ຄິວ
                                    </p>
                                    {nowLabel ? (
                                        <p className="mt-1 text-xs font-semibold text-white/90 lg:text-sm">
                                            ອັບເດດລ່າສຸດ: {nowLabel}
                                        </p>
                                    ) : null}
                                    <Link
                                        href={route('customer.reserve')}
                                        className="mt-1 inline-block text-xs font-semibold text-white underline decoration-white/80 underline-offset-2 transition hover:text-[#cfe4ff] lg:text-sm"
                                    >
                                        ເບິ່ງລາຍລະອຽດເພີ່ມເຕີມ
                                    </Link>
                                </div>
                                <button
                                    type="button"
                                    onClick={promptLoginForBooking}
                                    className="inline-flex h-10 min-w-[118px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[#2a63bb] to-[#174896] px-4 text-2xl font-extrabold leading-none text-white shadow-[0_10px_24px_rgba(25,76,159,0.42)] ring-1 ring-white/35 transition hover:-translate-y-0.5 hover:brightness-105 sm:h-11 sm:min-w-[130px] sm:px-5 sm:text-[2rem]"
                                >
                                    ຈອງຄິວ
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-[#eef5ff] p-4 shadow-xl ring-1 ring-[#194c9f]/15 lg:p-6">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.1]"
                        style={{
                            backgroundImage:
                                "linear-gradient(135deg, rgba(25,76,159,0.12) 0, rgba(25,76,159,0.12) 1px, transparent 1px, transparent 18px)",
                            backgroundSize: '18px 18px',
                        }}
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -left-8 top-6 h-24 w-24 rounded-full bg-[#194c9f]/10 blur-2xl"
                    />
                    <div className="relative z-10 mb-5 flex items-center justify-between gap-3">
                        <div>
                            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#194c9f]/70">Oshinei Signature</p>
                            <h2 className="text-2xl font-extrabold text-[#194c9f] lg:text-3xl">ເມນູບຸບເຟ່</h2>
                        </div>
                        <Link
                            href={route('customer.menu')}
                            className="inline-flex h-10 shrink-0 items-center rounded-xl bg-gradient-to-b from-[#2a63bb] to-[#174896] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(25,76,159,0.35)] ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:brightness-105"
                        >
                            ເບິ່ງທັງໝົດ
                            <span aria-hidden className="ml-1 text-xs font-black">
                                {'>>'}
                            </span>
                        </Link>
                    </div>
                    {buffetTiersWithMenus.length === 0 ? (
                        <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-slate-600">ຍັງບໍ່ມີຂໍ້ມູນປະເພດບຸບເຟ່.</p>
                    ) : (
                        <div className="relative">
                            <div
                                className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-8 bg-gradient-to-r from-white via-white/90 to-transparent"
                                aria-hidden
                            />
                            <div
                                className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-8 bg-gradient-to-l from-white via-white/90 to-transparent"
                                aria-hidden
                            />
                            <div
                                className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-2 pb-2 pt-0.5 [scrollbar-width:thin] lg:gap-4 lg:px-3"
                                style={{ WebkitOverflowScrolling: 'touch' }}
                            >
                                {buffetTiersWithMenus.map((tier) => (
                                    <BuffetTierCard key={tier.id} tier={tier} />
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                <section className="relative overflow-hidden rounded-2xl bg-white/95 p-4 shadow-md ring-1 ring-[#194c9f]/10 lg:p-6 lg:py-12">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.08]"
                        style={{
                            backgroundImage:
                                "radial-gradient(circle at 8px 8px, rgba(25,76,159,0.2) 1.2px, transparent 1.2px)",
                            backgroundSize: '20px 20px',
                        }}
                    />
                    <h2 className="mb-4 text-xl font-extrabold tracking-tight text-[#194c9f] lg:text-2xl">
                        ໂປຣໂມຊັ່ນ ແລະ ແຈ້ງການ
                    </h2>
                    <div className="relative">
                        <button className="promo-prev absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-gradient-to-b from-white to-[#e9f1ff] p-2 text-[#194c9f] shadow-[0_10px_24px_rgba(25,76,159,0.25)] ring-1 ring-[#194c9f]/25 transition hover:scale-105">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button className="promo-next absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-gradient-to-b from-white to-[#e9f1ff] p-2 text-[#194c9f] shadow-[0_10px_24px_rgba(25,76,159,0.25)] ring-1 ring-[#194c9f]/25 transition hover:scale-105">
                            <ChevronRight className="h-5 w-5" />
                        </button>

                        <Swiper
                            modules={[Navigation, Pagination, Autoplay]}
                            navigation={{ prevEl: '.promo-prev', nextEl: '.promo-next' }}
                            pagination={{ clickable: true }}
                            autoplay={{ delay: 3200 }}
                            loop
                            className="[&_.swiper-pagination-bullet]:h-2 [&_.swiper-pagination-bullet]:w-2 [&_.swiper-pagination-bullet]:bg-white/80 [&_.swiper-pagination-bullet-active]:bg-[#194c9f]"
                        >
                            {promoBanners.map((img, idx) => (
                                <SwiperSlide key={`promo-${idx}`}>
                                    <Link
                                        href={route('customer.news')}
                                        className="block h-52 min-h-[360px] overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#194c9f] focus-visible:ring-offset-2 lg:min-h-[480px]"
                                    >
                                        <img src={img} alt={`Promotion ${idx + 1}`} className="h-full w-full object-cover object-center" />
                                    </Link>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                    <div className="mt-3 text-center">
                        <Link
                            href={route('customer.news')}
                            className="inline-flex rounded-xl bg-gradient-to-b from-[#2a63bb] to-[#174896] px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(25,76,159,0.3)] ring-1 ring-white/35 transition hover:-translate-y-0.5 hover:brightness-105"
                        >
                            ລາຍລະອຽດເພີ່ມເຕີມ
                        </Link>
                    </div>
                </section>

                <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-white via-white to-[#edf4ff] p-4 shadow-xl ring-1 ring-[#194c9f]/15 lg:p-7">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.12]"
                        style={{
                            backgroundImage:
                                "repeating-linear-gradient(-35deg, rgba(25,76,159,0.16) 0, rgba(25,76,159,0.16) 1px, transparent 1px, transparent 14px)",
                        }}
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#194c9f]/10 blur-2xl"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute bottom-0 right-24 h-24 w-24 rounded-full border-4 border-[#e8c547]/40"
                    />
                    <div className="relative z-10 flex items-end justify-between gap-4">
                        <div className="relative z-10 pl-2 sm:pl-4 lg:pl-8">
                            <h3 className="text-4xl font-extrabold leading-none tracking-tight text-[#194c9f] lg:text-6xl">ຈອງກ່ອນ</h3>
                            <h3 className="text-4xl font-extrabold leading-none tracking-tight text-[#194c9f] lg:text-6xl">ແຊບກ່ອນ</h3>
                            <p className="mt-3 max-w-md text-sm font-medium text-slate-600">ສະແກນຈອງຄິວໄວ້ລ່ວງໜ້າໄດ້ທຸກມື້</p>
                        </div>
                        <button
                            type="button"
                            onClick={promptLoginForBooking}
                            className="inline-flex h-14 items-center rounded-xl bg-gradient-to-b from-[#2457ac] to-[#123a80] px-7 text-xl font-extrabold text-white shadow-[0_10px_26px_rgba(25,76,159,0.4)] ring-1 ring-white/35 transition hover:-translate-y-0.5 hover:brightness-105"
                        >
                            ຈອງຄິວ
                        </button>
                    </div>
                </section>
            </div>

            {loginPromptOpen ? (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 px-4">
                    <div className="w-full max-w-sm rounded-2xl border border-white/25 bg-[#194c9f] p-5 text-white shadow-2xl">
                        <h3 className="text-lg font-bold">ຕ້ອງການເຂົ້າລະບົບ</h3>
                        <p className="mt-2 text-sm text-white/90">
                            ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນເພື່ອທຳການຈອງຄິວ
                        </p>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setLoginPromptOpen(false)}
                                className="rounded-xl border border-white/50 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                            >
                                ຍົກເລີກ
                            </button>
                            <Link
                                href={loginHref}
                                className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#194c9f] shadow-lg transition hover:-translate-y-0.5 hover:brightness-95"
                            >
                                ເຂົ້າສູ່ລະບົບ
                            </Link>
                        </div>
                    </div>
                </div>
            ) : null}
        </CustomerLayout>
    );
}

