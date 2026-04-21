import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function ImportPage() {
    return (
        <AdminLayout>
            <Head title="Import" />
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">Import</h2>
            </div>
        </AdminLayout>
    );
}
