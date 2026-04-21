import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function BasicInfoPage() {
    return (
        <AdminLayout>
            <Head title="Manage Basic Info" />
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">Manage Basic Info</h2>
            </div>
        </AdminLayout>
    );
}
