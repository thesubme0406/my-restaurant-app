import { Link, usePage } from '@inertiajs/react';
import { confirmAndLogout } from '@/utils/confirmLogout';
import ApplicationLogo from '@/Components/ApplicationLogo';
import {
    ChevronLeft,
    CreditCard,
    Database,
    Download,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    ShoppingCart,
    UserRound,
    X,
} from 'lucide-react';
import { useState } from 'react';

const brandBlue = '#194c9f';

const managerMenus = [
    { key: 'dashboard', label: 'ແຜງຄວບຄຸມ', href: '/admin/dashboard', icon: LayoutDashboard },
    { key: 'master', label: 'ຈັດການຂໍ້ມູນພື້ນຖານ', href: '/admin/master-data', icon: Database },
    { key: 'ingredients', label: 'ເບີກວັດຖຸດິບ', href: '/admin/inventory', icon: Package },
    { key: 'orders', label: 'ສັ່ງຊື້ວັດຖຸດິບ', href: '/admin/purchase', icon: ShoppingCart },
    { key: 'stock-in', label: 'ນຳເຂົ້າວັດຖຸດິບ', href: '/admin/import', icon: Download },
    { key: 'payments', label: 'ຊຳລະເງິນ', href: '/admin/payments', icon: CreditCard },
    { key: 'reports', label: 'ລາຍງານ', href: '/admin/reports', icon: FileText },
    { key: 'profile', label: 'ຈັດການໂປຣໄຟລ', href: '/admin/profile', icon: UserRound },
];

const staffMenus = [
    { key: 'dashboard', label: 'ແຜງຄວບຄຸມ', href: '/staff/dashboard', icon: LayoutDashboard },
    { key: 'ingredients', label: 'ເບີກວັດຖຸດິບ', href: '/staff/inventory', icon: Package },
    { key: 'orders', label: 'ສັ່ງຊື້ວັດຖຸດິບ', href: '/staff/purchase', icon: ShoppingCart },
    { key: 'stock-in', label: 'ນຳເຂົ້າວັດຖຸດິບ', href: '/staff/import', icon: Download },
    { key: 'profile', label: 'ຈັດການໂປຣໄຟລ', href: '/staff/profile', icon: UserRound },
];

function resolveHeaderTitle(pathname, menus, explicitTitle) {
    const normalized = (pathname || '/').replace(/\/+$/, '').split('?')[0] || '/';
    const match = menus.find((m) => normalized === m.href || normalized.startsWith(`${m.href}/`));
    if (match) {
        return match.label;
    }
    const t = explicitTitle != null ? String(explicitTitle).trim() : '';
    if (t !== '' && t !== 'Admin') {
        return t;
    }
    return 'ແຜງຄວບຄຸມ';
}

function NavLinks({ menus, currentPath, onNavigate }) {
    return (
        <>
            {menus.map((menu) => {
                const Icon = menu.icon;
                const isActive = currentPath === menu.href || currentPath.startsWith(`${menu.href}/`);

                return (
                    <Link
                        key={menu.key}
                        href={menu.href}
                        onClick={onNavigate ?? undefined}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                            isActive
                                ? 'bg-white/15 text-white'
                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        <Icon className="h-5 w-5 shrink-0 opacity-90" strokeWidth={1.75} />
                        <span>{menu.label}</span>
                    </Link>
                );
            })}
            <button
                type="button"
                onClick={() => {
                    onNavigate?.();
                    confirmAndLogout();
                }}
                className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
                <LogOut className="h-5 w-5 shrink-0 opacity-90" strokeWidth={1.75} />
                <span>ອອກຈາກລະບົບ</span>
            </button>
        </>
    );
}

