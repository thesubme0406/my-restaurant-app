import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { Eye, EyeOff, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const primary = '#1e3a8a';
const inputClass =
    'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]';
const lockedClass =
    'mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600';

export default function Profile({ profile }) {
    const page = usePage();
    const pageErrors = page.props.errors ?? {};
    const flashSuccess = page.props.flash?.success;

    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [draftError, setDraftError] = useState('');
    const [pendingChanges, setPendingChanges] = useState(null);
    const [tempImageUrl, setTempImageUrl] = useState(null);
    const [display, setDisplay] = useState({
        username: profile?.username ?? '',
        address: profile?.address ?? '',
        phone: profile?.phone ?? '',
        image: profile?.image ?? null,
    });
    const [form, setForm] = useState({
        username: profile?.username ?? '',
        address: profile?.address ?? '',
        phone: profile?.phone ?? '',
        old_password: '',
        new_password: '',
        new_password_confirmation: '',
        image: null,
    });

    const fullName = useMemo(() => profile?.full_name || '-', [profile]);

    useEffect(() => {
        setDisplay({
            username: profile?.username ?? '',
            address: profile?.address ?? '',
            phone: profile?.phone ?? '',
            image: profile?.image ?? null,
        });
        setPendingChanges(null);
    }, [profile]);

    useEffect(() => {
        return () => {
            if (tempImageUrl) {
                URL.revokeObjectURL(tempImageUrl);
            }
        };
    }, [tempImageUrl]);

    const onFile = (e) => {
        const file = e.target.files?.[0] ?? null;
        setForm((prev) => ({ ...prev, image: file }));
    };

    const applyDraft = (e) => {
        e.preventDefault();
        setDraftError('');
        if (form.new_password !== form.new_password_confirmation) {
            setDraftError('ລະຫັດຜ່ານໃໝ່ ແລະ ການຢືນຢັນບໍ່ກົງກັນ');
            return;
        }
        let previewImage = display.image;
        if (form.image) {
            if (tempImageUrl) {
                URL.revokeObjectURL(tempImageUrl);
            }
            const nextPreview = URL.createObjectURL(form.image);
            setTempImageUrl(nextPreview);
            previewImage = nextPreview;
        }
        setDisplay((prev) => ({
            ...prev,
            username: form.username,
            address: form.address,
            phone: form.phone,
            image: previewImage,
        }));
        setPendingChanges({ ...form });
        setOpen(false);
    };

    const submitFinalSave = () => {
        if (!pendingChanges || saving) return;
        setSaving(true);
        router.post(route('admin.profile.update'), pendingChanges, {
            preserveScroll: true,
            forceFormData: true,
            onFinish: () => setSaving(false),
            onSuccess: () => {
                setPendingChanges(null);
                setDraftError('');
                setForm((prev) => ({
                    ...prev,
                    old_password: '',
                    new_password: '',
                    new_password_confirmation: '',
                    image: null,
                }));
            },
        });
    };

    return (
        <AdminLayout title="ຈັດການໂປຣໄຟລ໌">
            <Head title="ຈັດການໂປຣໄຟລ໌" />

            <div className="-mx-4 -mt-2 bg-slate-50 px-4 pb-12 pt-4 md:-mx-8 md:px-8 md:pb-14 md:pt-6">
                <div className="mx-auto max-w-6xl">
                    {(flashSuccess || pageErrors?.old_password) && (
                        <div
                            className={`mb-4 rounded-2xl border px-4 py-3 text-sm shadow-sm sm:px-5 ${
                                flashSuccess
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : 'border-rose-200 bg-rose-50 text-rose-800'
                            }`}
                        >
                            {flashSuccess || pageErrors.old_password}
                        </div>
                    )}

                    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/80 md:p-7">
                        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                                <div className="mx-auto h-36 w-36 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-sm">
                                    {display?.image ? (
                                        <img src={display.image} alt={fullName} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-slate-500">
                                            {String(fullName).slice(0, 1).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <p className="mt-4 text-lg font-bold text-slate-900">{fullName}</p>
                            </aside>

                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-slate-900">ຈັດການໂປຣໄຟລ໌</h2>
                                    <button
                                        type="button"
                                        onClick={() => setOpen(true)}
                                        className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm"
                                        style={{ backgroundColor: primary }}
                                    >
                                        ແກ້ໄຂຂໍ້ມູນໂປຣໄຟລ໌
                                    </button>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="text-xs font-bold text-slate-700">ລະຫັດພະນັກງານ</label>
                                        <input readOnly value={profile?.staff_code ?? ''} className={lockedClass} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-700">ຊື່</label>
                                        <input readOnly value={profile?.name ?? ''} className={lockedClass} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-700">ນາມສະກຸນ</label>
                                        <input readOnly value={profile?.surname ?? ''} className={lockedClass} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-700">ຊື່ຜູ້ໃຊ້</label>
                                        <input readOnly value={display?.username ?? ''} className={lockedClass} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-700">ລະຫັດຜ່ານ</label>
                                        <input readOnly value="********" className={lockedClass} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-700">ຕຳແໜ່ງ</label>
                                        <input readOnly value={profile?.role ?? ''} className={lockedClass} />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="text-xs font-bold text-slate-700">ທີ່ຢູ່ປັດຈຸບັນ</label>
                                        <input readOnly value={display?.address ?? ''} className={lockedClass} />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="text-xs font-bold text-slate-700">ເບີໂທລະສັບ</label>
                                        <input readOnly value={display?.phone ?? ''} className={lockedClass} />
                                    </div>
                                </div>

                                <div className="mt-6">
                                    {pendingChanges && (
                                        <p className="mb-2 text-xs font-semibold text-amber-700">ມີຂໍ້ມູນທີ່ຍັງບໍ່ໄດ້ບັນທຶກ ກົດປຸ່ມຢືນຢັນເພື່ອບັນທຶກລົງລະບົບ</p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={submitFinalSave}
                                        disabled={!pendingChanges || saving}
                                        className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md sm:w-64"
                                        style={{ backgroundColor: !pendingChanges || saving ? '#94a3b8' : primary }}
                                    >
                                        {saving ? 'ກຳລັງບັນທຶກ...' : 'ຍືນຍັນການບັນທຶກຂໍ້ມູນ'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
                    <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                            <h3 className="text-lg font-bold text-slate-900">ແກ້ໄຂຂໍ້ມູນໂປຣໄຟລ໌</h3>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={applyDraft} className="space-y-4 px-5 py-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-700">ຮູບໂປຣໄຟລ໌</label>
                                    <input type="file" accept="image/*" onChange={onFile} className={inputClass} />
                                    {pageErrors.image && <p className="mt-1 text-xs text-rose-600">{pageErrors.image}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700">ຊື່ຜູ້ໃຊ້</label>
                                    <input
                                        value={form.username}
                                        onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                                        className={inputClass}
                                    />
                                    {pageErrors.username && <p className="mt-1 text-xs text-rose-600">{pageErrors.username}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700">ເບີໂທລະສັບ</label>
                                    <input
                                        value={form.phone}
                                        onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                                        className={inputClass}
                                    />
                                    {pageErrors.phone && <p className="mt-1 text-xs text-rose-600">{pageErrors.phone}</p>}
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-700">ທີ່ຢູ່ປັດຈຸບັນ</label>
                                    <textarea
                                        rows={3}
                                        value={form.address}
                                        onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                                        className={inputClass}
                                    />
                                    {pageErrors.address && <p className="mt-1 text-xs text-rose-600">{pageErrors.address}</p>}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="mb-3 text-sm font-bold text-slate-800">ປ່ຽນລະຫັດຜ່ານ</p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className="text-xs font-bold text-slate-700">ລະຫັດຜ່ານເກົ່າ</label>
                                        <div className="relative">
                                            <input
                                                type={showOld ? 'text' : 'password'}
                                                value={form.old_password}
                                                onChange={(e) => setForm((prev) => ({ ...prev, old_password: e.target.value }))}
                                                className={inputClass}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowOld((v) => !v)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500"
                                            >
                                                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {pageErrors.old_password && <p className="mt-1 text-xs text-rose-600">{pageErrors.old_password}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-700">ລະຫັດຜ່ານໃໝ່</label>
                                        <div className="relative">
                                            <input
                                                type={showNew ? 'text' : 'password'}
                                                value={form.new_password}
                                                onChange={(e) => setForm((prev) => ({ ...prev, new_password: e.target.value }))}
                                                className={inputClass}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNew((v) => !v)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500"
                                            >
                                                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {pageErrors.new_password && <p className="mt-1 text-xs text-rose-600">{pageErrors.new_password}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-700">ຢືນຢັນລະຫັດຜ່ານໃໝ່</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirm ? 'text' : 'password'}
                                                value={form.new_password_confirmation}
                                                onChange={(e) => setForm((prev) => ({ ...prev, new_password_confirmation: e.target.value }))}
                                                className={inputClass}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm((v) => !v)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500"
                                            >
                                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {draftError && <p className="text-xs font-semibold text-rose-600">{draftError}</p>}

                            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                                >
                                    ຍົກເລີກ
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
                                    style={{ backgroundColor: saving ? undefined : primary }}
                                >
                                    ບັນທຶກການແກ້ໄຂ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
