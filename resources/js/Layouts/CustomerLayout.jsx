import { Link } from '@inertiajs/react';

export default function CustomerLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="border-b border-gray-200 bg-white px-4 py-3">
                <div className="mx-auto flex w-full max-w-md items-center justify-between">
                    <h1 className="text-base font-semibold text-gray-900">Restaurant App</h1>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                        Log out
                    </Link>
                </div>
            </header>

            <main className="mx-auto w-full max-w-md px-4 py-4">{children}</main>
        </div>
    );
}
