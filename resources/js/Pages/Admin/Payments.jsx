import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function PaymentsPage() {
    return (
        <AdminLayout>
            <Head title="Payments" />
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">Payments</h2>
            </div>
        </AdminLayout>
    );
}
