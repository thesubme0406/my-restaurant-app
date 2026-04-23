export default function PrimaryButton({ type = 'button', disabled = false, children }) {
    return (
        <button
            type={type}
            disabled={disabled}
            className="h-14 w-full rounded-xl bg-white px-5 text-base font-bold text-[#153d82] shadow-lg shadow-black/20 transition duration-200 hover:scale-105 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-white/70 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:scale-100"
        >
            {children}
        </button>
    );
}
