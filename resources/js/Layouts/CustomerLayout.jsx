import { Link, usePage } from '@inertiajs/react';
import { BarChart3, BookOpen, Clock3, Home, LogOut, Menu, Phone, SquareMenu, User, UserCircle2, X } from 'lucide-react';
import { useState } from 'react';

const SOCIAL_FACEBOOK = 'https://www.facebook.com/OshineiVientiane/';
const SOCIAL_TIKTOK = 'https://www.tiktok.com/discover/oshinei-vientiane';
const SOCIAL_WHATSAPP = 'https://wa.me/8562059494465';

function pathFromHref(href) {
    try {
        return new URL(href, 'http://localhost').pathname;
    } catch {
        return href;
    }
}

const navItems = (isAuthenticated) => [
    ...(isAuthenticated ? [{ key: 'profile', label: 'ໂປຣໄຟລ໌', icon: User, href: route('customer.profile') }] : []),
    { key: 'home', label: 'ໜ້າຫຼັກ', icon: Home, href: route('customer.home') },
    { key: 'queue', label: 'ການຈອງຄິວ', icon: BarChart3, href: route('customer.reserve'), requiresAuth: true },
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
    const page = usePage();
    const currentPath = typeof page.url === 'string' ? page.url.split('?')[0] : '/';
    const isAuthenticated = Boolean(auth?.user);
    const items = navItems(isAuthenticated);
    const desktopNavItems = items.filter((item) => item.key !== 'profile');
    const [loginPromptOpen, setLoginPromptOpen] = useState(false);
    const [redirectAfterLogin, setRedirectAfterLogin] = useState(route('customer.home'));
    const customerName = auth?.user?.name ?? 'Customer';
    const customerPhone = auth?.user?.phone ?? '-';
    const customerInitials = customerName
        .split(' ')
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || 'CU';
    const loginHref = `${route('login')}?redirect_to=${encodeURIComponent(redirectAfterLogin)}`;

    const promptLoginForBooking = (targetHref) => {
        if (isAuthenticated) {
            window.location.href = targetHref;
            return;
        }
        const current = `${window.location.pathname}${window.location.search}`;
        setRedirectAfterLogin(current);
        setLoginPromptOpen(true);
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-100">
            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-md backdrop-blur">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:h-20">
                    <Link
                        href={route('customer.home')}
                        className="text-3xl font-extrabold tracking-tight text-[#194c9f] hover:opacity-90 lg:text-4xl"
                        aria-label="ໜ້າຫຼັກ OSHINEI"
                    >
                        OSHINEI
                    </Link>

                    <nav className="hidden flex-1 items-center justify-center gap-6 xl:gap-8 lg:flex">
                        {desktopNavItems.map((item) => {
                            const path = pathFromHref(item.href);
                            const active = currentPath === path;

                            if (item.requiresAuth && !isAuthenticated) {
                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => promptLoginForBooking(item.href)}
                                        className={`text-base font-semibold transition ${active ? 'text-[#194c9f]' : 'text-slate-600 hover:text-[#194c9f]'}`}
                                    >
                                        {item.label}
                                    </button>
                                );
                            }

                            return (
                                <Link key={item.key} href={item.href} className={`text-base font-semibold transition ${active ? 'text-[#194c9f]' : 'text-slate-600 hover:text-[#194c9f]'}`}>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="ml-auto flex items-center gap-2 sm:gap-3">
                        {isAuthenticated ? (
                            <div className="hidden items-center gap-2 lg:flex">
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-600 ring-1 ring-slate-300 transition hover:bg-slate-200 hover:text-slate-700"
                                >
                                    ອອກຈາກລະບົບ
                                </Link>
                                <Link
                                    href={route('customer.profile')}
                                    className="inline-flex h-11 min-w-[180px] items-center gap-2 rounded-xl border border-[#194c9f]/20 bg-white px-3 py-1.5 text-sm font-bold text-[#194c9f] shadow-[0_8px_22px_rgba(25,76,159,0.20)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(25,76,159,0.28)]"
                                >
                                    <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#194c9f] text-[11px] font-extrabold text-white ring-2 ring-[#194c9f]/15">
                                        {customerInitials}
                                    </span>
                                    <span className="truncate">{customerName}</span>
                                    <UserCircle2 className="ml-auto h-4.5 w-4.5 text-[#194c9f]/70" />
                                </Link>
                            </div>
                        ) : (
                            <Link href={route('login')} className="inline-flex h-11 w-28 items-center justify-center rounded-xl bg-gradient-to-b from-[#2a63bb] to-[#174896] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(25,76,159,0.3)] ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:brightness-105">
                                ເຂົ້າສູ່ລະບົບ
                            </Link>
                        )}
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(true)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#194c9f] lg:hidden"
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
                        {isAuthenticated ? (
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
                        ) : (
                            <Link
                                href={route('login')}
                                onClick={() => setDrawerOpen(false)}
                                className="mt-4 inline-flex items-center rounded-xl bg-gradient-to-b from-[#2a63bb] to-[#174896] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(25,76,159,0.35)] ring-1 ring-white/30"
                            >
                                ເຂົ້າສູ່ລະບົບ
                            </Link>
                        )}
                    </div>

                    <nav className="flex-1 space-y-1 px-3 py-4">
                        {items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    type="button"
                                    key={item.key}
                                    onClick={() => {
                                        setDrawerOpen(false);
                                        if (item.requiresAuth) {
                                            promptLoginForBooking(item.href);
                                            return;
                                        }
                                        window.location.href = item.href;
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[#194c9f] hover:bg-slate-100"
                                >
                                    <Icon className="h-5 w-5 text-slate-700" />
                                    <span className="font-semibold">{item.label}</span>
                                </button>
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

                    {isAuthenticated ? (
                        <div className="border-t border-slate-200 p-4">
                            <Link href={route('logout')} method="post" as="button" className="flex items-center gap-2 font-semibold text-[#194c9f]">
                                <LogOut className="h-4 w-4" />
                                ອອກຈາກລະບົບ
                            </Link>
                        </div>
                    ) : null}
                </div>
            </aside>

            {loginPromptOpen ? (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 px-4">
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

            <main className="container mx-auto w-full flex-1 px-4 py-4">{children}</main>

            <footer className="mt-6 bg-slate-300 px-4 py-5">
                <div className="container mx-auto w-full space-y-3 text-center">
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
