/** ຄໍລໍາລາຍງານເມນູ */
export function getMenuColumns() {
    return [
        {
            key: 'image_url',
            header: 'ຮູບພາບ',
            cell: (row) =>
                row.image_url ? (
                    <img src={row.image_url} alt={row.menu_name} className="h-10 w-10 rounded-md object-cover" />
                ) : (
                    <div className="h-10 w-10 rounded-md bg-slate-200" />
                ),
        },
        { key: 'menu_code', header: 'ລະຫັດເມນູ' },
        { key: 'menu_name', header: 'ຊື່ເມນູ' },
        { key: 'category_name', header: 'ປະເພດອາຫານ' },
        { key: 'tier_name', header: 'Buffet Tier' },
        {
            key: 'status_label',
            header: 'ສະຖານະເມນູ',
            cell: (row) =>
                row.is_active ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">ເປີດໃຊ້ງານ</span>
                ) : (
                    <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">ປິດໃຊ້ງານ</span>
                ),
        },
    ];
}

