import { X } from 'lucide-react';

// ຫົວ modal ແຜງຄິວ — ສີຟ້າ #194c9f
const HEADER_CLASS =
    'flex items-center justify-between bg-[#194c9f] px-4 py-3.5 font-sans text-white';

export default function DashboardModalShell({ title, icon: Icon, onClose, children, footer }) {
    return (
        <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-modal-title"
            onClick={onClose}
        >
            <div
                className="max-h-[min(92dvh,720px)] w-full max-w-lg overflow-hidden overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={HEADER_CLASS}>
                    <div className="flex min-w-0 items-center gap-2.5">
                        {Icon ? <Icon className="h-5 w-5 shrink-0 opacity-95" strokeWidth={2} /> : null}
                        <h2 id="dashboard-modal-title" className="truncate text-base font-bold tracking-tight">
                            {title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-white/90 transition hover:bg-white/10"
                        aria-label="ປິດ"
                    >
                        <X className="h-5 w-5" strokeWidth={2} />
                    </button>
                </div>
                <div className="border-t border-slate-200/80 bg-white px-4 py-5 font-sans sm:px-6">{children}</div>
                {footer ? (
                    <div className="border-t border-slate-200 bg-slate-50/80 px-4 py-4 font-sans sm:px-6">{footer}</div>
                ) : null}
            </div>
        </div>
    );
}

export function ModalFooterActions({
    onCancel,
    cancelLabel,
    onPrimary,
    primaryLabel,
    primaryDisabled,
    primaryLoading,
    primaryLoadingLabel = 'ກຳລັງ...',
    submitFormId,
}) {
    return (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
                type="button"
                onClick={onCancel}
                disabled={primaryLoading}
                className="min-h-[44px] min-w-[100px] rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
                {cancelLabel}
            </button>
            {submitFormId ? (
                <button
                    type="submit"
                    form={submitFormId}
                    disabled={primaryDisabled || primaryLoading}
                    className="min-h-[44px] min-w-[120px] rounded-lg bg-[#194c9f] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#153d85] disabled:opacity-55"
                >
                    {primaryLoading ? primaryLoadingLabel : primaryLabel}
                </button>
            ) : (
                <button
                    type="button"
                    onClick={onPrimary}
                    disabled={primaryDisabled || primaryLoading}
                    className="min-h-[44px] min-w-[120px] rounded-lg bg-[#194c9f] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#153d85] disabled:opacity-55"
                >
                    {primaryLoading ? primaryLoadingLabel : primaryLabel}
                </button>
            )}
        </div>
    );
}
