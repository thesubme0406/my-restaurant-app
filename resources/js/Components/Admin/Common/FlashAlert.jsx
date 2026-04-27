export default function FlashAlert({ successMessage, errorMessage }) {
    if (!successMessage && !errorMessage) {
        return null;
    }

    return (
        <div className="space-y-2">
            {successMessage ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                    {successMessage}
                </div>
            ) : null}
            {errorMessage ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700">
                    {errorMessage}
                </div>
            ) : null}
        </div>
    );
}
