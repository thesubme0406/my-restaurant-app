import { Head, Link } from '@inertiajs/react';
import { Clock, MapPin } from 'lucide-react';
import CustomerLayout from '@/Layouts/CustomerLayout';

// ສີຫຼັກ OSHINEI (#194c9f) ກົງກັບ admin
const BRAND = '#194c9f';
const BRAND_SOFT = '#7db7ff';

function OshineiLogoMark() {
    return (
        <div
            className="relative flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-white/5 shadow-inner"
            aria-hidden
        >
            <span className="select-none text-center text-[0.65rem] font-extrabold leading-tight tracking-tight text-white">OSHINEI</span>
            <div
                className="pointer-events-none absolute bottom-2 left-1/2 h-3 w-[70%] -translate-x-1/2 rounded-full border-b-2 border-dashed border-white/50 opacity-80"
                style={{
                    background:
                        'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(125,183,255,0.35) 0%, transparent 65%)',
                }}
            />
        </div>
    );
}

function StatCell({ value, label }) {
    return (
        <div className="flex flex-col items-center justify-center px-1 py-3 text-center">
            <p className="text-base font-bold tabular-nums sm:text-lg" style={{ color: BRAND }}>
                {value}
            </p>
            <p className="mt-1 font-lao text-[0.6rem] font-medium leading-snug text-slate-700 sm:text-[0.65rem]">{label}</p>
        </div>
    );
}

const PARAGRAPHS = [
    {
        text: 'ຈຸດເລີ່ມຕົ້ນຂອງຮ້ານອາຫານ OSHINEI: Oshinei ກໍ່ຕັ້ງຂຶ້ນໃນປີ 2014 ທີ່ປະເທດໄທ ຈັງຫວັດອຸບົນຮາຊະທານີ ໂດຍ ທ່ານ ກິດຕິສັກ ລີລ້ອມ ອາດີດເຊຟຜູ້ມີປະສົບການໃນວົງການອາຫານຍີ່ປຸ່ນ ກ່ອນຈະຂະຫຍາຍມາເປີດສາຂາຢູ່ສປປ ລາວ ໃນປີ 2022 ເພື່ອນຳເອົາລົດຊາດ ແລະ ມາດຕະຖານການບໍລິການທີ່ຄຸ້ນຊິນໃຫ້ກັບລູກຄ້າລາວ.',
    },
    {
        text: 'ບຸບເຟ່ທີ່ຄົບທີ່ສຸດໃນລາວ: ພວກເຮົາພູມໃຈທີ່ຈະນຳສະເໜີບຸບເຟ່ອາຫານຍີ່ປຸ່ນທີ່ຫຼາກຫຼາຍ ທັງຊູຊິ, ຊາບູ, ຊາຊິມິ ແລະ ເມນູອື່ນໆ ລວມແລ້ວແມ່ນກວ່າ 200 ລາຍການ ເພື່ອໃຫ້ທ່ານເລືອກກິນຕາມໃຈມັກໃນບັນຍາກາດທີ່ອົບອຸ່ນ.',
    },
    {
        text: 'ທາງເຮົາຕ້ອງການໃຫ້ລູກຄ້າພໍໃຈກັບການມາໃຊ້ບໍລິການທຸກຄັ້ງ ພ້ອມເຊີນທຸກທ່ານມາຊິມອາຫານ ແລະ ສັມຜັດປະສົບການທີ່ແຕກຕ່າງກັບຮ້ານ OSHINEI ໃນທົ່ວນະຄອນຫຼວງວຽງຈັນ.',
    },
];

export default function AboutPage() {
    return (
        <CustomerLayout>
            <Head title="ກ່ຽວກັບ OSHINEI" />

            <div className="customer-page mx-auto max-w-4xl space-y-0 overflow-hidden rounded-2xl shadow-xl ring-1 ring-slate-200/85">
                <section className="px-5 pb-8 pt-6 sm:px-8 sm:pt-7" style={{ backgroundColor: BRAND }}>
                    <div className="flex items-start justify-between gap-4">
                        <OshineiLogoMark />
                        <div className="min-w-0 flex-1 space-y-3 pt-1 text-left text-white">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/95">JAPANESE BUFFET</p>
                            <div className="flex gap-2 text-xs leading-snug text-white/95 sm:text-sm">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-400" strokeWidth={2} aria-hidden />
                                <span>Ban Saphanthong, Vientiane, Laos</span>
                            </div>
                            <div className="flex gap-2 text-xs leading-snug text-white/95 sm:text-sm">
                                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" strokeWidth={2} aria-hidden />
                                <span>11:00 – 22:00</span>
                            </div>
                        </div>
                    </div>

                    <h1 className="font-lao mt-7 text-center text-xl font-extrabold leading-snug tracking-tight sm:text-2xl">
                        <span style={{ color: BRAND_SOFT }}>ປະສົບການ</span>{' '}
                        <span className="text-white">ການກິນອາຫານຍີ່ປຸ່ນ ໃຈກາງນະຄອນຫຼວງວຽງຈັນ</span>
                    </h1>
                    <p className="font-lao mx-auto mt-4 max-w-[22rem] text-center text-xs leading-relaxed text-white/85 sm:text-sm">
                        ພວກເຮົາມຸ່ງໝັ້ນໃນຄຸນນະພາບອາຫານ ແລະ ການຕ້ອນຮັບອົບອຸ່ນ ຕະຫຼອດມາ ຕັ້ງແຕ່ເປີດໃຫ້ບໍລິການໃນລາວ.
                    </p>
                </section>

                <div className="grid grid-cols-2 divide-x divide-y divide-slate-300/90 bg-slate-200/95 sm:grid-cols-4 sm:divide-y-0">
                    <StatCell value="2014" label="ກໍ່ຕັ້ງເມື່ອ" />
                    <StatCell value="200+" label="ເມນູໃຫ້ເລືອກ" />
                    <StatCell value="4" label="ແພັກເກັດລາຄາ" />
                    <StatCell value="1000+" label="ລູກຄ້າຕໍ່ເດືອນ" />
                </div>

                <article className="bg-white px-5 pb-10 pt-8 sm:px-10">
                    <h2 className="font-lao text-base font-bold tracking-tight sm:text-lg" style={{ color: BRAND }}>
                        ປະຫວັດຫຍໍ້ຂອງຮ້ານ
                    </h2>
                    <div className="mt-8 space-y-0">
                        {PARAGRAPHS.map((p, i) => (
                            <div key={i}>
                                {i > 0 ? <div className="my-8 border-t border-slate-200" /> : null}
                                <p className="font-lao text-sm leading-relaxed text-slate-800 sm:text-[0.9375rem]">{p.text}</p>
                            </div>
                        ))}
                    </div>
                </article>
            </div>

            <p className="mt-5 text-center">
                <Link href={route('customer.home')} className="text-xs font-semibold hover:underline sm:text-sm" style={{ color: BRAND }}>
                    ← ກັບໜ້າຫຼັກ
                </Link>
            </p>
        </CustomerLayout>
    );
}
