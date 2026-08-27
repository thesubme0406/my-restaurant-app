import { useCallback, useRef } from 'react';
import { getInertiaFlashValue } from '@/utils/inertiaFlash';
import { openQueueTicketPrint } from '@/utils/openQueueTicketPrint';
import { openServicePaperPrint } from '@/utils/openServicePaperPrint';

/**
 * Inertia flash → thermal print (queue ticket / service slip). Dedupes identical payloads per session.
 */
export function useQueueDashboardPrint() {
    const lastQueueTicketPrintRef = useRef(null);
    const lastServicePaperPrintRef = useRef(null);

    const triggerQueueTicketPrint = useCallback((payload) => {
        if (!payload?.queue_no) {
            return;
        }
        const key = JSON.stringify(payload);
        if (lastQueueTicketPrintRef.current === key) {
            return;
        }
        lastQueueTicketPrintRef.current = key;
        openQueueTicketPrint(payload);
    }, []);

    const triggerServicePaperPrint = useCallback((payload) => {
        if (!payload?.queue_no) {
            return;
        }
        const key = JSON.stringify(payload);
        if (lastServicePaperPrintRef.current === key) {
            return;
        }
        lastServicePaperPrintRef.current = key;
        openServicePaperPrint(payload);
    }, []);

    const handlePrintFlash = useCallback(
        (flashPayload) => {
            const queueTicket = getInertiaFlashValue(flashPayload, 'print_queue_ticket');
            if (queueTicket) {
                triggerQueueTicketPrint(queueTicket);
            }
            const servicePaper = getInertiaFlashValue(flashPayload, 'print_service_paper');
            if (servicePaper) {
                triggerServicePaperPrint(servicePaper);
            }
        },
        [triggerQueueTicketPrint, triggerServicePaperPrint]
    );

    return { handlePrintFlash };
}
