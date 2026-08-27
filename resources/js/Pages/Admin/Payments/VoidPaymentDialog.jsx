import { formatAmount } from '@/utils/formatAmount';
import { AlertTriangle, Eye, EyeOff, Lock, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

const primary = '#194c9f';

export default function VoidPaymentDialog({ open, row, onClose, onConfirm, processing = false, serverError = '' }) {
    const formId = useId();
    const reasonId = `${formId}-reason`;
    const secretId = `${formId}-secret`;

    const [reason, setReason] = useState('');
    const [secret, setSecret] = useState('');
    const [showSecret, setShowSecret] = useState(false);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (open) {
            setReason('');
            setSecret('');
            setShowSecret(false);
            setLocalError('');
        }
    }, [open, row?.id]);

    if (!open || !row) {
        return null;
    }

    const displayError = localError || serverError;

    const handleSubmit = (event) => {
        event.preventDefault();
        const trimmedReason = reason.trim();
        if (trimmedReason.length < 3) {
            setLocalError('ກະລຸນາລະບຸເຫດຜົນຢ່າງໜ້ອຍ 3 ຕົວອັກສອນ');
            return;
        }
        if (!secret) {
            setLocalError('ກະລຸນາໃສ່ລະຫັດຜ່ານເພື່ອຢືນຢັນ');
            return;
        }
        setLocalError('');
        onConfirm({ reason: trimmedReason, password: secret });
    };

    const fieldClass =
        'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/15';

    return (
        <div
            className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-4"
            role="presentation"
            onClick={() => !processing && onClose()}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${formId}-title`}
                className="relative mb-[max(0.5rem,env(safe-area-inset-bottom,0px))] w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl sm:mb-0"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="relative overflow-hidden px-5 pb-4 pt-6 text-center">
                    <div
                        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-rose-50 to-transparent"
                        aria-hidden
                    />
                    <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 ring-8 ring-rose-50">
                        <AlertTriangle className="h-7 w-7 text-rose-600" strokeWidth={2.2} />
                    </div>
                    <h2 id={`${formId}-title`} className="relative mt-4 text-lg font-bold tracking-tight text-slate-900">
                        ຢືນຢັນການຍົກເລີກບິນຊຳລະ
                    </h2>
                    <p className="relative mt-1 text-sm text-slate-500">ການກະທຳນີ້ຈະຖືກບັນທຶກໃນລະບົບກວດສອບ</p>
                </div>

                <div className="mx-5 rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-500">Payment ID</span>
                        <span className="font-bold text-slate-900">#{row.id}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-500">ຍອດລວມ</span>
                        <span className="font-bold text-rose-700">{formatAmount(row.total_amount)} K</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-500">ໂຕະ</span>
                        <span className="font-bold" style={{ color: primary }}>
                            {row.table_no ?? '—'}
                        </span>
                    </div>
                </div>

                <form
                    id={formId}
                    autoComplete="off"
                    data-form-type="other"
                    onSubmit={handleSubmit}
                    className="space-y-4 px-5 pb-2 pt-5"
                >
                    <div>
                        <label htmlFor={reasonId} className="text-xs font-bold text-slate-700">
                            ເຫດຜົນການຍົກເລີກ <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            id={reasonId}
                            value={reason}
                            onChange={(event) => {
                                setReason(event.target.value);
                                setLocalError('');
                            }}
                            rows={3}
                            maxLength={500}
                            placeholder="ລະບຸເຫດຜົນທີ່ຊັດເຈນ (ຢ່າງໜ້ອຍ 3 ຕົວອັກສອນ)"
                            autoComplete="off"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            className={`${fieldClass} min-h-[88px] resize-none`}
                            disabled={processing}
                        />
                    </div>

                    <div>
                        <label htmlFor={secretId} className="text-xs font-bold text-slate-700">
                            ລະຫັດຜ່ານຢືນຢັນ <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Lock className="h-4 w-4" />
                            </span>
                            <input
                                id={secretId}
                                type="text"
                                inputMode="text"
                                value={secret}
                                onChange={(event) => {
                                    setSecret(event.target.value);
                                    setLocalError('');
                                }}
                                placeholder="ໃສ່ລະຫັດຜ່ານຂອງທ່ານ"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                data-lpignore="true"
                                data-1p-ignore="true"
                                data-form-type="other"
                                disabled={processing}
                                className={`${fieldClass} pl-10 pr-11`}
                                style={
                                    showSecret
                                        ? undefined
                                        : {
                                              WebkitTextSecurity: 'disc',
                                              textSecurity: 'disc',
                                          }
                                }
                            />
                            <button
                                type="button"
                                onClick={() => setShowSecret((prev) => !prev)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                aria-label={showSecret ? 'ເຊື່ອງລະຫັດຜ່ານ' : 'ສະແດງລະຫັດຜ່ານ'}
                                disabled={processing}
                            >
                                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <p className="mt-1.5 text-[11px] text-slate-500">ຕ້ອງຢືນຢັນດ້ວຍລະຫັດຜ່ານຜູ້ຈັດການເທົ່ານັ້ນ</p>
                    </div>

                    {displayError ? (
                        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                            {displayError}
                        </p>
                    ) : null}
                </form>

                <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        ຍົກເລີກ
                    </button>
                    <button
                        type="submit"
                        form={formId}
                        disabled={processing}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                ກຳລັງຍົກເລີກ...
                            </>
                        ) : (
                            'ຢືນຢັນຍົກເລີກ'
                        )}
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    disabled={processing}
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    aria-label="ປິດ"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
