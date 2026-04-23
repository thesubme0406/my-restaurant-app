// ຊ່ວຍສະແດງຜົນໃນຕາຕະລາງ (ວັນທີ, ສະຖານະ, ລາຄາ, …)
import { formatAmount } from '@/utils/formatAmount';

export function staffInitials(name, surname) {
    const a = (name ?? '').trim().charAt(0);
    const b = (surname ?? '').trim().charAt(0);
    if (a && b) {
        return (a + b).toUpperCase();
    }
    return (a || '?').toUpperCase();
}

export function roleLabel(role) {
    if (role === 'manager') {
        return 'ຜູ້ຈັດການ';
    }
    if (role === 'staff') {
        return 'ພະນັກງານ';
    }
    return role;
}

export function formatJoined(iso) {
    if (!iso) {
        return '—';
    }
    try {
        return new Intl.DateTimeFormat('lo-LA', { dateStyle: 'medium' }).format(new Date(iso));
    } catch {
        return iso.slice(0, 10);
    }
}

export function resolveTierBindingId(tiers, serverSelectedId) {
    if (serverSelectedId != null && tiers.some((t) => Number(t.id) === Number(serverSelectedId))) {
        return Number(serverSelectedId);
    }
    return tiers[0]?.id != null ? Number(tiers[0].id) : null;
}

export function formatBuffetPrice(price) {
    const n = Number(price);
    if (Number.isNaN(n)) {
        return '—';
    }
    return `${formatAmount(n)} ກີບ`;
}

/** ຄວາມພ້ອມຂອງໂຕະໃນຮ້ານ (master data) — ບໍ່ກ່ຽວກັບວ່າມີລູກຄ້ານັ່ງຫຼືບໍ່ */
export function tableReadinessBadge(readiness) {
    switch (readiness) {
        case 'ready':
            return (
                <span className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    ພ້ອມໃຊ້ງານ
                </span>
            );
        case 'not_ready':
            return (
                <span className="inline-flex rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    ບໍ່ພ້ອມໃຊ້ງານ
                </span>
            );
        default:
            return <span className="text-xs text-slate-600">{readiness}</span>;
    }
}

/** ສະຖານະນັ່ງຄິວຈິງ (ອ່ານຢ່າງດຽວໃນ master data; ປ່ຽນໄດ້ຈາກແຜງຄິວ) */
export function tableUsageMasterBadge(usageStatus) {
    switch (usageStatus) {
        case 'available':
            return (
                <span className="inline-flex rounded-full bg-slate-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    ບໍ່ມີລູກຄ້າ
                </span>
            );
        case 'occupied':
            return (
                <span className="inline-flex rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    ມີລູກຄ້າ
                </span>
            );
        default:
            return <span className="text-xs text-slate-600">{usageStatus}</span>;
    }
}

export function zoneLabel(zone) {
    if (zone === 'vip') {
        return 'VIP';
    }
    if (zone === 'standard') {
        return 'ມາດຕະຖານ';
    }
    return zone ? String(zone) : '—';
}

export function newsStatusBadge(status) {
    if (status === 'published') {
        return <span className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">Published</span>;
    }
    if (status === 'expired') {
        return <span className="inline-flex rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-sm">Expired</span>;
    }
    return <span className="inline-flex rounded-full bg-slate-500 px-3 py-1 text-xs font-bold text-white shadow-sm">Draft</span>;
}

export function ingredientStatusBadge(quantity, min) {
    const q = Number(quantity);
    const m = Number(min);
    if (Number.isNaN(q) || Number.isNaN(m)) {
        return <span className="inline-flex rounded-full bg-slate-500 px-3 py-1 text-xs font-bold text-white shadow-sm">—</span>;
    }
    if (q <= 0) {
        return <span className="inline-flex rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-sm">ໝົດ</span>;
    }
    if (q <= m) {
        return <span className="inline-flex rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-sm">ໃກ້ໝົດ</span>;
    }
    return <span className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">ພຽງພໍ</span>;
}
