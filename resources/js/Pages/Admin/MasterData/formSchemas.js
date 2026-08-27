// ກຳນົດຊ່ອງຟອມໃນ GenericFormModal (ເພີ່ມ / ແກ້)
export function staffFormSchema(mode) {
    return [
        {
            name: 'name',
            label: 'ຊື່ແທ້',
            type: 'text',
            required: true,
            maxLength: 25,
        },
        {
            name: 'surname',
            label: 'ນາມສະກຸນ',
            type: 'text',
            required: true,
            maxLength: 25,
        },
        {
            name: 'role',
            label: 'ຕຳແໜ່ງ',
            type: 'select',
            required: true,
            options: [
                { value: 'staff', label: 'ພະນັກງານ' },
                { value: 'manager', label: 'ຜູ້ຈັດການ' },
            ],
        },
        {
            name: 'phone',
            label: 'ເບີໂທລະສັບ',
            type: 'tel',
            required: true,
            placeholder: '02012345678',
            phoneLookup: {
                strategy: 'staff',
                mapResponse: { name: 'name', surname: 'surname' },
            },
        },
        {
            name: 'username',
            label: 'ຊື່ຜູ້ໃຊ້ (username)',
            type: 'text',
            required: true,
            maxLength: 25,
        },
        mode === 'add'
            ? {
                  name: 'password',
                  label: 'ລະຫັດຜ່ານ',
                  type: 'password',
                  required: true,
              }
            : {
                  name: 'password',
                  label: 'ລະຫັດຜ່ານໃໝ່ (ວ່າງໄວ້ຖ້າບໍ່ປ່ຽນ)',
                  type: 'password',
                  required: false,
              },
        {
            name: 'address',
            label: 'ທີ່ຢູ່ (ທາງເລືອກ)',
            type: 'textarea',
            required: false,
        },
    ];
}

export function buffetFormSchema(mode) {
    return [
        {
            name: 'image',
            label: 'ຮູບພາບເມນູບຸບເຟ່',
            type: 'image_upload',
            required: mode === 'add',
            previewKey: 'image_url',
        },
        {
            name: 'tier_name',
            label: 'ຊື່ແພັກເກັດ',
            type: 'text',
            required: true,
            maxLength: 25,
        },
        {
            name: 'price',
            label: 'ລາຄາຕໍ່ຄົນ',
            type: 'money',
            required: true,
        },
        {
            name: 'description',
            label: 'ລາຍລະອຽດ',
            type: 'textarea',
            required: false,
        },
    ];
}

export function buildMenuFormSchema(foodMenuCategoryRows) {
    const catOptions = foodMenuCategoryRows.map((c) => ({
        value: String(c.id),
        label: c.category_name,
    }));
    return (mode) => [
        {
            name: 'image',
            label: 'ຮູບພາບ',
            type: 'image_upload',
            required: mode === 'add',
            previewKey: 'image_url',
            imageActionStyle: 'primary',
        },
        {
            name: 'name',
            label: 'ຊື່ລາຍການ',
            type: 'text',
            required: true,
            maxLength: 25,
        },
        {
            name: 'category_id',
            label: 'ໝວດໝູ່',
            type: 'select',
            required: true,
            options: catOptions,
        },
        {
            name: 'is_active',
            label: 'ສະຖານະ',
            type: 'select',
            required: true,
            options: [
                { value: '1', label: 'ເປີດໃຊ້ງານ' },
                { value: '0', label: 'ປິດໃຊ້ງານ' },
            ],
        },
        {
            name: 'description',
            label: 'ລາຍລະອຽດ',
            type: 'textarea',
            required: false,
        },
    ];
}

export function categoryFormSchema(mode) {
    return [
        {
            name: 'image',
            label: 'ຮູບພາບ',
            type: 'image_upload',
            required: mode === 'add',
            previewKey: 'image_url',
            imageActionStyle: 'primary',
        },
        {
            name: 'catg_name',
            label: 'ປະເພດອາຫານ',
            type: 'text',
            required: true,
            maxLength: 30,
        },
    ];
}