export default function AdminLayout({ children, title }) {
    const page = usePage();
    const { auth, ziggy } = page.props;
    const pathFromPage =
        typeof page.url === 'string' && page.url !== ''
            ? page.url.split('?')[0]
            : ziggy?.location
              ? new URL(ziggy.location).pathname
              : '';
    const currentPath = pathFromPage || '/';
    const initials = auth?.user?.name ? auth.user.name.slice(0, 2).toUpperCase() : 'AD';
    const profileImage = typeof auth?.user?.image === 'string' && auth.user.image.trim() !== '' ? auth.user.image : null;
    const menus = auth?.is_staff_manager ? managerMenus : staffMenus;
    const headerTitle = resolveHeaderTitle(currentPath, menus, title);
    const profileHref = auth?.is_staff_manager ? '/admin/profile' : '/staff/profile';

    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [brandLogoError, setBrandLogoError] = useState(false);
    const closeMobile = () => setMobileNavOpen(false);
    const brandLogoSrc = '/images/oshinei-logo.png';

    return (
        <div className="min-h-screen bg-slate-100 font-lao text-slate-900">
            <div className="flex min-h-screen">
                <aside
                    className="hidden w-64 shrink-0 flex-col md:flex"
                    style={{ backgroundColor: brandBlue }}
                >
                    <div className="flex items-center gap-3 border-b border-white/10 px-5 py-6">
                        {!brandLogoError ? (
                            <img
                                src={brandLogoSrc}
                                alt="OSHINEI logo"
                                className="h-12 w-12 shrink-0 rounded-full border-2 border-white/40 bg-white object-cover"
                                onError={() => setBrandLogoError(true)}
                            />
                        ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white/40 bg-white p-2">
                                <ApplicationLogo className="h-full w-full fill-[#194c9f]" />
                            </div>
                        )}
                        <span className="text-xl font-bold tracking-wide text-white">OSHINEI</span>
                    </div>
                    <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
                        <NavLinks menus={menus} currentPath={currentPath} />
                    </nav>
                </aside>

                <div
                    className={`fixed inset-0 z-50 md:hidden ${mobileNavOpen ? '' : 'pointer-events-none'}`}
                    aria-hidden={!mobileNavOpen}
                >
                    <button
                        type="button"
                        className={`absolute inset-0 bg-slate-900/50 transition-opacity ${mobileNavOpen ? 'opacity-100' : 'opacity-0'}`}
                        onClick={closeMobile}
                        aria-label="ປິດເມນູ"
                    />
                    <aside
                        className={`absolute left-0 top-0 flex h-full w-[min(18rem,88vw)] flex-col shadow-2xl transition-transform ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
                        style={{ backgroundColor: brandBlue }}
                    >
                        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
                            <div className="flex items-center gap-3">
                                {!brandLogoError ? (
                                    <img
                                        src={brandLogoSrc}
                                        alt="OSHINEI logo"
                                        className="h-10 w-10 shrink-0 rounded-full border-2 border-white/40 bg-white object-cover"
                                        onError={() => setBrandLogoError(true)}
                                    />
                                ) : (
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/40 bg-white p-2">
                                        <ApplicationLogo className="h-full w-full fill-[#194c9f]" />
                                    </div>
                                )}
                                <span className="text-lg font-bold text-white">OSHINEI</span>
                            </div>
                            <button
                                type="button"
                                onClick={closeMobile}
                                className="rounded-lg p-2 text-white/90 hover:bg-white/10"
                                aria-label="ປິດ"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
                            <NavLinks menus={menus} currentPath={currentPath} onNavigate={closeMobile} />
                        </nav>
                    </aside>
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 shadow-sm sm:px-6 md:px-8">
                        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                            <button
                                type="button"
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
                                aria-label="ເປີດເມນູ"
                                onClick={() => setMobileNavOpen(true)}
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:inline-flex"
                                aria-label="ກັບຄືນ"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <h1
                                className="truncate text-base font-semibold sm:text-lg md:text-xl"
                                style={{ color: brandBlue }}
                            >
                                {headerTitle}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="hidden max-w-[180px] truncate text-sm font-semibold text-slate-700 sm:inline">
                                {auth?.user?.name ?? '—'}
                            </span>
                            <Link
                                href={profileHref}
                                className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold transition hover:opacity-90 ${
                                    profileImage ? 'ring-1 ring-slate-200 bg-slate-100' : 'text-white'
                                }`}
                                style={profileImage ? undefined : { backgroundColor: brandBlue }}
                                aria-label="ໄປຫາໜ້າໂປຣໄຟລ໌"
                            >
                                {profileImage ? (
                                    <img src={profileImage} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    initials
                                )}
                            </Link>
                        </div>
                    </header>
                    <main className="flex-1 p-4 md:p-8">{children}</main>
                </div>
            </div>
        </div>
    );
}
