import ApplicationLogo from '@/Components/ApplicationLogo';
import LoginCard from '@/Pages/Auth/Components/LoginCard';
import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, Lock, Phone } from 'lucide-react';
import { useState } from 'react';

const LOGO_SRC = '/images/oshinei-logo.png?v=20260423';

export default function Login({ status, guard = 'customer' }) {
    const isStaffLogin = guard === 'staff';
    const [staffLogoError, setStaffLogoError] = useState(false);
    const [showStaffPassword, setShowStaffPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        phone: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(isStaffLogin ? route('admin.login.store') : route('customer.login.store'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div
            className={`min-h-screen px-4 py-8 sm:py-10 ${isStaffLogin ? 'bg-slate-100' : ''}`}
            style={
                isStaffLogin
                    ? {
                          backgroundColor: '#194c9f',
                          backgroundImage:
                              'linear-gradient(160deg, rgba(255,255,255,0.08), transparent 45%), repeating-radial-gradient(circle at 60% 120%, rgba(255,255,255,0.06) 0 2px, transparent 2px 11px)',
                      }
                    : {
                          backgroundColor: '#194c9f',
                          backgroundImage:
                              'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.14), transparent 36%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.08), transparent 32%), repeating-radial-gradient(circle at 50% 120%, rgba(255,255,255,0.07) 0 2px, transparent 2px 12px)',
                      }
            }
        >
            <Head title={isStaffLogin ? 'Staff Login' : 'Customer Login'} />

            {/* ປ້ອງກັນການ stretch ໃນ Desktop */}
            <div className="mx-auto flex min-h-[84vh] max-w-5xl items-center justify-center">
                {!isStaffLogin ? (
                    <LoginCard
                        data={data}
                        setData={setData}
                        submit={submit}
                        processing={processing}
                        errors={errors}
                        status={status}
                    />
                ) : (
                    <div className="w-[90%] max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl shadow-black/25 backdrop-blur-md sm:p-8">
                        <div className="mb-5 flex justify-center">
                            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/80 bg-white p-2 shadow-[0_0_25px_rgba(255,255,255,0.35)]">
                                {!staffLogoError ? (
                                    <img
                                        src={LOGO_SRC}
                                        alt="Oshinei Logo"
                                        onError={() => setStaffLogoError(true)}
                                        className="h-full w-full rounded-full object-cover"
                                    />
                                ) : (
                                    <ApplicationLogo className="h-full w-full fill-[#194c9f]" />
                                )}
                            </div>
                        </div>
                        <div className="mb-6 text-center">
                            <h1 className="text-2xl font-bold text-white">ລະບົບພະນັກງານ</h1>
                            <p className="mt-1 text-sm text-white/80">ເຂົ້າໃຊ້ງານດ້ວຍບັນຊີພະນັກງານ</p>
                        </div>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4 text-[#194c9f]">
                                    <Phone className="h-5 w-5" strokeWidth={2.2} />
                                </span>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="ເບີໂທລະສັບ"
                                    className="h-12 w-full rounded-xl border border-white/40 bg-white pl-12 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                                    autoFocus
                                />
                            </div>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4 text-[#194c9f]">
                                    <Lock className="h-5 w-5" strokeWidth={2.2} />
                                </span>
                                <input
                                    type={showStaffPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="ລະຫັດຜ່ານ"
                                    className="h-12 w-full rounded-xl border border-white/40 bg-white pl-12 pr-12 text-sm font-medium text-slate-900 outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowStaffPassword((prev) => !prev)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#194c9f] transition hover:text-[#153d82]"
                                    aria-label={showStaffPassword ? 'ປິດການສະແດງລະຫັດຜ່ານ' : 'ສະແດງລະຫັດຜ່ານ'}
                                >
                                    {showStaffPassword ? (
                                        <EyeOff className="h-5 w-5" strokeWidth={2.2} />
                                    ) : (
                                        <Eye className="h-5 w-5" strokeWidth={2.2} />
                                    )}
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="h-12 w-full rounded-xl bg-white text-sm font-semibold text-[#153d82] shadow-md transition hover:scale-[1.02] hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                            >
                                {processing ? 'ກຳລັງເຂົ້າລະບົບ...' : 'ເຂົ້າສູ່ລະບົບ'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
