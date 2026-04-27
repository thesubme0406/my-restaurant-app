import InputError from '@/Components/InputError';
import AuthInputField from '@/Pages/Auth/Components/AuthInputField';
import LoginCard from '@/Pages/Auth/Components/LoginCard';
import PrimaryButton from '@/Pages/Auth/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { Lock, Phone } from 'lucide-react';
import { useState } from 'react';

export default function Login({ status, isStaffLogin = false, redirectTo = '' }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        phone: '',
        password: '',
        remember: false,
        redirect_to: redirectTo ?? '',
    });
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [notice, setNotice] = useState('');

    const submit = (e) => {
        e.preventDefault();

        post(isStaffLogin ? route('admin.login.store') : route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const pageTitle = isStaffLogin ? 'Staff Login' : 'Customer Login';
    const backgroundClass = isStaffLogin
        ? 'min-h-screen bg-gradient-to-br from-[#194c9f] via-[#1d4fa4] to-[#123774] p-4'
        : 'min-h-screen bg-gradient-to-br from-[#194c9f] via-[#225ab9] to-[#143a78] p-4';

    return (
        <div className={backgroundClass}>
            <Head title={pageTitle} />

            <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center">
                {!isStaffLogin ? (
                    <LoginCard
                        data={data}
                        setData={setData}
                        submit={submit}
                        processing={processing}
                        errors={errors}
                        status={status}
                        notice={notice}
                        onNotice={() => setNotice('ຂໍອະໄພ, ຕອນນີ້ຍັງບໍ່ເປີດໃຊ້ຟີເຈີລືມລະຫັດຜ່ານ.')}
                    />
                ) : (
                    <div className="w-full max-w-md rounded-2xl border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
                        <div className="mb-5 text-center">
                            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
                                <img src="/images/oshinei-logo.png?v=4" alt="Oshinei" className="h-14 w-14 object-contain" />
                            </div>
                            <h1 className="text-2xl font-bold text-white">ລະບົບພະນັກງານ</h1>
                            <p className="mt-1 text-sm text-white/85">ເຂົ້າສູ່ Dashboard ຂອງຮ້ານ Oshinei</p>
                        </div>

                        {status ? <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{status}</div> : null}

                        <form onSubmit={submit} className="space-y-4">
                            <AuthInputField
                                id="phone"
                                label="ເບີໂທລະສັບ"
                                type="tel"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                icon={Phone}
                                autoComplete="tel"
                                isFocused
                            />
                            <InputError message={errors.phone} className="mt-1 text-white" />

                            <AuthInputField
                                id="password"
                                label="ລະຫັດຜ່ານ"
                                type={passwordVisible ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                icon={Lock}
                                autoComplete="current-password"
                                showToggle
                                isVisible={passwordVisible}
                                onToggleVisibility={() => setPasswordVisible((prev) => !prev)}
                            />
                            <InputError message={errors.password} className="mt-1 text-white" />

                            <label className="flex items-center gap-2 text-sm text-white/90">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-4 w-4 rounded border-white/50 text-[#194c9f] focus:ring-[#194c9f]"
                                />
                                ຈື່ຂ້ອຍໄວ້
                            </label>

                            <PrimaryButton type="submit" disabled={processing} className="w-full">
                                {processing ? 'ກຳລັງເຂົ້າລະບົບ...' : 'ເຂົ້າລະບົບ'}
                            </PrimaryButton>

                            <div className="text-center text-sm text-white/85">
                                ຕ້ອງການເຂົ້າລະບົບລູກຄ້າ?{' '}
                                <Link href={route('login')} className="font-semibold text-white underline">
                                    ໄປທີ່ /login
                                </Link>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
