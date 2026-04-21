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
    Package,
    ShoppingCart,
    TestTube2,
} from 'lucide-react';

const brandBlue = '#194c9f';

const managerMenus = [
    { key: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { key: 'master', label: 'Master Data', href: '/admin/basic-info', icon: Database },
    { key: 'ingredients', label: 'Ingredients', href: '/admin/inventory', icon: Package },
    { key: 'orders', label: 'Orders', href: '/admin/purchase', icon: ShoppingCart },
    { key: 'stock-in', label: 'Stock In', href: '/admin/import', icon: Download },
    { key: 'payments', label: 'Payments', href: '/admin/payments', icon: CreditCard },
    { key: 'reports', label: 'Reports', href: '/admin/reports', icon: FileText },
];

const staffMenus = [
    { key: 'dashboard', label: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
    { key: 'layout-test', label: 'Layout test', href: '/staff/test', icon: TestTube2 },
    { key: 'ingredients', label: 'Ingredients', href: '/staff/inventory', icon: Package },
    { key: 'orders', label: 'Orders', href: '/staff/purchase', icon: ShoppingCart },
    { key: 'stock-in', label: 'Stock In', href: '/staff/import', icon: Download },
    { key: 'payments', label: 'Payments', href: '/staff/payments', icon: CreditCard },
];

function resolveHeaderTitle(pathname, menus, fallbackTitle) {
    const normalized = pathname.replace(/\/+$/, '') || '/';
    const match = menus.find(
        (m) => normalized === m.href || normalized.startsWith(`${m.href}/`)
    );
    if (match) {
        return match.label;
    }
    if (fallbackTitle && fallbackTitle !== 'Admin') {
        return fallbackTitle;
    }
    return 'Dashboard';
}

export default function AdminLayout({ children, title }) {
    const { auth, ziggy } = usePage().props;
    const currentPath = ziggy?.location ? new URL(ziggy.location).pathname : '';
    const initials = auth?.user?.name ? auth.user.name.slice(0, 2).toUpperCase() : 'AD';
    const menus = auth?.is_staff_manager ? managerMenus : staffMenus;
    const headerTitle = resolveHeaderTitle(currentPath, menus, title);

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
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
                        {menus.map((menu) => {
                            const Icon = menu.icon;
                            const isActive =
                                currentPath === menu.href || currentPath.startsWith(`${menu.href}/`);

                            return (
                                <Link
                                    key={menu.key}
                                    href={menu.href}
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
                            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                        >
                            <LogOut className="h-5 w-5 shrink-0 opacity-90" strokeWidth={1.75} />
                            <span>Log out</span>
                        </Link>
                    </nav>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:px-8">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                                aria-label="Back"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <h1
                                className="truncate text-lg font-semibold md:text-xl"
                                style={{ color: brandBlue }}
                            >
                                {headerTitle}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                                aria-label="Notifications"
                            >
                                <Bell className="h-5 w-5" strokeWidth={1.75} />
                            </button>
                            <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                                style={{ backgroundColor: brandBlue }}
                            >
                                {initials}
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 p-4 md:p-8">{children}</main>
                </div>
            </div>
        </div>
    );
}
