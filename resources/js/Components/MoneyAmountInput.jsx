import { formatMoneyInputDisplay, parseMoneyInput, toMoneyCanonical } from '@/utils/moneyInput';

/**
 * ຊ່ອງປ້ອນເງິນ — ສະແດງ comma ຂະນະພິມ (ສົ່ງຄ່າ canonical ກັບ parent)
 */
export default function MoneyAmountInput({
    value,
    onChange,
    disabled = false,
    className = '',
    id,
    name,
    placeholder,
    required = false,
    autoComplete = 'off',
}) {
    const canonical = toMoneyCanonical(value);
    const display = formatMoneyInputDisplay(canonical);

    return (
        <input
            type="text"
            inputMode="decimal"
            id={id}
            name={name}
            autoComplete={autoComplete}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            className={className}
            value={display}
            onChange={(e) => onChange(parseMoneyInput(e.target.value))}
        />
    );
}
