import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-100 pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/" className="flex flex-col items-center gap-2">
                    <img
                        src="/images/oshinei-logo.png"
                        alt="Oshinei"
                        className="h-20 w-20 rounded-full border-2 border-[#194c9f]/20 bg-white object-cover shadow-md"
                    />
                    <span className="text-2xl font-extrabold tracking-tight text-[#194c9f]">
                        OSHINEI
                    </span>
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg">
                {children}
            </div>
        </div>
    );
}
