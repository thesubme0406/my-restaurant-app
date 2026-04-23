import ApplicationLogo from '@/Components/ApplicationLogo';
import Checkbox from '@/Components/Checkbox';
import { Link } from '@inertiajs/react';
import { Lock, Phone } from 'lucide-react';
import { useState } from 'react';
import AuthInputField from '@/Pages/Auth/Components/AuthInputField';
import PrimaryButton from '@/Pages/Auth/Components/PrimaryButton';

const LOGO_SRC = '/images/oshinei-logo.png?v=20260423';

export default function LoginCard({ data, setData, submit, processing, errors, status }) {
    const [showPassword, setShowPassword] = useState(false);
    const [logoError, setLogoError] = useState(false);
    const [featureNotice, setFeatureNotice] = useState('');
    const hideRegister =
        typeof window !== 'undefined' && window.location.pathname.includes('/admin');

    return (
        <div className="w-[90%] max-w-md rounded-2xl border border-white/15 bg-white/5 p-4 shadow-2xl shadow-black/20 backdrop-blur-md sm:p-6">
            {/* ຈັດວາງ Logo ຢູ່ກາງ */}
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

            <h1 className="text-center text-2xl font-bold text-white">ເຂົ້າສູ່ລະບົບ</h1>
            <p className="mt-1 text-center text-sm text-white/80">ຍິນດີຕ້ອນຮັບສູ່ Oshinei</p>

            {status && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    {status}
                </div>
            )}
            {featureNotice && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                    {featureNotice}
                </div>
            )}

            <form onSubmit={submit} className="mt-5 space-y-4">
                <AuthInputField
                    id="phone"
                    name="phone"
                    type="tel"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    placeholder="ເບີໂທລະສັບ"
                    autoComplete="tel"
                    icon={Phone}
                    error={errors.phone}
                    isFocused={true}
                />

                <AuthInputField
                    id="password"
                    name="password"
                    type="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="ລະຫັດຜ່ານ"
                    autoComplete="current-password"
                    icon={Lock}
                    error={errors.password}
                    showToggle={true}
                    isVisible={showPassword}
                    onToggleVisibility={() => setShowPassword((prev) => !prev)}
                />

                <div className="flex items-center justify-between">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        <span className="ms-2 text-sm text-white/90">ຈື່ຂ້ອຍໄວ້</span>
                    </label>
                    <button
                        type="button"
                        onClick={() => setFeatureNotice('ຂໍອະໄພ, ຕອນນີ້ຍັງບໍ່ເປີດໃຊ້ຟີເຈີລືມລະຫັດຜ່ານ.')}
                        className="text-sm font-medium text-white/80 underline decoration-white/60 hover:text-white"
                    >
                        ລືມລະຫັດຜ່ານ?
                    </button>
                </div>

                <PrimaryButton type="submit" disabled={processing}>
                    {processing ? 'ກຳລັງເຂົ້າລະບົບ...' : 'ເຂົ້າສູ່ລະບົບ'}
                </PrimaryButton>
            </form>

            {!hideRegister ? (
                <p className="mt-5 text-center text-sm text-white/85">
                    ຍັງບໍ່ມີບັນຊີ?{' '}
                    <Link
                        href={route('register')}
                        className="font-semibold text-white underline decoration-white/70 underline-offset-4 hover:text-slate-100"
                    >
                        ລົງທະບຽນ
                    </Link>
                </p>
            ) : null}
        </div>
    );
}
