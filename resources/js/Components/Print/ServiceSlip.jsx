import ThermalPrintSlip from '@/Components/Print/ThermalPrintSlip';
import { formatPrintDateTime, formatPrintFooterTime } from '@/utils/printDateTime';

function formatTableLabel(tableNo, tableNos = []) {
    if (Array.isArray(tableNos) && tableNos.length > 1) {
        return tableNos.join(' + ');
    }
    const raw = tableNo ?? '—';
    if (raw === '—') {
        return raw;
    }
    return String(raw).toLowerCase().startsWith('table') ? raw : `Table: ${raw}`;
}

function formatServiceId(id) {
    if (id == null || id === '') {
        return '—';
    }
    return String(id).padStart(2, '0');
}

export default function ServiceSlip({
    logoSrc,
    tableNo = '—',
    tableNos = [],
    queueNo = '—',
    serviceId = '—',
    buffetTier = '—',
    guestCount = 0,
    zone = 'Standard',
    startTime,
    endTime,
}) {
    const zoneLabel = zone === 'VIP Room' ? 'VIP Room' : String(zone || 'Standard');

    return (
        <ThermalPrintSlip
            logoSrc={logoSrc}
            brandName="OSHINEI"
            title="Service Slip"
            heroLabel={undefined}
            hero={formatTableLabel(tableNo, tableNos)}
            rows={[
                { label: 'Zone', value: zoneLabel },
                { label: 'Service ID', value: formatServiceId(serviceId) },
                { label: 'Queue', value: queueNo },
                { label: 'Buffet Tier', value: buffetTier },
                { label: 'Guests', value: `${guestCount}` },
                { label: 'Start Time', value: formatPrintDateTime(startTime) },
                { label: 'End Time', value: formatPrintDateTime(endTime) },
            ]}
            footer="Please keep this on your table for staff reference."
            printedAt={formatPrintFooterTime(startTime)}
        />
    );
}
