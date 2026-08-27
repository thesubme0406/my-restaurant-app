import MoneyAmountInput from '@/Components/MoneyAmountInput';
import { formatAmount } from '@/utils/formatAmount';
import { normalizePaymentMethod, paymentMethodSelectOptions } from '@/utils/paymentMethod';
import { Pencil, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

const primary = '#194c9f';
const methodOptions = paymentMethodSelectOptions();

export default function EditVoidedPaymentDialog({
    open,
    row,
    onClose,
    onConfirm,
    processing = false,
    serverError = '',
}) {
    const formId = useId();
    const [method, setMethod] = useState('cash');
    const [totalAmount, setTotalAmount] = useState('');
    const [reason, setReason] = useState('');
    const [localError, setLocalError] = useState('');

    const calculatedAmount = Number(row?.calculated_amount ?? 0);
    const recordedAmount = Number(row?.total_amount ?? 0);

    useEffect(() => {
        if (open && row) {
            setMethod(normalizePaymentMethod(row.method));
            setTotalAmount(String(row.total_amount ?? ''));
            setReason('');
            setLocalError('');
        }
    }, [open, row?.id, row?.method, row?.total_amount]);

    if (!open || !row) {
        return null;
    }

    const displayError = localError || serverError;

    const handleSubmit = (event) => {
        event.preventDefault();
        const amount = Number(totalAmount || 0);
        const trimmedReason = reason.trim();

        if (!Number.isFinite(amount) || amount < 0) {
            setLocalError('ກະລຸນາລະບຸຍອດລວມທີ່ຖືກຕ້ອງ');
            return;
        }
        if (trimmedReason.length < 3) {
            setLocalError('ກະລຸນາລະບຸເຫດຜົນການແກ້ໄຂ (ຢ່າງໜ້ອຍ 3 ຕົວອັກສອນ)');
            return;
        }

        setLocalError('');
        onConfirm({
            total_amount: amount,
            method,
            reason: trimmedReason,
        });
    };

    const fieldClass =
        'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/15';

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
                <div className="border-b border-slate-100 px-5 py-4" style={{ backgroundColor: primary }}>
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                            <Pencil className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 id={`${formId}-title`} className="text-lg font-bold text-white">
                                ແກ້ໄຂບິນທີ່ຖືກຍົກເລີກ
                            </h2>
                            <p className="mt-0.5 text-sm text-white/85">
                                ປັບຍອດຊຳລະ ແລະ ກູ້ຄືນເຂົ້າລາຍງານລາຍຮັບ
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mx-5 mt-4 rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-500">Payment ID</span>
                        <span className="font-bold text-slate-900">#{row.id}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-500">ໂຕະ</span>
                        <span className="font-bold" style={{ color: primary }}>
                            {row.table_no ?? '—'}
                        </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-500">Tier / ລູກຄ້າ</span>
                        <span className="text-right font-medium text-slate-700">
                            {row.buffet_tier ?? '—'} · {row.guest_count ?? 0} ຄົນ
                        </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200/80 pt-2">
                        <span className="font-semibold text-slate-500">ຍອດຄຳນວນອັດຕະໂນມັດ</span>
                        <span className="font-bold text-slate-900">{formatAmount(calculatedAmount)} K</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500">ຍອດບັນທຶກເດີມ (ກ່ອນຍົກເລີກ)</span>
                        <span className="text-xs font-semibold text-slate-600">{formatAmount(recordedAmount)} K</span>
                    </div>
                </div>

                <form id={formId} onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
                    <div>
                        <label htmlFor={`${formId}-method`} className="text-xs font-bold text-slate-700">
                            ວິທີຊຳລະ <span className="text-rose-500">*</span>
                        </label>
                        <select
                            id={`${formId}-method`}
                            value={method}
                            onChange={(event) => setMethod(event.target.value)}
                            disabled={processing}
                            className={fieldClass}
                        >
                            {methodOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor={`${formId}-amount`} className="text-xs font-bold text-slate-700">
                            ຍອດເງິນທີ່ແກ້ໄຂ <span className="text-rose-500">*</span>
                        </label>
                        <MoneyAmountInput
                            id={`${formId}-amount`}
                            value={totalAmount}
                            onChange={setTotalAmount}
                            disabled={processing}
                            className={fieldClass}
                        />
                        <p className="mt-1 text-[11px] text-slate-500">
                            ສຳລັບສ່ວນຫຼຸດ ຫຼື ແກ້ຂໍ້ຜິດພາດ — ຍອດນີ້ຈະນັບໃນລາຍງານລາຍຮັບ
                        </p>
                    </div>

                    <div>
                        <label htmlFor={`${formId}-reason`} className="text-xs font-bold text-slate-700">
                            ເຫດຜົນການແກ້ໄຂ <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            id={`${formId}-reason`}
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            disabled={processing}
                            rows={3}
                            placeholder="ຕົວຢ່າງ: ສ່ວນຫຼຸດພິເສດ, ກົດຜິດຈຳນວນລູກຄ້າ..."
                            className={`${fieldClass} resize-y`}
                        />
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
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ backgroundColor: primary }}
                    >
                        {processing ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                ກຳລັງບັນທຶກ...
                            </>
                        ) : (
                            'ບັນທຶກແລະກູ້ຄືນ'
                        )}
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    disabled={processing}
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 disabled:opacity-50"
                    aria-label="ປິດ"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
