import InputError from '@/Components/InputError';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthInputField({
    id,
    name,
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    autoComplete,
    icon: Icon,
    error,
    isFocused = false,
    showToggle = false,
    isVisible = false,
    onToggleVisibility,
}) {
    const currentType = showToggle ? (isVisible ? 'text' : 'password') : type;

    return (
        <div>
            {label ? <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-white/95">{label}</label> : null}
            <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4 text-[#194c9f]">
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <input
                    id={id}
                    name={name}
                    type={currentType}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    autoFocus={isFocused}
                    className="h-12 w-full rounded-xl border border-white/40 bg-white/95 pl-12 pr-12 text-sm font-medium text-slate-900 outline-none backdrop-blur-sm transition placeholder:text-slate-500 focus:border-white focus:ring-2 focus:ring-white/30"
                />
                {showToggle ? (
                    <button
                        type="button"
                        onClick={onToggleVisibility}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#194c9f] transition hover:text-[#153d82]"
                        aria-label={isVisible ? 'ປິດການສະແດງລະຫັດຜ່ານ' : 'ສະແດງລະຫັດຜ່ານ'}
                    >
                        {isVisible ? <EyeOff className="h-5 w-5" strokeWidth={2.2} /> : <Eye className="h-5 w-5" strokeWidth={2.2} />}
                    </button>
                ) : null}
            </div>
            <InputError message={error} className="mt-2" />
        </div>
    );
}
