export default function PrimaryButton({ children, className = '', ...props }) {
    return (
        <button
            {...props}
            className={`inline-flex h-14 items-center justify-center rounded-xl bg-white px-6 text-base font-extrabold tracking-wide text-[#194c9f] shadow-lg transition hover:scale-[1.01] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
        >
            {children}
        </button>
    );
}
