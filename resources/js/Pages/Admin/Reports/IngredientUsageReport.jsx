/** ຄໍລໍາລາຍງານການໃຊ້ວັດຖຸດິບ */
export function getIngredientUsageColumns() {
    return [
        { key: 'ingredient_name', header: 'ຊື່ວັດຖຸດິບ' },
        { key: 'usage_date', header: 'ວັນທີນຳໃຊ້' },
        { key: 'used_qty', header: 'ຈຳນວນທີ່ໃຊ້' },
        { key: 'unit', header: 'ຫົວໜ່ວຍ' },
        { key: 'remaining_qty', header: 'ຈຳນວນຄົງເຫຼືອ', cell: (row) => `${row.remaining_qty ?? 0} ${row.unit ?? ''}`.trim() },
        { key: 'staff_name', header: 'ຊື່ພະນັກງານ (ຜູ້ບັນທຶກການໃຊ້)' },
    ];
}

