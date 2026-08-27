import ServiceSlip from '@/Components/Print/ServiceSlip';
import { printThermalSlip } from '@/utils/openThermalPrint';

/**
 * @param {Record<string, unknown>} payload
 */
export function openServicePaperPrint(payload) {
    if (!payload?.queue_no) {
        return;
    }

    printThermalSlip({
        title: `Service ${payload.queue_no}`,
        Component: ServiceSlip,
        props: {
            tableNo: payload.table_no ?? '—',
            tableNos: Array.isArray(payload.table_nos) ? payload.table_nos : [],
            queueNo: payload.queue_no,
            serviceId: payload.service_id,
            buffetTier: payload.buffet_tier ?? '—',
            guestCount: payload.guest_count ?? 0,
            zone: payload.zone ?? 'Standard',
            startTime: payload.start_time,
            endTime: payload.end_time,
        },
    });
}
