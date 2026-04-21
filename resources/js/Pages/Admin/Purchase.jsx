import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function PurchasePage() {
    return (
        <AdminLayout>
            <Head title="Purchase" />
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">Purchase</h2>
            </div>
        </AdminLayout>
    );
}
