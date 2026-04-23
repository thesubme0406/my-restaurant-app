import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

export default function AuthInput({
    id,
    name,
    label,
    type = 'text',
    value,
    error,
    autoComplete,
    onChange,
    isFocused = false,
    placeholder = '',
}) {
    return (
        <div>
            <InputLabel htmlFor={id} value={label} className="text-slate-700" />
            <TextInput
                id={id}
                name={name}
                type={type}
                value={value}
                autoComplete={autoComplete}
                isFocused={isFocused}
                onChange={onChange}
                placeholder={placeholder}
                className="mt-2 block h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 shadow-sm focus:border-[#194c9f] focus:ring-[#194c9f]"
            />
            <InputError message={error} className="mt-2" />
        </div>
    );
}
