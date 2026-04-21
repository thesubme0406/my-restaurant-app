import { Head } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';

export default function CustomerDashboard() {
    return (
        <CustomerLayout>
            <Head title="Customer Dashboard" />

            <div className="rounded-xl bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Customer Dashboard</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Mobile-first pages for customers will be built in this section.
                </p>
            </div>
        </CustomerLayout>
    );
}
