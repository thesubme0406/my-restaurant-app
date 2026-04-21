import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
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

    const fieldClass =
        'mt-1 w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-0';

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="space-y-8">
                <div>
                    <h1 className="text-lg font-medium tracking-tight text-slate-900">
                        Create account
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Customers only. Book tables and manage your visits.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <label
                            htmlFor="name"
                            className="text-xs font-medium uppercase tracking-wide text-slate-500"
                        >
                            Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            name="name"
                            value={data.name}
                            className={fieldClass}
                            autoComplete="name"
                            autoFocus
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>

                    <div>
                        <label
                            htmlFor="phone"
                            className="text-xs font-medium uppercase tracking-wide text-slate-500"
                        >
                            Phone
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            name="phone"
                            value={data.phone}
                            className={fieldClass}
                            autoComplete="tel"
                            onChange={(e) => setData('phone', e.target.value)}
                        />
                        <InputError message={errors.phone} className="mt-1" />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="text-xs font-medium uppercase tracking-wide text-slate-500"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className={fieldClass}
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <InputError message={errors.password} className="mt-1" />
                    </div>

                    <div>
                        <label
                            htmlFor="password_confirmation"
                            className="text-xs font-medium uppercase tracking-wide text-slate-500"
                        >
                            Confirm password
                        </label>
                        <input
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className={fieldClass}
                            autoComplete="new-password"
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                        />
                    </div>

                    <PrimaryButton
                        className="w-full justify-center rounded-none bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 focus:ring-slate-900"
                        disabled={processing}
                    >
                        Register
                    </PrimaryButton>
                </form>

                <p className="text-center text-sm text-slate-500">
                    Already have an account?{' '}
                    <Link
                        href={route('login')}
                        className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </GuestLayout>
    );
}
