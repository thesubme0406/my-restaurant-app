/** ຊ່ອງກັ່ນຕອງລາຍງານ — ໃຊ້ຮ່ວມກັນໃຫ້ສູງ ແລະ ສີກົງກັນ */
export const R_LABEL = 'text-sm font-semibold text-slate-700 font-sans';
export const R_INPUT =
    'mt-1.5 h-10 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20 font-sans';

export function RInput(props) {
    const { className = '', ...rest } = props;
    return <input {...rest} className={`${R_INPUT} ${className}`.trim()} />;
}

export function RField({ label, children, className = '' }) {
    return (
        <div className={`flex min-w-0 flex-col ${className}`.trim()}>
            <span className={R_LABEL}>{label}</span>
            {children}
        </div>
    );
}

export function RSelect({ value, onChange, children, className = '' }) {
    return (
        <select value={value} onChange={onChange} className={`${R_INPUT} ${className}`.trim()}>
            {children}
        </select>
    );
}

/** ກັ່ນຕອງ Buffet Tier (ລາຍຮັບ / ເມນູ) */
export function TierSelectField({ label = 'Buffet Tier', value, onChange, tiers, boxClass = '', selectClassName = '' }) {
    return (
        <RField label={label} className={boxClass}>
            <RSelect value={value} onChange={onChange} className={selectClassName}>
                <option value="all">ທຸກ Tier</option>
                {tiers.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                        {t.name}
                    </option>
                ))}
            </RSelect>
        </RField>
    );
}

const statShell = 'rounded-xl border border-slate-200 border-t-2 border-t-[#194c9f] bg-white px-3 py-2 shadow-sm';

/** ກາດສະຫຼຸບລາຍງານ — ໃຊ້ຊ້ຳໃນຫຼາຍປະເພດລາຍງານ */
export function ReportStatCard({ title, value }) {
    return (
        <div className={statShell}>
            <p className="text-xs font-semibold text-[#194c9f] font-sans">{title}</p>
            <p className="text-lg font-bold text-slate-900">{value ?? 0}</p>
        </div>
    );
}
