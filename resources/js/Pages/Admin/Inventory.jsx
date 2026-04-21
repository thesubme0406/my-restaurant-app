import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function InventoryPage() {
    return (
        <AdminLayout>
            <Head title="Inventory" />
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">Inventory</h2>
            </div>
        </AdminLayout>
    );
}
