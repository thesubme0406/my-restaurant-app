import { formatAmount } from '@/utils/formatAmount';

/** ຄໍລໍາລາຍງານການສັ່ງຊື້ */
export function getIngredientPurchaseColumns() {
    return [
        { key: 'purchase_code', header: 'ລະຫັດຄຳສັ່ງຊື້' },
        { key: 'purchase_date', header: 'ວັນທີ' },
        { key: 'supplier_name', header: 'ຊື່ຜູ້ສະໜອງ' },
        { key: 'total_price', header: 'ລາຄາລວມ', cell: (row) => `${formatAmount(row.total_price ?? 0)} ກີບ` },
        {
            key: 'po_status_label',
            header: 'ສະຖານະ PO',
            cell: (row) => {
                if (row.po_status === 'received') {
                    return <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">ເຄື່ອງເຂົ້າແລ້ວ</span>;
                }
                return <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">ກຳລັງລໍຖ້າ</span>;
            },
        },
        { key: 'buyer_name', header: 'ຊື່ພະນັກງານ (ຜູ້ຊື້)' },
    ];
}

