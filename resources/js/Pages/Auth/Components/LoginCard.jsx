import InputError from '@/Components/InputError';
import AuthInputField from '@/Pages/Auth/Components/AuthInputField';
import PrimaryButton from '@/Pages/Auth/Components/PrimaryButton';
import { Link } from '@inertiajs/react';
import { Lock, Phone } from 'lucide-react';
import { useState } from 'react';

export default function LoginCard({
    data,
    setData,
    submit,
    processing,
    errors,
    status,
    notice,
    onNotice,
}) {
    const [passwordVisible, setPasswordVisible] = useState(false);

    return (
        <div className="w-full max-w-md rounded-2xl border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
            <div className="mb-5 text-center">
                <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
                    <img src="/images/oshinei-logo.png?v=4" alt="Oshinei" className="h-14 w-14 object-contain" />
                </div>
                <h1 className="text-2xl font-bold text-white">ຍິນດີຕ້ອນຮັບສູ່ Oshinei</h1>
                <p className="mt-1 text-sm text-white/85">ເຂົ້າສູ່ລະບົບລູກຄ້າເພື່ອຈອງຄິວໄດ້ທັນທີ</p>
            </div>

            {status ? <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{status}</div> : null}
            {notice ? <div className="mb-3 rounded-lg bg-white/20 px-3 py-2 text-sm text-white">{notice}</div> : null}

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

                <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm text-white/90">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="h-4 w-4 rounded border-white/50 text-[#194c9f] focus:ring-[#194c9f]"
                        />
                        ຈື່ຂ້ອຍໄວ້
                    </label>
                    <button type="button" onClick={onNotice} className="text-sm font-medium text-white underline">
                        ລືມລະຫັດຜ່ານ?
                    </button>
                </div>

                <PrimaryButton type="submit" disabled={processing} className="w-full">
                    {processing ? 'ກຳລັງເຂົ້າລະບົບ...' : 'LOG IN'}
                </PrimaryButton>

                <div className="text-center text-sm text-white/90">
                    ລູກຄ້າໃໝ່?{' '}
                    <Link href={route('register')} className="font-semibold text-white underline">
                        Register
                    </Link>
                </div>
            </form>
        </div>
    );
}
