import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

export default function Profile() {
    return (
        <AdminLayout title="ຈັດການໂປຣໄຟລ">
            <Head title="ຈັດການໂປຣໄຟລ" />
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-600">ໜ້າຈັດການໂປຣໄຟລ ກຳລັງພັດທະນາ.</p>
            </div>
        </AdminLayout>
    );
}
