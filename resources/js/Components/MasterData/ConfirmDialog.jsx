import { X } from 'lucide-react';

const defaultPrimary = '#194c9f';

// ປັອບອັບຢືນຢັນ (ລຶບ / ທຳລາຍ)
export default function ConfirmDialog({
    open,
    onClose,
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    processing = false,
    primaryColor = defaultPrimary,
    danger = true,
}) {
    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/50 p-3 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            onClick={() => !processing && onClose()}
        >
            <div
                className="w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="flex items-center justify-between px-4 py-3.5 text-white sm:px-5"
                    style={{ backgroundColor: primaryColor }}
                >
                    <h2 id="confirm-dialog-title" className="text-base font-bold">
                        {title}
                    </h2>
                    <button
                        type="button"
                        disabled={processing}
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-white/90 hover:bg-white/10 disabled:opacity-50"
                        aria-label="ປິດ"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="border-t border-slate-100 px-4 py-5 text-sm leading-relaxed text-slate-700 sm:px-6">{message}</div>
                <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50/90 px-4 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
                    <button
                        type="button"
                        disabled={processing}
                        onClick={onClose}
                        className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        disabled={processing}
                        onClick={onConfirm}
                        className={`min-h-[44px] rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50 ${
                            danger ? 'bg-rose-600 hover:bg-rose-700' : ''
                        }`}
                        style={danger ? undefined : { backgroundColor: primaryColor }}
                    >
                        {processing ? 'ກຳລັງດຳເນີນ…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
