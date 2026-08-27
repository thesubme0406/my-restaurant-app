/** Shared date/time formatting for thermal print slips (queue ticket, service paper). */

export function formatPrintDateTime(iso) {
    if (!iso) {
        return '—';
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }
    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

/** Footer "printed at" — omit when invalid. */
export function formatPrintFooterTime(iso) {
    if (!iso) {
        return undefined;
    }
    const formatted = formatPrintDateTime(iso);
    return formatted === '—' ? undefined : formatted;
}
