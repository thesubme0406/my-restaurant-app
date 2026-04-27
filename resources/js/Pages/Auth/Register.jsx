import InputError from '@/Components/InputError';
import AuthInputField from '@/Pages/Auth/Components/AuthInputField';
import PrimaryButton from '@/Pages/Auth/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { Lock, Phone, User } from 'lucide-react';
import { useState } from 'react';

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

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#194c9f] via-[#225ab9] to-[#143a78] p-4">
            <Head title="Register" />

            <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center">
                <div className="w-full max-w-md rounded-2xl border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
                    <div className="mb-5 text-center">
                        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
                            <img src="/images/oshinei-logo.png?v=4" alt="Oshinei" className="h-14 w-14 object-contain" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">ສ້າງບັນຊີລູກຄ້າ</h1>
                        <p className="mt-1 text-sm text-white/85">ລົງທະບຽນເພື່ອຈອງຄິວແລະເບິ່ງເມນູ</p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                    <div>
                        <AuthInputField
                            id="name"
                            label="ຊື່ຂອງທ່ານ"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            icon={User}
                            autoComplete="name"
                            isFocused
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>

                    <div>
                        <AuthInputField
                            id="phone"
                            label="ເບີໂທລະສັບ"
                            type="tel"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            icon={Phone}
                            autoComplete="tel"
                        />
                        <InputError message={errors.phone} className="mt-1 text-white" />
                    </div>

                    <div>
                        <AuthInputField
                            id="password"
                            label="ລະຫັດຜ່ານ"
                            type={passwordVisible ? 'text' : 'password'}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            icon={Lock}
                            autoComplete="new-password"
                            showToggle
                            isVisible={passwordVisible}
                            onToggleVisibility={() => setPasswordVisible((prev) => !prev)}
                        />
                        <InputError message={errors.password} className="mt-1 text-white" />
                    </div>

                    <div>
                        <AuthInputField
                            id="password_confirmation"
                            label="ຢືນຢັນລະຫັດຜ່ານ"
                            type={confirmPasswordVisible ? 'text' : 'password'}
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            icon={Lock}
                            autoComplete="new-password"
                            showToggle
                            isVisible={confirmPasswordVisible}
                            onToggleVisibility={() =>
                                setConfirmPasswordVisible((prev) => !prev)
                            }
                        />
                    </div>

                    <PrimaryButton
                        className="mt-2 w-full"
                        disabled={processing}
                    >
                        {processing ? 'ກຳລັງລົງທະບຽນ...' : 'REGISTER'}
                    </PrimaryButton>
                </form>

                <p className="mt-4 text-center text-sm text-white/90">
                    ມີບັນຊີແລ້ວ?{' '}
                    <Link
                        href={route('login')}
                        className="font-semibold text-white underline"
                    >
                        ເຂົ້າສູ່ລະບົບ
                    </Link>
                </p>
                </div>
            </div>
        </div>
    );
}
