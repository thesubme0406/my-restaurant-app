import { Link, usePage } from '@inertiajs/react';
import { BarChart3, BookOpen, Clock3, Home, LogOut, Menu, Phone, SquareMenu, User, UserCircle2, X } from 'lucide-react';
import { useState } from 'react';

const SOCIAL_FACEBOOK = 'https://www.facebook.com/OshineiVientiane/';
const SOCIAL_TIKTOK = 'https://www.tiktok.com/discover/oshinei-vientiane';
const SOCIAL_WHATSAPP = 'https://wa.me/8562059494465';

const navItems = [
    { key: 'profile', label: 'ໂປຣໄຟລ໌', icon: User, href: route('customer.profile') },
    { key: 'home', label: 'ໜ້າຫຼັກ', icon: Home, href: route('customer.home') },
    { key: 'queue', label: 'ການຈອງຄິວ', icon: BarChart3, href: route('customer.reserve') },
    { key: 'menu', label: 'ເມນູ', icon: SquareMenu, href: route('customer.menu') },
    { key: 'news', label: 'ຂໍ້ມູນຂ່າວສານ', icon: Clock3, href: route('customer.news') },
    { key: 'about', label: 'ກ່ຽວກັບ Oshinei', icon: BookOpen, href: route('customer.about') },
    { key: 'contact', label: 'ຕິດຕໍ່ເຮົາ', icon: Phone, href: route('customer.contact') },
];

function SocialLink({ href, label, bgClass, children }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm transition hover:opacity-90 ${bgClass}`}
        >
            {children}
        </a>
    );
}

export default function CustomerLayout({ children }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { auth } = usePage().props;
    const customerName = auth?.user?.name ?? 'Customer';
    const customerPhone = auth?.user?.phone ?? '-';

    return (
        <div className="flex min-h-screen flex-col bg-slate-100">
            <header className="bg-white px-4 py-3 shadow-sm">
                <div className="mx-auto flex w-full max-w-md items-center justify-between">
                    <Link
                        href={route('customer.home')}
                        className="text-4xl font-extrabold tracking-tight text-[#194c9f] hover:opacity-90"
                        aria-label="ໜ້າຫຼັກ OSHINEI"
                    >
                        OSHINEI
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href={route('customer.reserve')} className="text-sm font-semibold text-[#194c9f]">
                            ຈອງຄິວ
                        </Link>
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(true)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#194c9f]"
                            aria-label="Open menu"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            <aside className={`fixed inset-0 z-50 transition ${drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                <button
                    type="button"
                    className={`absolute inset-0 bg-slate-900/40 transition-opacity ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close menu backdrop"
                />
                <div
                    className={`absolute right-0 top-0 flex h-full w-[82%] max-w-xs flex-col bg-white shadow-xl transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="border-b border-slate-200 px-4 py-3">
                        <div className="flex items-center justify-between">
                            <Link
                                href={route('customer.home')}
                                onClick={() => setDrawerOpen(false)}
                                className="text-3xl font-extrabold text-[#194c9f] hover:opacity-90"
                                aria-label="ໜ້າຫຼັກ OSHINEI"
                            >
                                OSHINEI
                            </Link>
                            <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                                <X className="h-5 w-5 text-[#194c9f]" />
                            </button>
                        </div>
                        <Link
                            href={route('customer.profile')}
                            onClick={() => setDrawerOpen(false)}
                            className="mt-4 flex items-center gap-3 rounded-xl py-1 hover:bg-slate-50"
                        >
                            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                                <UserCircle2 className="h-10 w-10 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-[#194c9f]">{customerName}</p>
                                <p className="text-sm text-slate-600">{customerPhone}</p>
                            </div>
                        </Link>
                    </div>

                    <nav className="flex-1 space-y-1 px-3 py-4">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    href={item.href}
                                    key={item.key}
                                    onClick={() => setDrawerOpen(false)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[#194c9f] hover:bg-slate-100"
                                >
                                    <Icon className="h-5 w-5 text-slate-700" />
                                    <span className="font-semibold">{item.label}</span>
                                </Link>
                            );
                        })}
                        <div className="flex items-center gap-4 px-3 pt-3">
                            <SocialLink href={SOCIAL_FACEBOOK} label="Facebook" bgClass="bg-[#1877F2]">
                                f
                            </SocialLink>
                            <SocialLink href={SOCIAL_WHATSAPP} label="WhatsApp" bgClass="bg-[#25D366]">
                                wa
                            </SocialLink>
                            <SocialLink href={SOCIAL_TIKTOK} label="TikTok" bgClass="bg-black">
                                tt
                            </SocialLink>
                        </div>
                    </nav>

                    <div className="border-t border-slate-200 p-4">
                        <Link href={route('logout')} method="post" as="button" className="flex items-center gap-2 font-semibold text-[#194c9f]">
                            <LogOut className="h-4 w-4" />
                            ອອກຈາກລະບົບ
                        </Link>
                    </div>
                </div>
            </aside>

            <main className="mx-auto w-full max-w-md flex-1 px-4 py-4">{children}</main>

            <footer className="mt-6 bg-slate-300 px-4 py-5">
                <div className="mx-auto w-full max-w-md space-y-3 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-semibold text-[#194c9f]">
                        <Link href={route('customer.about')} className="hover:underline">
                            ກ່ຽວກັບ Oshinei
                        </Link>
                        <Link href={route('customer.news')} className="hover:underline">
                            ໂປຣໂມຊັ່ນສຳຫລັບເດືອນນີ້
                        </Link>
                        <Link href={route('customer.contact')} className="hover:underline">
                            ຕິດຕໍ່ເຮົາ
                        </Link>
                    </div>
                    <p className="text-xs text-slate-700">ສະຖານທີ່ຕັ້ງ: ບ້ານ ສະພານທອງ, ເມືອງ ສີສັດຕະນາກ, ນະຄອນຫຼວງວຽງຈັນ</p>
                    <div className="flex items-center justify-center gap-4">
                        <SocialLink href={SOCIAL_FACEBOOK} label="Facebook" bgClass="bg-[#1877F2]">
                            f
                        </SocialLink>
                        <SocialLink href={SOCIAL_WHATSAPP} label="WhatsApp" bgClass="bg-[#25D366]">
                            wa
                        </SocialLink>
                        <SocialLink href={SOCIAL_TIKTOK} label="TikTok" bgClass="bg-black">
                            tt
                        </SocialLink>
                    </div>
                </div>
            </footer>
        </div>
    );
}
