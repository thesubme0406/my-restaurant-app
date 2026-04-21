import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
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
    TestTube2,
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
    { key: 'layout-test', label: 'Layout test', href: '/staff/test', icon: TestTube2 },
    { key: 'ingredients', label: 'ເບີກວັດຖຸດິບ', href: '/staff/inventory', icon: Package },
    { key: 'orders', label: 'ສັ່ງຊື້ວັດຖຸດິບ', href: '/staff/purchase', icon: ShoppingCart },
    { key: 'stock-in', label: 'ນຳເຂົ້າວັດຖຸດິບ', href: '/staff/import', icon: Download },
    { key: 'payments', label: 'ຊຳລະເງິນ', href: '/staff/payments', icon: CreditCard },
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
            <Link
                href={route('logout')}
                method="post"
                as="button"
                onClick={onNavigate ?? undefined}
                className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
                <LogOut className="h-5 w-5 shrink-0 opacity-90" strokeWidth={1.75} />
                <span>ອອກຈາກລະບົບ</span>
            </Link>
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
    const menus = auth?.is_staff_manager ? managerMenus : staffMenus;
    const headerTitle = resolveHeaderTitle(currentPath, menus, title);
    const profileHref = auth?.is_staff_manager ? '/admin/profile' : '/staff/profile';

    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const closeMobile = () => setMobileNavOpen(false);

    return (
        <div className="min-h-screen bg-slate-100 font-lao text-slate-900">
            <div className="flex min-h-screen">
                <aside
                    className="hidden w-64 shrink-0 flex-col md:flex"
                    style={{ backgroundColor: brandBlue }}
                >
                    <div className="flex items-center gap-3 border-b border-white/10 px-5 py-6">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 text-xs font-bold text-white">
                            O
                        </div>
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
                            <span className="text-lg font-bold text-white">OSHINEI</span>
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
                            <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                                aria-label="ແຈ້ງເຕືອນ"
                            >
                                <Bell className="h-5 w-5" strokeWidth={1.75} />
                            </button>
                            <Link
                                href={profileHref}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white transition hover:opacity-90"
                                style={{ backgroundColor: brandBlue }}
                                aria-label="ໄປຫາໜ້າໂປຣໄຟລ໌"
                            >
                                {initials}
                            </Link>
                        </div>
                    </header>
                    <main className="flex-1 p-4 md:p-8">{children}</main>
                </div>
            </div>
        </div>
    );
}
