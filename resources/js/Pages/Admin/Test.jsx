import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Test() {
    return (
        <AdminLayout title="Layout test">
            <Head title="Admin layout test" />
            <p className="text-lg text-slate-700">Layout is working!</p>
        </AdminLayout>
    );
}
