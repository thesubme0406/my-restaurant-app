import { paymentMethodFilterOptions } from '@/utils/paymentMethod';

export const reportOptions = [
    { value: 'income', label: 'ລາຍງານລາຍຮັບ' },
    { value: 'queue_statistics', label: 'ລາຍງານສະຖິຕິຄິວ' },
    { value: 'queue_booking', label: 'ລາຍງານການຈອງຄິວ' },
    { value: 'service', label: 'ລາຍງານການບໍລິການ' },
    { value: 'menu', label: 'ລາຍງານຂໍ້ມູນເມນູ' },
    { value: 'ingredient_usage', label: 'ລາຍງານການໃຊ້ວັດຖຸດິບ' },
    { value: 'ingredient_purchase', label: 'ລາຍງານການສັ່ງຊື້ວັດຖຸດິບ' },
    { value: 'ingredient_import', label: 'ລາຍງານນຳເຂົ້າວັດຖຸດິບ' },
];

export const menuStatusOptions = [
    { value: 'all', label: 'ເມນູທັງໝົດ' },
    { value: 'active', label: 'ເມນູເປີດໃຊ້ງານ' },
    { value: 'inactive', label: 'ເມນູປິດໃຊ້ງານ' },
];


export const paymentMethodOptions = paymentMethodFilterOptions();

export const queueStatusFilterOptions = [
    { value: 'all', label: 'ສະຫຼຸບຕໍ່ມື້ (ທຸກສະຖານະ)' },
    { value: 'completed', label: 'ສະເພາະຄິວສຳເລັດ' },
    { value: 'skipped', label: 'ສະເພາະຄັ້ງຂ້າມ (ຂໍ້ມູນເສີມ)' },
    { value: 'cancelled', label: 'ສະເພາະຄິວຍົກເລີກ' },
    { value: 'other', label: 'ສະເພາະສະຖານະອື່ນ' },
];

export const servicePaymentStatusOptions = [
    { value: 'all', label: 'ທັງໝົດ' },
    { value: 'paid', label: 'ຊຳລະແລ້ວ' },
    { value: 'unpaid', label: 'ຍັງບໍ່ຊຳລະ' },
];

/** ໂຊນໂຕະ (ທຳມະດາ vs VIP) — ກົງກັບໜ້າປະຫວັດຊຳລະ */
export const tableZoneFilterOptions = [
    { value: '', label: 'ທັງໝົດ' },
    { value: 'standard', label: 'ໂຊນທຳມະດາ' },
    { value: 'vip', label: 'ໂຊນ VIP' },
];

export const purchaseStatusOptions = [
    { value: 'all', label: 'ສະຖານະທັງໝົດ' },
    { value: 'pending', label: 'ກຳລັງລໍຖ້າ' },
    { value: 'received', label: 'ເຄື່ອງເຂົ້າແລ້ວ' },
];

export const filterButtonClass =
    'inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-semibold shadow-sm transition font-sans';

export function defaultReportFromDate() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
}

export function defaultReportToDate() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function reportTitleByType(type) {
    return reportOptions.find((opt) => opt.value === type)?.label ?? 'ລາຍງານ';
}