export function getTableFormFields() {
    const capacityOpts = Array.from({ length: 20 }, (_, i) => {
        const n = i + 1;
        return { value: String(n), label: `${n} ທີ່ນັ່ງ` };
    });
    return [
        {
            name: 'table_no',
            label: 'ລະຫັດໂຕະ',
            type: 'text',
            required: true,
            maxLength: 10,
        },
        {
            name: 'capacity',
            label: 'ບ່ອນນັ່ງໂຕະ',
            type: 'select',
            required: true,
            options: capacityOpts,
        },
        {
            name: 'readiness',
            label: 'ຄວາມພ້ອມໃຊ້ງານ (ໂຕະໃນຮ້ານ)',
            type: 'select',
            required: true,
            options: [
                { value: 'ready', label: 'ພ້ອມໃຊ້ງານ' },
                { value: 'not_ready', label: 'ບໍ່ພ້ອມໃຊ້ງານ' },
            ],
        },
        {
            name: 'zone',
            label: 'ໂຊນ',
            type: 'select',
            required: false,
            options: [
                { value: 'standard', label: 'ໂຊນມາດຕະຖານ' },
                { value: 'vip', label: 'VIP' },
            ],
        },
    ];
}

export function buildNewsFormSchema(newsStaffOptions) {
    const staffOptions = newsStaffOptions.map((s) => ({
        value: String(s.id),
        label: s.label,
    }));
    return (mode) => [
        {
            name: 'image',
            label: 'ຮູບພາບຂ່າວ',
            type: 'image_upload',
            required: mode === 'add',
            previewKey: 'image_url',
            imageActionStyle: 'primary',
        },
        {
            name: 'title',
            label: 'ຫົວຂໍ້',
            type: 'text',
            required: true,
            maxLength: 50,
        },
        {
            name: 'content',
            label: 'ເນື້ອຫາຂ່າວ',
            type: 'textarea',
            required: true,
        },
        {
            name: 'staff_id',
            label: 'ລະຫັດພະນັກງານທີ່ໂພສ',
            type: 'select',
            required: true,
            options: staffOptions,
        },
        {
            name: 'status',
            label: 'ສະຖານະຂ່າວ',
            type: 'select',
            required: true,
            options: [
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
                { value: 'expired', label: 'Expired' },
            ],
        },
    ];
}

export const ingredientFormSchema = [
    {
        name: 'ing_name',
        label: 'ຊື່ວັດຖຸດິບ',
        type: 'text',
        required: true,
        maxLength: 100,
    },
    {
        name: 'ing_unit',
        label: 'ຫົວໜ່ວຍ',
        type: 'select',
        required: true,
        options: [
            { value: 'kg', label: 'kg' },
            { value: 'g', label: 'g' },
            { value: 'L', label: 'L' },
            { value: 'mL', label: 'mL' },
            { value: 'pcs', label: 'pcs' },
            { value: 'pack', label: 'pack' },
        ],
    },
    {
        name: 'ing_quantity',
        label: 'ຈຳນວນຄົງເຫຼືອ',
        type: 'number',
        required: true,
    },
    {
        name: 'ing_min',
        label: 'ຈຳນວນຂັ້ນຕ່ຳທີ່ຕ້ອງທົດຊື້',
        type: 'number',
        required: true,
    },
];

export const supplierFormSchema = [
    {
        name: 'sup_name',
        label: 'ຊື່ຜູ້ສະໜອງ',
        type: 'text',
        required: true,
        maxLength: 100,
    },
    {
        name: 'contact_tel',
        label: 'ເບີໂທຜູ້ສະໜອງ',
        type: 'tel',
        required: true,
        placeholder: '02012345678',
    },
    {
        name: 'contact_person',
        label: 'ຊື່ຜູ້ປະສານ',
        type: 'text',
        required: true,
        maxLength: 50,
    },
    {
        name: 'sup_address',
        label: 'ທີ່ຢູ່ຜູ້ສະໜອງ',
        type: 'textarea',
        required: true,
    },
];
