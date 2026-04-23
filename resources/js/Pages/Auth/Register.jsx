import ApplicationLogo from '@/Components/ApplicationLogo';
import AuthInputField from '@/Pages/Auth/Components/AuthInputField';
import PrimaryButton from '@/Pages/Auth/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { Lock, Phone, UserRound } from 'lucide-react';
import { useState } from 'react';

const LOGO_SRC = '/images/oshinei-logo.png?v=20260423';

export default function Register() {
    const [logoError, setLogoError] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <div
            className="min-h-screen px-4 py-8 sm:py-10"
            style={{
                backgroundColor: '#194c9f',
                backgroundImage:
                    'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.14), transparent 36%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.08), transparent 32%), repeating-radial-gradient(circle at 50% 120%, rgba(255,255,255,0.07) 0 2px, transparent 2px 12px)',
            }}
        >
            <Head title="Register" />

            <div className="mx-auto flex min-h-[84vh] max-w-5xl items-center justify-center">
                <div className="w-[90%] max-w-md rounded-2xl border border-white/15 bg-white/5 p-4 shadow-2xl shadow-black/20 backdrop-blur-md sm:p-6">
                    <div className="mb-6 flex justify-center">
                        <div className="flex h-32 w-32 items-center justify-center rounded-full border border-white/80 bg-white p-2 shadow-[0_0_25px_rgba(255,255,255,0.45)] sm:h-36 sm:w-36">
                            {!logoError ? (
                                <img
                                    src={LOGO_SRC}
                                    alt="Oshinei Logo"
                                    onError={() => setLogoError(true)}
                                    className="h-full w-full rounded-full object-cover"
                                />
                            ) : (
                                <ApplicationLogo className="h-full w-full fill-[#194c9f]" />
                            )}
                        </div>
                    </div>

                    <h1 className="text-center text-2xl font-bold text-white">ລົງທະບຽນບັນຊີ</h1>
                    <p className="mt-1 text-center text-sm text-white/80">ສໍາລັບລູກຄ້າ Oshinei</p>

                    <form onSubmit={submit} className="mt-5 space-y-4">
                        <AuthInputField
                            id="name"
                            name="name"
                            label="ຊື່ ແລະ ນາມສະກຸນ"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="ຊື່ ແລະ ນາມສະກຸນ"
                            autoComplete="name"
                            icon={UserRound}
                            error={errors.name}
                            isFocused={true}
                        />

                        <AuthInputField
                            id="phone"
                            name="phone"
                            label="ເບີໂທລະສັບ"
                            type="tel"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="ເບີໂທລະສັບ"
                            autoComplete="tel"
                            icon={Phone}
                            error={errors.phone}
                        />

                        <AuthInputField
                            id="password"
                            name="password"
                            label="ລະຫັດຜ່ານ"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="ລະຫັດຜ່ານ"
                            autoComplete="new-password"
                            icon={Lock}
                            error={errors.password}
                            showToggle={true}
                            isVisible={showPassword}
                            onToggleVisibility={() => setShowPassword((prev) => !prev)}
                        />

                        <AuthInputField
                            id="password_confirmation"
                            name="password_confirmation"
                            label="ຢືນຢັນລະຫັດຜ່ານ"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="ຢືນຢັນລະຫັດຜ່ານ"
                            autoComplete="new-password"
                            icon={Lock}
                            error={errors.password_confirmation}
                            showToggle={true}
                            isVisible={showConfirmPassword}
                            onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
                        />

                        <PrimaryButton type="submit" disabled={processing}>
                            {processing ? 'ກຳລັງລົງທະບຽນ...' : 'ລົງທະບຽນ'}
                        </PrimaryButton>
                    </form>

                    <p className="mt-5 text-center text-sm text-white/85">
                        ມີບັນຊີແລ້ວບໍ?{' '}
                        <Link
                            href={route('login')}
                            className="font-semibold text-white underline decoration-white/70 underline-offset-4 hover:text-slate-100"
                        >
                            ເຂົ້າສູ່ລະບົບ
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
