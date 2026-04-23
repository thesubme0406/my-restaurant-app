import { formatAmount } from '@/utils/formatAmount';

/** ຄໍລໍາລາຍງານນຳເຂົ້າວັດຖຸດິບ */
export function getIngredientImportColumns() {
    return [
        { key: 'import_date', header: 'ວັນທີນຳເຂົ້າ' },
        { key: 'import_id', header: 'Import ID' },
        { key: 'ingredient_name', header: 'ຊື່ວັດຖຸດິບ' },
        { key: 'quantity_with_unit', header: 'ຈຳນວນ / ຫົວໜ່ວຍ' },
        { key: 'supplier_name', header: 'ຜູ້ສະໜອງ' },
        { key: 'cost_per_unit', header: 'ລາຄາ/ຫົວໜ່ວຍ', cell: (row) => `${formatAmount(row.cost_per_unit ?? 0)} ກີບ` },
        { key: 'line_total', header: 'ລາຄາລວມ', cell: (row) => `${formatAmount(row.line_total ?? 0)} ກີບ` },
    ];
}

