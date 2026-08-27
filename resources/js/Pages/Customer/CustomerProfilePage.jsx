import InputError from '@/Components/InputError';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { digitsOnly, PHONE_PLACEHOLDER } from '@/utils/phoneFormat';

const BRAND = '#004085';

function PasswordField({
    id,
    label,
    labelClass,
    value,
    onChange,
    error,
    autoComplete,
    visible,
    onToggleVisible,
    inputClass,
}) {
    return (
        <div>
            <label htmlFor={id} className={labelClass} style={{ color: BRAND }}>
                {label}
            </label>
            <div className="relative mt-1">
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    className={`${inputClass} pr-11`}
                    autoComplete={autoComplete}
                />
                <button
                    type="button"
                    onClick={onToggleVisible}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    aria-label={visible ? 'ເຊື່ອງລະຫັດຜ່ານ' : 'ສະແດງລະຫັດຜ່ານ'}
                >
                    {visible ? <EyeOff className="h-4 w-4" strokeWidth={2} aria-hidden /> : <Eye className="h-4 w-4" strokeWidth={2} aria-hidden />}
                </button>
            </div>
            <InputError message={error} className="mt-1" />
        </div>
    );
}

function avatarLetter(name) {
    const t = (name ?? '').trim();
    if (!t) {
        return '?';
    }
    const ch = Array.from(t)[0];
    return ch && /[a-z]/i.test(ch) ? ch.toUpperCase() : ch;
}

export default function CustomerProfilePage({ profile }) {
    const { flash } = usePage().props;
    const [editPassword, setEditPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm({
        name: profile?.name ?? '',
        phone: profile?.phone ?? '',
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const letter = useMemo(() => avatarLetter(form.data.name), [form.data.name]);

    const inputClass =
        'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#004085] focus:outline-none focus:ring-1 focus:ring-[#004085]/30 sm:text-sm';

    const labelClass = 'font-lao text-[11px] font-semibold tracking-wide sm:text-xs';

    const submit = useCallback(
        (e) => {
            e.preventDefault();
            form.patch(route('customer.profile.update'), {
                preserveScroll: true,
                onSuccess: () => {
                    form.setData('current_password', '');
                    form.setData('password', '');
                    form.setData('password_confirmation', '');
                    setShowCurrentPassword(false);
                    setShowNewPassword(false);
                    setShowConfirmPassword(false);
                    setEditPassword(false);
                },
            });
        },
        [form]
    );

    return (
        <CustomerLayout>
            <Head title="ໂປຣໄຟລ໌" />

            <div className="customer-page mx-auto max-w-2xl space-y-4 sm:space-y-5">
                {flash?.success ? (
                    <div
                        className="rounded-xl border px-3 py-2 text-center text-xs font-medium text-white sm:text-sm"
                        style={{ backgroundColor: BRAND, borderColor: BRAND }}
                        role="status"
                    >
                        {flash.success}
                    </div>
                ) : null}

                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/90">
                    <div className="border-b border-slate-100 px-4 py-4">
                        <h1 className="font-lao text-base font-bold sm:text-lg" style={{ color: BRAND }}>
                            ໂປຣໄຟລ໌ລູກຄ້າ
                        </h1>
                        <p className="font-lao mt-1 text-xs text-slate-500">ແກ້ໄຂຂໍ້ມູນບັນຊີຂອງທ່ານ</p>
                    </div>

                    <div className="flex items-center gap-4 border-b border-slate-100 px-4 py-5">
                        <div
                            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xl font-bold sm:text-2xl"
                            style={{ color: BRAND }}
                            aria-hidden
                        >
                            {letter}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-base font-bold sm:text-lg" style={{ color: BRAND }}>
                                {form.data.name || '—'}
                            </p>
                            <p className="truncate text-xs text-slate-600 sm:text-sm">{form.data.phone || '—'}</p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-5 px-4 py-6">
                        <div>
                            <label htmlFor="profile-name" className={labelClass} style={{ color: BRAND }}>
                                ຊື່ລູກຄ້າ
                            </label>
                            <input
                                id="profile-name"
                                type="text"
                                name="name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                className={inputClass}
                                autoComplete="name"
                            />
                            <InputError message={form.errors.name} className="mt-1" />
                        </div>

                        <div>
                            <label htmlFor="profile-phone" className={labelClass} style={{ color: BRAND }}>
                                ເບີໂທລະສັບ
                            </label>
                            <input
                                id="profile-phone"
                                type="tel"
                                name="phone"
                                inputMode="numeric"
                                placeholder={PHONE_PLACEHOLDER}
                                value={form.data.phone}
                                onChange={(e) => form.setData('phone', digitsOnly(e.target.value))}
                                className={inputClass}
                                autoComplete="tel"
                            />
                            <InputError message={form.errors.phone} className="mt-1" />
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className={labelClass} style={{ color: BRAND }}>
                                        ລະຫັດຜ່ານ
                                    </p>
                                    <p className="mt-1 font-mono text-sm tracking-widest text-slate-600">••••••••</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (editPassword) {
                                            form.setData('current_password', '');
                                            form.setData('password', '');
                                            form.setData('password_confirmation', '');
                                            setShowCurrentPassword(false);
                                            setShowNewPassword(false);
                                            setShowConfirmPassword(false);
                                        }
                                        setEditPassword((v) => !v);
                                    }}
                                    className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-white"
                                    style={{ borderColor: BRAND, color: BRAND }}
                                >
                                    {editPassword ? 'ປິດ' : 'ແກ້ໄຂ'}
                                </button>
                            </div>

                            {editPassword ? (
                                <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
                                    <PasswordField
                                        id="current_password"
                                        label="ລະຫັດປັດຈຸບັນ"
                                        labelClass={labelClass}
                                        value={form.data.current_password}
                                        onChange={(e) => form.setData('current_password', e.target.value)}
                                        error={form.errors.current_password}
                                        autoComplete="current-password"
                                        visible={showCurrentPassword}
                                        onToggleVisible={() => setShowCurrentPassword((v) => !v)}
                                        inputClass={inputClass}
                                    />
                                    <PasswordField
                                        id="password"
                                        label="ລະຫັດໃໝ່"
                                        labelClass={labelClass}
                                        value={form.data.password}
                                        onChange={(e) => form.setData('password', e.target.value)}
                                        error={form.errors.password}
                                        autoComplete="new-password"
                                        visible={showNewPassword}
                                        onToggleVisible={() => setShowNewPassword((v) => !v)}
                                        inputClass={inputClass}
                                    />
                                    <PasswordField
                                        id="password_confirmation"
                                        label="ຢືນຢັນລະຫັດໃໝ່"
                                        labelClass={labelClass}
                                        value={form.data.password_confirmation}
                                        onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                        error={form.errors.password_confirmation}
                                        autoComplete="new-password"
                                        visible={showConfirmPassword}
                                        onToggleVisible={() => setShowConfirmPassword((v) => !v)}
                                        inputClass={inputClass}
                                    />
                                </div>
                            ) : null}
                        </div>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="font-lao w-full rounded-lg py-3 text-center text-sm font-bold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60 sm:text-base"
                            style={{ backgroundColor: BRAND }}
                        >
                            {form.processing ? 'ກຳລັງບັນທຶກ…' : 'ບັນທຶກຂໍ້ມູນ'}
                        </button>
                    </form>
                </div>
            </div>
        </CustomerLayout>
    );
}
