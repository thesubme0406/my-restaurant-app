import { Head, Link } from '@inertiajs/react';
import { Clock, ExternalLink, MapPin, Phone } from 'lucide-react';
import CustomerLayout from '@/Layouts/CustomerLayout';

const PHONE_DISPLAY = '020 59 494 465';
const PHONE_TEL = '02059494465';
const MAPS_URL = 'https://maps.app.goo.gl/PzwnSD9yLiSnaVU4A';
const ADDRESS = 'ບ້ານ ສະພານທອງ, ເມືອງ ສີສັດຕະນາກ, ນະຄອນຫຼວງວຽງຈັນ';

export default function ContactPage() {
    return (
        <CustomerLayout>
            <Head title="ຕິດຕໍ່ເຮົາ" />

            <div className="space-y-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
                <header className="bg-[#194c9f] px-4 py-4">
                    <h1 className="font-lao text-center text-xl font-bold tracking-tight text-white">ຕິດຕໍ່ເຮົາ</h1>
                </header>

                <div className="space-y-6 px-4 py-6 text-slate-700">
                    <section className="space-y-2">
                        <h2 className="font-lao text-xs font-semibold uppercase tracking-wide text-slate-500">ເບີໂທລະສັບ</h2>
                        <a
                            href={`tel:${PHONE_TEL}`}
                            className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-3 text-slate-800 transition hover:border-[#194c9f]/30 hover:bg-white"
                        >
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#194c9f]/10 text-[#194c9f]">
                                <Phone className="h-5 w-5" strokeWidth={2} aria-hidden />
                            </span>
                            <span className="font-lao text-base font-semibold">{PHONE_DISPLAY}</span>
                        </a>
                    </section>

                    <section className="space-y-2">
                        <h2 className="font-lao text-xs font-semibold uppercase tracking-wide text-slate-500">ທີ່ຕັ້ງຮ້ານ</h2>
                        <div className="flex gap-3 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-3">
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#194c9f]/10 text-[#194c9f]">
                                <MapPin className="h-5 w-5" strokeWidth={2} aria-hidden />
                            </span>
                            <div className="min-w-0 flex-1 space-y-3">
                                <p className="font-lao text-sm leading-relaxed text-slate-800">{ADDRESS}</p>
                                <a
                                    href={MAPS_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg border border-[#194c9f] bg-white px-3 py-2 text-sm font-semibold text-[#194c9f] transition hover:bg-[#194c9f]/5"
                                >
                                    <span className="font-lao">ເບິ່ງແຜນທີ່</span>
                                    <ExternalLink className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                                </a>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-2">
                        <h2 className="font-lao text-xs font-semibold uppercase tracking-wide text-slate-500">ເວລາເປີດ-ປິດ</h2>
                        <ul className="space-y-2 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-3 text-sm">
                            <li className="flex items-start gap-3">
                                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#194c9f]/10 text-[#194c9f]">
                                    <Clock className="h-4 w-4" strokeWidth={2} aria-hidden />
                                </span>
                                <div className="font-lao pt-1 leading-relaxed text-slate-800">
                                    <p className="font-semibold">ທຸກມື້</p>
                                    <p className="mt-0.5 text-slate-600">11:00 ນ. – 22:00 ນ. (11:00 AM – 10:00 PM)</p>
                                </div>
                            </li>
                        </ul>
                    </section>
                </div>
            </div>

            <p className="mt-4 text-center">
                <Link href={route('customer.home')} className="text-sm font-semibold text-[#194c9f] hover:underline">
                    ← ກັບໜ້າຫຼັກ
                </Link>
            </p>
        </CustomerLayout>
    );
}
