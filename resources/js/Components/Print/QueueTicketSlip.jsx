import ThermalPrintSlip from '@/Components/Print/ThermalPrintSlip';
import { formatPrintDateTime, formatPrintFooterTime } from '@/utils/printDateTime';

export default function QueueTicketSlip({
    logoSrc,
    restaurantName = 'OSHINEI',
    queueNo = '—',
    guestCount = 0,
    buffetTier = '—',
    printedAt,
    isVip = false,
}) {
    return (
        <ThermalPrintSlip
            logoSrc={logoSrc}
            brandName={restaurantName}
            title={isVip ? 'VIP Queue Ticket' : 'Queue Ticket'}
            heroLabel="Queue No."
            hero={queueNo}
            heroClassName={isVip ? 'thermal-slip__hero--vip' : undefined}
            rows={[
                { label: 'Buffet Tier', value: buffetTier },
                { label: 'Guests', value: `${guestCount}` },
                { label: 'Date / Time', value: formatPrintDateTime(printedAt) },
            ]}
            footer="Please wait for your turn."
            printedAt={formatPrintFooterTime(printedAt)}
        />
    );
}
