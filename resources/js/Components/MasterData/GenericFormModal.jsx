import MoneyAmountInput from '@/Components/MoneyAmountInput';
import { digitsOnly, PHONE_MAX_LENGTH, PHONE_PLACEHOLDER, isValidPhone } from '@/utils/phoneFormat';
import axios from 'axios';
import { X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

const defaultPrimary = '#194c9f';
const defaultDebounce = 320;

// schema: ຊ່ອງຟອມ; phoneLookup = ເບີ→ຊື່ (staff ຫຼື customer_name)

function fieldValue(data, name) {
    return data[name] ?? '';
}

// modal ຟອມຕາມ schema; splitLeadImage = ຮູບຊ້າຍ | ຊ່ອງຂວາເມນື່ອງ image_upload ຢູ່ຕົ້ນ
export default function GenericFormModal({
    open,
    onClose,
    title,
    submitLabel,
    formId,
    schema,
    data,
    setData,
    errors,
    processing,
    onSubmit,
    primaryColor = defaultPrimary,
    panelMaxClassName = '',
    splitLeadImage = false,
}) {
    const debounceTimers = useRef({});
    const abortRef = useRef(null);
    const nameAutofillRef = useRef(false);
    const dataRef = useRef(data);
    dataRef.current = data;

    const clearDebounce = useCallback(() => {
        Object.values(debounceTimers.current).forEach((id) => clearTimeout(id));
        debounceTimers.current = {};
    }, []);

    useEffect(() => {
        if (!open) {
            clearDebounce();
            abortRef.current?.abort();
            nameAutofillRef.current = false;
        } else {
            nameAutofillRef.current = false;
        }
    }, [open, clearDebounce]);

    const runPhoneLookup = useCallback(
        async (digits, lookup) => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            try {
                if (lookup.strategy === 'staff') {
                    const { data: payload } = await axios.get(route('queue-dashboard.directory.staff-by-phone'), {
                        params: { phone: digits },
                        signal: controller.signal,
                    });
                    if (!payload?.matched) {
                        return;
                    }
                    const map = lookup.mapResponse ?? { name: 'name', surname: 'surname' };
                    const n = typeof payload.name === 'string' ? payload.name.trim() : '';
                    const s = typeof payload.surname === 'string' ? payload.surname.trim() : '';
                    const firstKey = map.name ?? 'name';
                    const surKey = map.surname ?? 'surname';
                    const d = dataRef.current;
                    const curFirst = String(d[firstKey] ?? '').trim();
                    const curSur = String(d[surKey] ?? '').trim();
                    if ((curFirst === '' && curSur === '') || nameAutofillRef.current) {
                        setData(firstKey, n);
                        setData(surKey, s);
                        nameAutofillRef.current = true;
                    }
                    return;
                }

                if (lookup.strategy === 'customer_name') {
                    const { data: payload } = await axios.get(route('queue-dashboard.bookings.lookup-customer-by-phone'), {
                        params: { phone: digits },
                        signal: controller.signal,
                    });
                    const map = lookup.mapResponse ?? { name: 'customer_name' };
                    const target = map.name ?? 'customer_name';
                    const nm = typeof payload?.name === 'string' ? payload.name.trim() : '';
                    if (!payload?.matched || !nm) {
                        return;
                    }
                    const cur = String(dataRef.current[target] ?? '').trim();
                    if (cur === '' || nameAutofillRef.current) {
                        setData(target, nm);
                        nameAutofillRef.current = true;
                    }
                }
            } catch (e) {
                if (e?.code === 'ERR_CANCELED') {
                    return;
                }
            }
        },
        [setData]
    );

    const schedulePhoneLookup = useCallback(
        (fieldName, digits, lookup) => {
            clearDebounce();
            const key = fieldName;
            if (debounceTimers.current[key]) {
                clearTimeout(debounceTimers.current[key]);
            }
            if (!isValidPhone(digits)) {
                abortRef.current?.abort();
                nameAutofillRef.current = false;
                return;
            }
            const ms = lookup.debounceMs ?? defaultDebounce;
            debounceTimers.current[key] = setTimeout(() => {
                delete debounceTimers.current[key];
                runPhoneLookup(digits, lookup);
            }, ms);
        },
        [clearDebounce, runPhoneLookup]
    );

    const flushPhoneLookup = useCallback(
        (fieldName, lookup) => {
            clearDebounce();
            const digits = String(dataRef.current[fieldName] ?? '').replace(/\D/g, '');
            if (isValidPhone(digits)) {
                runPhoneLookup(digits, lookup);
            }
        },
        [clearDebounce, runPhoneLookup]
    );

    if (!open) {
        return null;
    }

    const baseInput =
        'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#194c9f] focus:ring-1 focus:ring-[#194c9f]';

    const renderField = (field) => {
        const err = errors[field.name];
        const commonLabel = (
            <label className="text-xs font-bold text-slate-700" htmlFor={`${formId}-${field.name}`}>
                {field.label}
                {field.required ? <span className="text-rose-500"> *</span> : null}
            </label>
        );

        const onManualChange = (val) => {
            if (field.phoneLookup) {
                nameAutofillRef.current = false;
            }
            setData(field.name, val);
        };

        if (field.type === 'image_upload') {
            const previewKey = field.previewKey ?? 'image_url';
            const preview = data[previewKey];
            const fileVal = data[field.name];
            const hasImage = (fileVal && typeof fileVal === 'object' && 'name' in fileVal) || Boolean(preview);
            const fileInputId = `${formId}-${field.name}-file`;
            const addLbl = field.addFileLabel ?? 'ເພີ່ມຮູບພາບ';
            const chgLbl = field.changeFileLabel ?? 'ອັບເດດຮູບພາບ';
            const primaryImgBtn = field.imageActionStyle === 'primary';
            const imgBtnClass = primaryImgBtn
                ? 'rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-95'
                : 'rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50';

            return (
                <div key={field.name}>
                    {commonLabel}
                    <div className={`mt-2 flex flex-col gap-3 ${splitLeadImage ? 'items-stretch sm:items-center' : 'items-center'}`}>
                        <div
                            className="relative mx-auto h-40 w-40 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-inner sm:mx-0"
                            aria-hidden
                        >
                            {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : null}
                        </div>
                        <input
                            id={fileInputId}
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            required={Boolean(field.required) && !hasImage}
                            onChange={(e) => {
                                const f = e.target.files?.[0] ?? null;
                                setData(field.name, f);
                                if (f) {
                                    setData(previewKey, URL.createObjectURL(f));
                                } else {
                                    setData(previewKey, '');
                                }
                            }}
                        />
                        <button
                            type="button"
                            className={`w-full max-w-[11rem] sm:max-w-none ${imgBtnClass}`}
                            style={primaryImgBtn ? { backgroundColor: primaryColor } : undefined}
                            onClick={() => document.getElementById(fileInputId)?.click()}
                        >
                            {preview ? chgLbl : addLbl}
                        </button>
                    </div>
                    {err ? <p className="mt-1 text-center text-xs text-rose-600">{err}</p> : null}
                </div>
            );
        }

        if (field.type === 'money') {
            return (
                <div key={field.name}>
                    {commonLabel}
                    <MoneyAmountInput
                        id={`${formId}-${field.name}`}
                        value={data[field.name]}
                        onChange={(canonical) => onManualChange(canonical)}
                        className={baseInput}
                        required={field.required}
                    />
                    {err ? <p className="mt-1 text-xs text-rose-600">{err}</p> : null}
                </div>
            );
        }

        if (field.type === 'number') {
            const raw = data[field.name];
            const numVal = raw === '' || raw == null ? '' : String(raw);

            return (
                <div key={field.name}>
                    {commonLabel}
                    <input
                        id={`${formId}-${field.name}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        className={baseInput}
                        value={numVal}
                        onChange={(e) => {
                            const v = e.target.value;
                            onManualChange(v === '' ? '' : v);
                        }}
                        required={field.required}
                    />
                    {err ? <p className="mt-1 text-xs text-rose-600">{err}</p> : null}
                </div>
            );
        }

        if (field.type === 'textarea') {
            return (
                <div key={field.name}>
                    {commonLabel}
                    <textarea
                        id={`${formId}-${field.name}`}
                        className={`${baseInput} min-h-[80px] resize-y`}
                        value={fieldValue(data, field.name)}
                        onChange={(e) => onManualChange(e.target.value)}
                        maxLength={field.maxLength}
                        required={field.required}
                        rows={3}
                    />
                    {err ? <p className="mt-1 text-xs text-rose-600">{err}</p> : null}
                </div>
            );
        }

        if (field.type === 'select') {
            return (
                <div key={field.name}>
                    {commonLabel}
                    <select
                        id={`${formId}-${field.name}`}
                        className={baseInput}
                        value={fieldValue(data, field.name)}
                        onChange={(e) => onManualChange(e.target.value)}
                        required={field.required}
                    >
                        {(field.options ?? []).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    {err ? <p className="mt-1 text-xs text-rose-600">{err}</p> : null}
                </div>
            );
        }

        const isTel = field.type === 'tel';
        const isPassword = field.type === 'password';

        return (
            <div key={field.name}>
                {commonLabel}
                <input
                    id={`${formId}-${field.name}`}
                    type={isPassword ? 'password' : 'text'}
                    inputMode={isTel ? 'numeric' : undefined}
                    className={baseInput}
                    value={fieldValue(data, field.name)}
                    onChange={(e) => {
                        if (isTel) {
                            const v = digitsOnly(e.target.value);
                            setData(field.name, v);
                            if (field.phoneLookup) {
                                schedulePhoneLookup(field.name, v, field.phoneLookup);
                            }
                            return;
                        }
                        onManualChange(e.target.value);
                    }}
                    onBlur={() => {
                        if (isTel && field.phoneLookup) {
                            flushPhoneLookup(field.name, field.phoneLookup);
                        }
                    }}
                    maxLength={isTel ? PHONE_MAX_LENGTH : field.maxLength}
                    placeholder={isTel ? (field.placeholder ?? PHONE_PLACEHOLDER) : field.placeholder}
                    required={field.required}
                    autoComplete={isPassword ? 'new-password' : isTel ? 'tel' : undefined}
                />
                {err ? <p className="mt-1 text-xs text-rose-600">{err}</p> : null}
            </div>
        );
    };

    const useSplit =
        Boolean(splitLeadImage) && schema.length > 0 && schema[0].type === 'image_upload' && schema.length > 1;

    return (
        <div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/50 p-3 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => !processing && onClose()}
        >
            <div
                className={`max-h-[min(92dvh,720px)] w-full max-w-md overflow-hidden overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl ${panelMaxClassName}`.trim()}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="flex items-center justify-between px-4 py-3.5 text-white sm:px-5"
                    style={{ backgroundColor: primaryColor }}
                >
                    <h2 className="text-base font-bold">{title}</h2>
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

                <form id={formId} className="space-y-4 px-4 py-5 sm:px-6" onSubmit={onSubmit}>
                    {useSplit ? (
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                            <div className="w-full shrink-0 sm:w-52">{renderField(schema[0])}</div>
                            <div className="min-w-0 flex-1 space-y-4">{schema.slice(1).map((f) => renderField(f))}</div>
                        </div>
                    ) : (
                        schema.map((f) => renderField(f))
                    )}
                </form>

                <div className="border-t border-slate-200 bg-slate-50/90 px-4 py-4 sm:px-6">
                    <button
                        type="submit"
                        form={formId}
                        disabled={processing}
                        className="flex min-h-[48px] w-full items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {processing ? 'ກຳລັງບັນທຶກ…' : submitLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
