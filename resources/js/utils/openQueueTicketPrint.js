import QueueTicketSlip from '@/Components/Print/QueueTicketSlip';
import { printThermalSlip } from '@/utils/openThermalPrint';

/**
 * @param {Record<string, unknown>} payload
 */
export function openQueueTicketPrint(payload) {
    if (!payload?.queue_no) {
        return;
    }

    printThermalSlip({
        title: `Queue ${payload.queue_no}`,
        Component: QueueTicketSlip,
        props: {
            restaurantName: payload.restaurant_name ?? 'OSHINEI',
            queueNo: payload.queue_no,
            isVip: Boolean(payload.is_vip),
            guestCount: payload.guest_count ?? 0,
            buffetTier: payload.buffet_tier ?? '—',
            printedAt: payload.printed_at ?? new Date().toISOString(),
        },
    });
}
