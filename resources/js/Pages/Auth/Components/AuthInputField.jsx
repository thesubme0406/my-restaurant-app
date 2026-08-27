import { Eye, EyeOff } from 'lucide-react';

export default function AuthInputField({
    id,
    label,
    icon: Icon,
    type = 'text',
    value,
    onChange,
    autoComplete,
    showToggle = false,
    isVisible = false,
    onToggleVisibility,
    isFocused = false,
    placeholder,
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-white">
                {label}
            </label>
            <div className="relative">
                {Icon ? (
                    <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#194c9f]">
                        <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </span>
                ) : null}
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    autoFocus={isFocused}
                    placeholder={placeholder}
                    className="h-12 w-full rounded-xl border border-white/40 bg-white/95 pl-12 pr-12 text-sm text-slate-900 outline-none transition focus:border-white focus:ring-2 focus:ring-white/60"
                />
                {showToggle ? (
                    <button
                        type="button"
                        onClick={onToggleVisibility}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#194c9f] hover:bg-slate-100"
                        aria-label="toggle password visibility"
                    >
                        {isVisible ? <EyeOff className="h-5 w-5" strokeWidth={2.2} /> : <Eye className="h-5 w-5" strokeWidth={2.2} />}
                    </button>
                ) : null}
            </div>
        </div>
    );
}
