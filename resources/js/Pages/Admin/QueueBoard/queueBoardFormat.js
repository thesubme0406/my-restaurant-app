export function formatBoardClock(value) {
    const dt = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dt.getTime())) return '--:--:--';
    return dt.toLocaleTimeString('en-GB', { hour12: false });
}
