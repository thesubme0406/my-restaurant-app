import { CheckCircle2, Clock, LayoutGrid, SkipForward, Users } from 'lucide-react';
import { formatAmount } from '@/utils/formatAmount';

export const DASHBOARD_PARTIAL = ['stats', 'zones', 'queue', 'skippedQueue', 'buffetTiers', 'availableTables'];

export function formatLak(amount) {
    if (amount == null || Number.isNaN(Number(amount))) {
        return '';
    }
    return `${formatAmount(amount)} LAK`;
}

export function buildDashboardStatCards(stats) {
    return [
        {
            key: 'capacity',
            label: 'ບັນຈຸໄດ້ທັງໝົດ',
            value: `${stats.totalCapacity} ຄົນ`,
            icon: LayoutGrid,
            theme: 'border-slate-200 bg-white text-slate-800',
            iconBg: 'bg-slate-100 text-slate-700',
        },
        {
            key: 'available',
            label: 'ໂຕະວ່າງ',
            value: `${stats.availableTables} ພ້ອມນັ່ງ`,
            icon: CheckCircle2,
            theme: 'border-emerald-200 bg-emerald-50/60 text-emerald-900',
            iconBg: 'bg-emerald-100 text-emerald-700',
        },
        {
            key: 'occupied',
            label: 'ໂຕະທີ່ຖືກໃຊ້ງານ',
            value: String(stats.occupiedTables),
            icon: Users,
            theme: 'border-rose-200 bg-rose-50/60 text-rose-900',
            iconBg: 'bg-rose-100 text-rose-700',
        },
        {
            key: 'queue',
            label: 'ຄິວກຳລັງລໍຖ້າ',
            value: String(stats.waitingQueue),
            icon: Clock,
            theme: 'border-sky-200 bg-sky-50/60 text-sky-900',
            iconBg: 'bg-sky-100 text-sky-700',
        },
        {
            key: 'skipped',
            label: 'ຂ້າມແລ້ວ',
            value: String(stats.skippedQueue),
            icon: SkipForward,
            theme: 'border-amber-200 bg-amber-50/70 text-amber-950',
            iconBg: 'bg-amber-100 text-amber-800',
        },
    ];
}

export function findQueueEntry(id, queue, skippedQueue) {
    return queue.find((q) => q.id === id) ?? skippedQueue.find((q) => q.id === id) ?? null;
}

export function suggestedTableIdsForGroup(groupSize, tables) {
    if (!tables?.length) {
        return [];
    }
    const singleFit = tables.find((t) => Number(t.capacity) >= Number(groupSize || 0));
    if (singleFit) {
        return [String(singleFit.id)];
    }
    const sorted = [...tables].sort((a, b) => Number(b.capacity || 0) - Number(a.capacity || 0));
    const picked = [];
    let total = 0;
    for (const table of sorted) {
        picked.push(String(table.id));
        total += Number(table.capacity || 0);
        if (total >= Number(groupSize || 0)) {
            break;
        }
    }
    return picked;
}

/** FIFO — oldest queued_at first (matches API ordering). */
export function sortQueueEntriesByJoinedAt(entries) {
    return [...entries].sort((a, b) => {
        const ta = a.queued_at ? Date.parse(a.queued_at) : Number.POSITIVE_INFINITY;
        const tb = b.queued_at ? Date.parse(b.queued_at) : Number.POSITIVE_INFINITY;
        if (ta !== tb) {
            return ta - tb;
        }
        return (Number(a.id) || 0) - (Number(b.id) || 0);
    });
}

export function emptyAddQueueForm(buffetTiers) {
    return {
        customer_name: '',
        phone: '',
        guest_count: '',
        tier_id: buffetTiers[0]?.id ?? '',
        is_vip: false,
    };
}

export function formatLocalDateTime(value) {
    if (!value) {
        return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}
