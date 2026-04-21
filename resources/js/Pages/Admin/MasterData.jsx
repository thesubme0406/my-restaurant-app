import ConfirmDialog from '@/Components/MasterData/ConfirmDialog';
import GenericDataTable, { TablePackageNameCell } from '@/Components/MasterData/GenericDataTable';
import GenericFormModal from '@/Components/MasterData/GenericFormModal';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ChevronDown, Database, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const primary = '#194c9f';

/** Dropdown options: wired sections load real data from the server. */
export const MASTER_DATA_SECTIONS = [
    { value: 'staff', label: 'ຈັດການຂໍ້ມູນພະນັກງານ' },
    { value: 'buffet_menu', label: 'ຈັດການຂໍ້ມູນເມນູບຸບເຟ່' },
    { value: 'food_menu', label: 'ຈັດການຂໍ້ມູນລາຍການອາຫານ' },
    { value: 'food_categories', label: 'ຈັດການຂໍ້ມູນປະເພດອາຫານ' },
    { value: 'tables', label: 'ຈັດການຂໍ້ມູນໂຕະ' },
    { value: 'news', label: 'ຈັດການຂໍ້ມູນຂ່າວສານ' },
    { value: 'ingredients_master', label: 'ຈັດການຂໍ້ມູນວັດຖຸດິບ' },
    { value: 'suppliers', label: 'ຈັດການຂໍ້ມູນຜູ້ສະໜອງ' },
];

function staffInitials(name, surname) {
    const a = (name ?? '').trim().charAt(0);
    const b = (surname ?? '').trim().charAt(0);
    if (a && b) {
        return (a + b).toUpperCase();
    }
    return (a || '?').toUpperCase();
}

function roleLabel(role) {
    if (role === 'manager') {
        return 'ຜູ້ຈັດການ';
    }
    if (role === 'staff') {
        return 'ພະນັກງານ';
    }
    return role;
}

function formatJoined(iso) {
    if (!iso) {
        return '—';
    }
    try {
        return new Intl.DateTimeFormat('lo-LA', { dateStyle: 'medium' }).format(new Date(iso));
    } catch {
        return iso.slice(0, 10);
    }
}

function formatBuffetPrice(price) {
    const n = Number(price);
    if (Number.isNaN(n)) {
        return '—';
    }
    const formatted = Number.isInteger(n)
        ? n.toLocaleString('en-US')
        : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formatted} ກີບ`;
}

function tableStatusBadge(status) {
    switch (status) {
        case 'available':
            return (
                <span className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    ຫວ່າງ
                </span>
            );
        case 'maintenance':
            return (
                <span className="inline-flex rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    ຢູ່ລະຫວ່າງປັບປຸງ
                </span>
            );
        case 'occupied':
            return (
                <span className="inline-flex rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    ມີລູກຄ້າ
                </span>
            );
        default:
            return <span className="text-xs text-slate-600">{status}</span>;
    }
}

function zoneLabel(zone) {
    if (zone === 'vip') {
        return 'VIP';
    }
    if (zone === 'standard') {
        return 'ມາດຕະຖານ';
    }
    return zone ? String(zone) : '—';
}

function newsStatusBadge(status) {
    if (status === 'published') {
        return <span className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">Published</span>;
    }
    if (status === 'expired') {
        return <span className="inline-flex rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-sm">Expired</span>;
    }
    return <span className="inline-flex rounded-full bg-slate-500 px-3 py-1 text-xs font-bold text-white shadow-sm">Draft</span>;
}

function ingredientStatusBadge(quantity, min) {
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

const staffFormSchema = (mode) => [
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

const buffetFormSchema = (mode) => [
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
        type: 'number',
        required: true,
    },
    {
        name: 'description',
        label: 'ລາຍລະອຽດ',
        type: 'textarea',
        required: false,
    },
];

export default function MasterData({
    section: initialSection,
    staff,
    buffetTiers,
    foodMenus,
    foodMenuCategories,
    foodCategories,
    tables,
    news,
    newsStaff,
    ingredients,
    suppliers,
}) {
    const page = usePage();
    const pageErrors = page.props.errors ?? {};
    const currentStaffId = page.props.auth?.user?.id ?? null;

    const [section, setSection] = useState(initialSection || 'staff');
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const [buffetAddOpen, setBuffetAddOpen] = useState(false);
    const [buffetEditing, setBuffetEditing] = useState(null);
    const [buffetDeleteTarget, setBuffetDeleteTarget] = useState(null);
    const [buffetDeleteBusy, setBuffetDeleteBusy] = useState(false);

    const [foodMenuCategoryFilter, setFoodMenuCategoryFilter] = useState('');
    const [menuAddOpen, setMenuAddOpen] = useState(false);
    const [menuEditing, setMenuEditing] = useState(null);
    const [menuDeleteTarget, setMenuDeleteTarget] = useState(null);
    const [menuDeleteBusy, setMenuDeleteBusy] = useState(false);

    const [catgAddOpen, setCatgAddOpen] = useState(false);
    const [catgEditing, setCatgEditing] = useState(null);
    const [catgDeleteTarget, setCatgDeleteTarget] = useState(null);
    const [catgDeleteBusy, setCatgDeleteBusy] = useState(false);

    const [tableAddOpen, setTableAddOpen] = useState(false);
    const [tableEditing, setTableEditing] = useState(null);
    const [tableDeleteTarget, setTableDeleteTarget] = useState(null);
    const [tableDeleteBusy, setTableDeleteBusy] = useState(false);
    const [newsAddOpen, setNewsAddOpen] = useState(false);
    const [newsEditing, setNewsEditing] = useState(null);
    const [newsDeleteTarget, setNewsDeleteTarget] = useState(null);
    const [newsDeleteBusy, setNewsDeleteBusy] = useState(false);
    const [ingredientAddOpen, setIngredientAddOpen] = useState(false);
    const [ingredientEditing, setIngredientEditing] = useState(null);
    const [ingredientDeleteTarget, setIngredientDeleteTarget] = useState(null);
    const [ingredientDeleteBusy, setIngredientDeleteBusy] = useState(false);
    const [supplierAddOpen, setSupplierAddOpen] = useState(false);
    const [supplierEditing, setSupplierEditing] = useState(null);
    const [supplierDeleteTarget, setSupplierDeleteTarget] = useState(null);
    const [supplierDeleteBusy, setSupplierDeleteBusy] = useState(false);

    useEffect(() => {
        setSection(initialSection || 'staff');
    }, [initialSection]);

    useEffect(() => {
        if (section !== 'food_menu') {
            setFoodMenuCategoryFilter('');
        }
    }, [section]);

    const staffRows = staff ?? [];
    const buffetRows = buffetTiers ?? [];
    const foodMenuCategoryRows = foodMenuCategories ?? [];
    const foodMenuRowsAll = foodMenus ?? [];
    const foodCategoryRowsAll = foodCategories ?? [];
    const tableRowsAll = tables ?? [];
    const newsRowsAll = news ?? [];
    const newsStaffOptions = newsStaff ?? [];
    const ingredientRowsAll = ingredients ?? [];
    const supplierRowsAll = suppliers ?? [];

    const foodMenuCategoryFilterOptions = useMemo(
        () =>
            foodMenuCategoryRows.map((c) => ({
                value: String(c.id),
                label: c.category_name,
            })),
        [foodMenuCategoryRows]
    );

    const foodMenuDisplayRows = useMemo(() => {
        if (!foodMenuCategoryFilter) {
            return foodMenuRowsAll;
        }
        return foodMenuRowsAll.filter((r) => String(r.category_id) === foodMenuCategoryFilter);
    }, [foodMenuRowsAll, foodMenuCategoryFilter]);

    const addForm = useForm({
        name: '',
        surname: '',
        phone: '',
        username: '',
        password: '',
        role: 'staff',
        address: '',
    });

    const editForm = useForm({
        name: '',
        surname: '',
        phone: '',
        username: '',
        password: '',
        role: 'staff',
        address: '',
    });

    const buffetAddForm = useForm({
        image: null,
        image_url: '',
        tier_name: '',
        price: '',
        description: '',
    });

    const buffetEditForm = useForm({
        image: null,
        image_url: '',
        tier_name: '',
        price: '',
        description: '',
    });

    const menuAddForm = useForm({
        image: null,
        image_url: '',
        name: '',
        category_id: '',
        is_active: '1',
        description: '',
    });

    const menuEditForm = useForm({
        image: null,
        image_url: '',
        name: '',
        category_id: '',
        is_active: '1',
        description: '',
    });

    const catgAddForm = useForm({
        image: null,
        image_url: '',
        catg_name: '',
    });

    const catgEditForm = useForm({
        image: null,
        image_url: '',
        catg_name: '',
    });

    const tableAddForm = useForm({
        table_no: '',
        capacity: '4',
        status: 'available',
        zone: 'standard',
    });

    const tableEditForm = useForm({
        table_no: '',
        capacity: '4',
        status: 'available',
        zone: 'standard',
    });
    const newsAddForm = useForm({
        image: null,
        image_url: '',
        title: '',
        content: '',
        staff_id: '',
        status: 'draft',
    });
    const newsEditForm = useForm({
        image: null,
        image_url: '',
        title: '',
        content: '',
        staff_id: '',
        status: 'draft',
    });
    const ingredientAddForm = useForm({
        ing_name: '',
        ing_unit: 'kg',
        ing_quantity: '',
        ing_min: '',
    });
    const ingredientEditForm = useForm({
        ing_name: '',
        ing_unit: 'kg',
        ing_quantity: '',
        ing_min: '',
    });
    const supplierAddForm = useForm({
        sup_name: '',
        contact_tel: '',
        contact_person: '',
        sup_address: '',
    });
    const supplierEditForm = useForm({
        sup_name: '',
        contact_tel: '',
        contact_person: '',
        sup_address: '',
    });

    const tableFormFields = useMemo(() => {
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
                name: 'status',
                label: 'ສະຖານະໂຕະ',
                type: 'select',
                required: true,
                options: [
                    { value: 'available', label: 'ຫວ່າງ' },
                    { value: 'occupied', label: 'ມີລູກຄ້າ' },
                    { value: 'maintenance', label: 'ຢູ່ລະຫວ່າງປັບປຸງ' },
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
    }, []);

    const newsFormSchema = useMemo(() => {
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
    }, [newsStaffOptions]);

    const ingredientFormSchema = useMemo(
        () => [
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
        ],
        []
    );

    const supplierFormSchema = useMemo(
        () => [
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
                maxLength: 15,
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
        ],
        []
    );

    const menuFormSchema = useMemo(() => {
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
    }, [foodMenuCategoryRows]);

    const categoryFormSchema = useMemo(
        () => (mode) => [
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
        ],
        []
    );

    const changeSection = (value) => {
        setSection(value);
        router.get(route('admin.master-data'), { section: value }, { preserveScroll: true, replace: true });
    };

    const openAdd = useCallback(() => {
        addForm.reset();
        addForm.setData({
            name: '',
            surname: '',
            phone: '',
            username: '',
            password: '',
            role: 'staff',
            address: '',
        });
        setAddOpen(true);
    }, [addForm]);

    const openEdit = useCallback(
        (row) => {
            editForm.clearErrors();
            editForm.setData({
                name: row.name ?? '',
                surname: row.surname ?? '',
                phone: row.phone ?? '',
                username: row.username ?? '',
                password: '',
                role: row.role ?? 'staff',
                address: row.address ?? '',
            });
            setEditing(row);
        },
        [editForm]
    );

    const openBuffetAdd = useCallback(() => {
        buffetAddForm.clearErrors();
        buffetAddForm.setData({
            image: null,
            image_url: '',
            tier_name: '',
            price: '',
            description: '',
        });
        setBuffetAddOpen(true);
    }, [buffetAddForm]);

    const openBuffetEdit = useCallback(
        (row) => {
            buffetEditForm.clearErrors();
            buffetEditForm.setData({
                image: null,
                image_url: row.image_url ?? '',
                tier_name: row.tier_name ?? '',
                price: row.price != null ? String(row.price) : '',
                description: row.description ?? '',
            });
            setBuffetEditing(row);
        },
        [buffetEditForm]
    );

    const submitAdd = (e) => {
        e.preventDefault();
        addForm.post(route('admin.staff.store'), {
            preserveScroll: true,
            onSuccess: () => setAddOpen(false),
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        if (!editing) {
            return;
        }
        editForm.patch(route('admin.staff.update', editing.id), {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    };

    const submitBuffetAdd = (e) => {
        e.preventDefault();
        buffetAddForm.post(route('admin.buffet-tiers.store'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setBuffetAddOpen(false),
        });
    };

    const submitBuffetEdit = (e) => {
        e.preventDefault();
        if (!buffetEditing) {
            return;
        }
        /* POST avoids PATCH + multipart body issues that can clear tier_name/price on the server. */
        buffetEditForm.post(route('admin.buffet-tiers.update', buffetEditing.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setBuffetEditing(null),
        });
    };

    const requestDelete = useCallback((row) => {
        setDeleteTarget(row);
    }, []);

    const runDelete = useCallback(() => {
        const id = deleteTarget?.id;
        if (id == null) {
            return;
        }
        setDeleteBusy(true);
        router.delete(route('admin.staff.destroy', id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleteBusy(false);
                setDeleteTarget(null);
            },
        });
    }, [deleteTarget]);

    const requestBuffetDelete = useCallback((row) => {
        setBuffetDeleteTarget(row);
    }, []);

    const runBuffetDelete = useCallback(() => {
        const id = buffetDeleteTarget?.id;
        if (id == null) {
            return;
        }
        setBuffetDeleteBusy(true);
        router.delete(route('admin.buffet-tiers.destroy', id), {
            preserveScroll: true,
            onFinish: () => {
                setBuffetDeleteBusy(false);
                setBuffetDeleteTarget(null);
            },
        });
    }, [buffetDeleteTarget]);

    const openMenuAdd = useCallback(() => {
        menuAddForm.clearErrors();
        const firstCat = foodMenuCategoryRows[0];
        menuAddForm.setData({
            image: null,
            image_url: '',
            name: '',
            category_id: firstCat ? String(firstCat.id) : '',
            is_active: '1',
            description: '',
        });
        setMenuAddOpen(true);
    }, [menuAddForm, foodMenuCategoryRows]);

    const openMenuEdit = useCallback(
        (row) => {
            menuEditForm.clearErrors();
            menuEditForm.setData({
                image: null,
                image_url: row.image_url ?? '',
                name: row.name ?? '',
                category_id: row.category_id != null ? String(row.category_id) : '',
                is_active: row.is_active ? '1' : '0',
                description: row.description ?? '',
            });
            setMenuEditing(row);
        },
        [menuEditForm]
    );

    const submitMenuAdd = (e) => {
        e.preventDefault();
        menuAddForm.post(route('admin.menus.store'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setMenuAddOpen(false),
        });
    };

    const submitMenuEdit = (e) => {
        e.preventDefault();
        if (!menuEditing) {
            return;
        }
        menuEditForm.post(route('admin.menus.update', menuEditing.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setMenuEditing(null),
        });
    };

    const requestMenuDelete = useCallback((row) => {
        setMenuDeleteTarget(row);
    }, []);

    const runMenuDelete = useCallback(() => {
        const id = menuDeleteTarget?.id;
        if (id == null) {
            return;
        }
        setMenuDeleteBusy(true);
        router.delete(route('admin.menus.destroy', id), {
            preserveScroll: true,
            onFinish: () => {
                setMenuDeleteBusy(false);
                setMenuDeleteTarget(null);
            },
        });
    }, [menuDeleteTarget]);

    const openCatgAdd = useCallback(() => {
        catgAddForm.clearErrors();
        catgAddForm.setData({
            image: null,
            image_url: '',
            catg_name: '',
        });
        setCatgAddOpen(true);
    }, [catgAddForm]);

    const openCatgEdit = useCallback(
        (row) => {
            catgEditForm.clearErrors();
            catgEditForm.setData({
                image: null,
                image_url: row.image_url ?? '',
                catg_name: row.catg_name ?? '',
            });
            setCatgEditing(row);
        },
        [catgEditForm]
    );

    const submitCatgAdd = (e) => {
        e.preventDefault();
        catgAddForm.post(route('admin.menu-categories.store'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setCatgAddOpen(false),
        });
    };

    const submitCatgEdit = (e) => {
        e.preventDefault();
        if (!catgEditing) {
            return;
        }
        catgEditForm.post(route('admin.menu-categories.update', catgEditing.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setCatgEditing(null),
        });
    };

    const requestCatgDelete = useCallback((row) => {
        setCatgDeleteTarget(row);
    }, []);

    const runCatgDelete = useCallback(() => {
        const id = catgDeleteTarget?.id;
        if (id == null) {
            return;
        }
        setCatgDeleteBusy(true);
        router.delete(route('admin.menu-categories.destroy', id), {
            preserveScroll: true,
            onFinish: () => {
                setCatgDeleteBusy(false);
                setCatgDeleteTarget(null);
            },
        });
    }, [catgDeleteTarget]);

    const openTableAdd = useCallback(() => {
        tableAddForm.clearErrors();
        tableAddForm.setData({
            table_no: '',
            capacity: '4',
            status: 'available',
            zone: 'standard',
        });
        setTableAddOpen(true);
    }, [tableAddForm]);

    const openTableEdit = useCallback(
        (row) => {
            tableEditForm.clearErrors();
            tableEditForm.setData({
                table_no: row.table_no ?? '',
                capacity: row.capacity != null ? String(row.capacity) : '4',
                status: row.status ?? 'available',
                zone: row.zone === 'vip' ? 'vip' : 'standard',
            });
            setTableEditing(row);
        },
        [tableEditForm]
    );

    const submitTableAdd = (e) => {
        e.preventDefault();
        tableAddForm.post(route('admin.tables.store'), {
            preserveScroll: true,
            onSuccess: () => setTableAddOpen(false),
        });
    };

    const submitTableEdit = (e) => {
        e.preventDefault();
        if (!tableEditing) {
            return;
        }
        tableEditForm.patch(route('admin.tables.update', tableEditing.id), {
            preserveScroll: true,
            onSuccess: () => setTableEditing(null),
        });
    };

    const requestTableDelete = useCallback((row) => {
        setTableDeleteTarget(row);
    }, []);

    const runTableDelete = useCallback(() => {
        const id = tableDeleteTarget?.id;
        if (id == null) {
            return;
        }
        setTableDeleteBusy(true);
        router.delete(route('admin.tables.destroy', id), {
            preserveScroll: true,
            onFinish: () => {
                setTableDeleteBusy(false);
                setTableDeleteTarget(null);
            },
        });
    }, [tableDeleteTarget]);

    const openNewsAdd = useCallback(() => {
        newsAddForm.clearErrors();
        newsAddForm.setData({
            image: null,
            image_url: '',
            title: '',
            content: '',
            staff_id: newsStaffOptions[0]?.id ? String(newsStaffOptions[0].id) : '',
            status: 'draft',
        });
        setNewsAddOpen(true);
    }, [newsAddForm, newsStaffOptions]);

    const openNewsEdit = useCallback(
        (row) => {
            newsEditForm.clearErrors();
            newsEditForm.setData({
                image: null,
                image_url: row.image_url ?? '',
                title: row.title ?? '',
                content: row.content ?? '',
                staff_id: row.staff_id != null ? String(row.staff_id) : '',
                status: row.status ?? 'draft',
            });
            setNewsEditing(row);
        },
        [newsEditForm]
    );

    const submitNewsAdd = (e) => {
        e.preventDefault();
        newsAddForm.post(route('admin.news.store'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setNewsAddOpen(false),
        });
    };

    const submitNewsEdit = (e) => {
        e.preventDefault();
        if (!newsEditing) {
            return;
        }
        newsEditForm.post(route('admin.news.update', newsEditing.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setNewsEditing(null),
        });
    };

    const requestNewsDelete = useCallback((row) => {
        setNewsDeleteTarget(row);
    }, []);

    const runNewsDelete = useCallback(() => {
        const id = newsDeleteTarget?.id;
        if (id == null) {
            return;
        }
        setNewsDeleteBusy(true);
        router.delete(route('admin.news.destroy', id), {
            preserveScroll: true,
            onFinish: () => {
                setNewsDeleteBusy(false);
                setNewsDeleteTarget(null);
            },
        });
    }, [newsDeleteTarget]);

    const openIngredientAdd = useCallback(() => {
        ingredientAddForm.clearErrors();
        ingredientAddForm.setData({
            ing_name: '',
            ing_unit: 'kg',
            ing_quantity: '',
            ing_min: '',
        });
        setIngredientAddOpen(true);
    }, [ingredientAddForm]);

    const openIngredientEdit = useCallback(
        (row) => {
            ingredientEditForm.clearErrors();
            ingredientEditForm.setData({
                ing_name: row.ing_name ?? '',
                ing_unit: row.ing_unit ?? 'kg',
                ing_quantity: row.ing_quantity != null ? String(row.ing_quantity) : '',
                ing_min: row.ing_min != null ? String(row.ing_min) : '',
            });
            setIngredientEditing(row);
        },
        [ingredientEditForm]
    );

    const submitIngredientAdd = (e) => {
        e.preventDefault();
        ingredientAddForm.post(route('admin.ingredients.store'), {
            preserveScroll: true,
            onSuccess: () => setIngredientAddOpen(false),
        });
    };

    const submitIngredientEdit = (e) => {
        e.preventDefault();
        if (!ingredientEditing) {
            return;
        }
        ingredientEditForm.patch(route('admin.ingredients.update', ingredientEditing.id), {
            preserveScroll: true,
            onSuccess: () => setIngredientEditing(null),
        });
    };

    const requestIngredientDelete = useCallback((row) => {
        setIngredientDeleteTarget(row);
    }, []);

    const runIngredientDelete = useCallback(() => {
        const id = ingredientDeleteTarget?.id;
        if (id == null) {
            return;
        }
        setIngredientDeleteBusy(true);
        router.delete(route('admin.ingredients.destroy', id), {
            preserveScroll: true,
            onFinish: () => {
                setIngredientDeleteBusy(false);
                setIngredientDeleteTarget(null);
            },
        });
    }, [ingredientDeleteTarget]);

    const openSupplierAdd = useCallback(() => {
        supplierAddForm.clearErrors();
        supplierAddForm.setData({
            sup_name: '',
            contact_tel: '',
            contact_person: '',
            sup_address: '',
        });
        setSupplierAddOpen(true);
    }, [supplierAddForm]);

    const openSupplierEdit = useCallback(
        (row) => {
            supplierEditForm.clearErrors();
            supplierEditForm.setData({
                sup_name: row.sup_name ?? '',
                contact_tel: row.contact_tel ?? '',
                contact_person: row.contact_person ?? '',
                sup_address: row.sup_address ?? '',
            });
            setSupplierEditing(row);
        },
        [supplierEditForm]
    );

    const submitSupplierAdd = (e) => {
        e.preventDefault();
        supplierAddForm.post(route('admin.suppliers.store'), {
            preserveScroll: true,
            onSuccess: () => setSupplierAddOpen(false),
        });
    };

    const submitSupplierEdit = (e) => {
        e.preventDefault();
        if (!supplierEditing) {
            return;
        }
        supplierEditForm.patch(route('admin.suppliers.update', supplierEditing.id), {
            preserveScroll: true,
            onSuccess: () => setSupplierEditing(null),
        });
    };

    const requestSupplierDelete = useCallback((row) => {
        setSupplierDeleteTarget(row);
    }, []);

    const runSupplierDelete = useCallback(() => {
        const id = supplierDeleteTarget?.id;
        if (id == null) {
            return;
        }
        setSupplierDeleteBusy(true);
        router.delete(route('admin.suppliers.destroy', id), {
            preserveScroll: true,
            onFinish: () => {
                setSupplierDeleteBusy(false);
                setSupplierDeleteTarget(null);
            },
        });
    }, [supplierDeleteTarget]);

    const staffColumns = useMemo(
        () => [
            {
                key: 'idx',
                header: '#',
                className: 'w-14 text-slate-600',
                cell: ({ index }) => <span>{index + 1}</span>,
            },
            {
                key: 'name',
                header: 'ຊື່ ແລະ ນາມສະກຸນ',
                cell: ({ row }) => (
                    <div className="flex min-w-0 items-center gap-3">
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-inner"
                            style={{ backgroundColor: primary }}
                        >
                            {staffInitials(row.name, row.surname)}
                        </div>
                        <span className="font-medium text-slate-900">
                            {row.name} {row.surname}
                        </span>
                    </div>
                ),
            },
            {
                key: 'phone',
                header: 'ເບີໂທ',
                cell: ({ row }) => <span className="whitespace-nowrap text-slate-800">{row.phone}</span>,
            },
            {
                key: 'role',
                header: 'ຕຳແໜ່ງ',
                cell: ({ row }) => <span className="whitespace-nowrap">{roleLabel(row.role)}</span>,
            },
            {
                key: 'joined',
                header: 'ວັນທີເຂົ້າຮ່ວມ',
                cell: ({ row }) => <span className="whitespace-nowrap text-slate-600">{formatJoined(row.created_at)}</span>,
            },
            {
                key: 'actions',
                header: 'Action',
                className: 'w-40',
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            ແກ້ໄຂ
                        </button>
                        <button
                            type="button"
                            onClick={() => requestDelete(row)}
                            disabled={row.id === currentStaffId}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            ລຶບ
                        </button>
                    </div>
                ),
            },
        ],
        [currentStaffId, openEdit, requestDelete]
    );

    const buffetColumns = useMemo(
        () => [
            {
                key: 'idx',
                header: '#',
                className: 'w-14 text-slate-600',
                cell: ({ index }) => <span>{index + 1}</span>,
            },
            {
                key: 'tier_name',
                header: 'ຊື່ແພັກເກັດ ແລະ ຮູບພາບ',
                cell: ({ row }) => <TablePackageNameCell imageUrl={row.image_url} name={row.tier_name} />,
            },
            {
                key: 'price',
                header: 'ລາຄາຕໍ່ຄົນ',
                className: 'whitespace-nowrap',
                cell: ({ row }) => <span className="font-medium text-slate-900">{formatBuffetPrice(row.price)}</span>,
            },
            {
                key: 'description',
                header: 'ລາຍລະອຽດ',
                cell: ({ row }) => (
                    <span className="block max-w-md whitespace-pre-wrap text-slate-800">{row.description || '—'}</span>
                ),
            },
            {
                key: 'actions',
                header: 'Action',
                className: 'w-40',
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => openBuffetEdit(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            ແກ້ໄຂ
                        </button>
                        <button
                            type="button"
                            onClick={() => requestBuffetDelete(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            ລຶບ
                        </button>
                    </div>
                ),
            },
        ],
        [openBuffetEdit, requestBuffetDelete]
    );

    const foodMenuColumns = useMemo(
        () => [
            {
                key: 'idx',
                header: '#',
                className: 'w-14 text-slate-600',
                cell: ({ index }) => <span>{index + 1}</span>,
            },
            {
                key: 'name',
                header: 'ຊື່ລາຍການ ແລະ ຮູບພາບ',
                cell: ({ row }) => <TablePackageNameCell imageUrl={row.image_url} name={row.name} />,
            },
            {
                key: 'description',
                header: 'ລາຍລະອຽດ',
                cell: ({ row }) => (
                    <span className="block max-w-md whitespace-pre-wrap text-slate-800">{row.description || '—'}</span>
                ),
            },
            {
                key: 'category',
                header: 'ໝວດໝູ່',
                cell: ({ row }) => (
                    <span className="inline-flex max-w-full rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-800">
                        {row.category_name || '—'}
                    </span>
                ),
            },
            {
                key: 'status',
                header: 'ສະຖານະ',
                cell: ({ row }) =>
                    row.is_active ? (
                        <span className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                            ເປີດໃຊ້ງານ
                        </span>
                    ) : (
                        <span className="inline-flex rounded-full bg-slate-400 px-3 py-1 text-xs font-bold text-white shadow-sm">
                            ປິດໃຊ້ງານ
                        </span>
                    ),
            },
            {
                key: 'actions',
                header: 'Action',
                className: 'w-40',
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => openMenuEdit(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            ແກ້ໄຂ
                        </button>
                        <button
                            type="button"
                            onClick={() => requestMenuDelete(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            ລຶບ
                        </button>
                    </div>
                ),
            },
        ],
        [openMenuEdit, requestMenuDelete]
    );

    const foodCategoryColumns = useMemo(
        () => [
            {
                key: 'idx',
                header: '#',
                className: 'w-14 text-slate-600',
                cell: ({ index }) => <span>{index + 1}</span>,
            },
            {
                key: 'image',
                header: 'ຮູບພາບ',
                className: 'w-24',
                cell: ({ row }) => (
                    <div
                        className="flex h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-200 shadow-inner"
                        aria-hidden
                    >
                        {row.image_url ? (
                            <img src={row.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : null}
                    </div>
                ),
            },
            {
                key: 'catg_name',
                header: 'ປະເພດອາຫານ',
                cell: ({ row }) => <span className="font-semibold text-slate-900">{row.catg_name}</span>,
            },
            {
                key: 'actions',
                header: 'Action',
                className: 'w-40',
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => openCatgEdit(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            ແກ້ໄຂ
                        </button>
                        <button
                            type="button"
                            onClick={() => requestCatgDelete(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            ລຶບ
                        </button>
                    </div>
                ),
            },
        ],
        [openCatgEdit, requestCatgDelete]
    );

    const tableColumns = useMemo(
        () => [
            {
                key: 'idx',
                header: '#',
                className: 'w-14 text-slate-600',
                cell: ({ index }) => <span>{index + 1}</span>,
            },
            {
                key: 'table_no',
                header: 'ລະຫັດໂຕະ',
                cell: ({ row }) => <span className="font-semibold text-slate-900">{row.table_no ?? '—'}</span>,
            },
            {
                key: 'capacity',
                header: 'ບ່ອນນັ່ງໂຕະ',
                cell: ({ row }) => {
                    const c = row.capacity;
                    if (c == null || Number.isNaN(Number(c))) {
                        return '—';
                    }
                    return (
                        <span className="text-slate-800">
                            {Number(c)} ທີ່ນັ່ງ
                        </span>
                    );
                },
            },
            {
                key: 'zone',
                header: 'ໂຊນ',
                cell: ({ row }) => <span className="text-slate-700">{zoneLabel(row.zone)}</span>,
            },
            {
                key: 'status',
                header: 'ສະຖານະໂຕະ',
                cell: ({ row }) => tableStatusBadge(row.status),
            },
            {
                key: 'actions',
                header: 'Action',
                className: 'w-40',
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => openTableEdit(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            ແກ້ໄຂ
                        </button>
                        <button
                            type="button"
                            onClick={() => requestTableDelete(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            ລຶບ
                        </button>
                    </div>
                ),
            },
        ],
        [openTableEdit, requestTableDelete]
    );

    const newsColumns = useMemo(
        () => [
            {
                key: 'idx',
                header: '#',
                className: 'w-14 text-slate-600',
                cell: ({ index }) => <span>{index + 1}</span>,
            },
            {
                key: 'title',
                header: 'ຮູບພາບ ແລະ ຫົວຂໍ້',
                cell: ({ row }) => (
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-200 shadow-inner">
                            {row.image_url ? <img src={row.image_url} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                        </div>
                        <span className="line-clamp-2 font-semibold text-slate-900">{row.title || '—'}</span>
                    </div>
                ),
            },
            {
                key: 'content',
                header: 'ເນື້ອຫາຂ່າວ',
                cell: ({ row }) => (
                    <span className="block max-w-md truncate text-slate-700" title={row.content || ''}>
                        {row.content || '—'}
                    </span>
                ),
            },
            {
                key: 'staff',
                header: 'ລະຫັດພະນັກງານທີ່ໂພສ',
                cell: ({ row }) => <span className="text-slate-700">{row.staff_name || row.staff_id || '—'}</span>,
            },
            {
                key: 'status',
                header: 'ສະຖານະຂ່າວ',
                cell: ({ row }) => newsStatusBadge(row.status),
            },
            {
                key: 'actions',
                header: 'Action',
                className: 'w-40',
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => openNewsEdit(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            ແກ້ໄຂ
                        </button>
                        <button
                            type="button"
                            onClick={() => requestNewsDelete(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            ລຶບ
                        </button>
                    </div>
                ),
            },
        ],
        [openNewsEdit, requestNewsDelete]
    );

    const ingredientColumns = useMemo(
        () => [
            {
                key: 'idx',
                header: '#',
                className: 'w-14 text-slate-600',
                cell: ({ index }) => <span>{index + 1}</span>,
            },
            {
                key: 'ing_name',
                header: 'ຊື່ວັດຖຸດິບ',
                cell: ({ row }) => <span className="font-semibold text-slate-900">{row.ing_name ?? '—'}</span>,
            },
            {
                key: 'ing_unit',
                header: 'ຫົວໜ່ວຍ',
                cell: ({ row }) => <span className="text-slate-700">{row.ing_unit ?? '—'}</span>,
            },
            {
                key: 'ing_quantity',
                header: 'ຈຳນວນຄົງເຫຼືອ',
                cell: ({ row }) => <span className="text-slate-800">{row.ing_quantity ?? '—'}</span>,
            },
            {
                key: 'ing_min',
                header: 'ຈຳນວນຂັ້ນຕ່ຳທີ່ຕ້ອງທົດຊື້',
                cell: ({ row }) => <span className="text-slate-800">{row.ing_min ?? '—'}</span>,
            },
            {
                key: 'status',
                header: 'ສະຖານະວັດຖຸດິບ',
                cell: ({ row }) => ingredientStatusBadge(row.ing_quantity, row.ing_min),
            },
            {
                key: 'actions',
                header: 'Action',
                className: 'w-40',
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => openIngredientEdit(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            ແກ້ໄຂ
                        </button>
                        <button
                            type="button"
                            onClick={() => requestIngredientDelete(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            ລຶບ
                        </button>
                    </div>
                ),
            },
        ],
        [openIngredientEdit, requestIngredientDelete]
    );

    const supplierColumns = useMemo(
        () => [
            {
                key: 'idx',
                header: '#',
                className: 'w-14 text-slate-600',
                cell: ({ index }) => <span>{index + 1}</span>,
            },
            {
                key: 'sup_name',
                header: 'ຊື່ຜູ້ສະໜອງ',
                cell: ({ row }) => <span className="font-semibold text-slate-900">{row.sup_name ?? '—'}</span>,
            },
            {
                key: 'contact_tel',
                header: 'ເບີໂທຜູ້ສະໜອງ',
                cell: ({ row }) => <span className="text-slate-700">{row.contact_tel ?? '—'}</span>,
            },
            {
                key: 'contact_person',
                header: 'ຊື່ຜູ້ປະສານ',
                cell: ({ row }) => <span className="text-slate-700">{row.contact_person ?? '—'}</span>,
            },
            {
                key: 'sup_address',
                header: 'ທີ່ຢູ່ຜູ້ສະໜອງ',
                cell: ({ row }) => <span className="block max-w-md truncate text-slate-700">{row.sup_address ?? '—'}</span>,
            },
            {
                key: 'actions',
                header: 'Action',
                className: 'w-40',
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => openSupplierEdit(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            ແກ້ໄຂ
                        </button>
                        <button
                            type="button"
                            onClick={() => requestSupplierDelete(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            ລຶບ
                        </button>
                    </div>
                ),
            },
        ],
        [openSupplierEdit, requestSupplierDelete]
    );

    const placeholderColumns = useMemo(
        () => [
            {
                key: 'i',
                header: '#',
                cell: ({ index }) => index + 1,
            },
            {
                key: 'msg',
                header: 'ສະຖານະ',
                cell: () => <span className="text-slate-500">ກຳລັງພັດທະນາ</span>,
            },
        ],
        []
    );

    const toolbarAlign = 'w-full max-w-md sm:ml-auto lg:ml-0';

    const renderDataTable = () => {
        if (section === 'staff') {
            return (
                <GenericDataTable
                    title="ຂໍ້ມູນພະນັກງານ"
                    columns={staffColumns}
                    rows={staffRows}
                    searchKeys={['name', 'surname', 'phone', 'username']}
                    searchPlaceholder="ຄົ້ນຫາ…"
                    totalCount={staffRows.length}
                    totalLabel="ທັງໝົດ"
                    countSuffix="ຄົນ"
                    emptyMessage="ຍັງບໍ່ມີພະນັກງານ"
                    onAdd={openAdd}
                    addButtonLabel="ເພີ່ມພະນັກງານ"
                    primaryColor={primary}
                    toolbarClassName={toolbarAlign}
                />
            );
        }
        if (section === 'buffet_menu') {
            return (
                <GenericDataTable
                    title="ຂໍ້ມູນປະເພດບຸບເຟ່"
                    columns={buffetColumns}
                    rows={buffetRows}
                    searchKeys={['tier_name', 'description']}
                    searchPlaceholder="ຄົ້ນຫາ…"
                    totalCount={buffetRows.length}
                    totalLabel="ທັງໝົດ"
                    countSuffix="ລາຍການ"
                    emptyMessage="ຍັງບໍ່ມີປະເພດບຸບເຟ່"
                    onAdd={openBuffetAdd}
                    addButtonLabel="ເພີ່ມປະເພດບຸບເຟ່"
                    primaryColor={primary}
                    toolbarClassName={toolbarAlign}
                />
            );
        }
        if (section === 'food_menu') {
            return (
                <GenericDataTable
                    title="ຂໍ້ມູນລາຍການອາຫານ"
                    columns={foodMenuColumns}
                    rows={foodMenuDisplayRows}
                    searchKeys={['name', 'description', 'category_name']}
                    searchPlaceholder="ຄົ້ນຫາ…"
                    totalCount={foodMenuDisplayRows.length}
                    totalLabel="ທັງໝົດ"
                    countSuffix="ລາຍການ"
                    emptyMessage="ຍັງບໍ່ມີລາຍການອາຫານ"
                    onAdd={foodMenuCategoryRows.length > 0 ? openMenuAdd : undefined}
                    addButtonLabel="ເພີ່ມລາຍການອາຫານ"
                    primaryColor={primary}
                    toolbarClassName="w-full lg:ml-0"
                    categoryFilter={{
                        value: foodMenuCategoryFilter,
                        onChange: setFoodMenuCategoryFilter,
                        options: foodMenuCategoryFilterOptions,
                        allLabel: 'ທຸກໝວດໝູ່',
                    }}
                />
            );
        }
        if (section === 'food_categories') {
            return (
                <GenericDataTable
                    title="ຂໍ້ມູນປະເພດອາຫານ"
                    columns={foodCategoryColumns}
                    rows={foodCategoryRowsAll}
                    searchKeys={['catg_name']}
                    searchPlaceholder="ຄົ້ນຫາ…"
                    totalCount={foodCategoryRowsAll.length}
                    totalLabel="ທັງໝົດ"
                    countSuffix="ລາຍການ"
                    emptyMessage="ຍັງບໍ່ມີປະເພດອາຫານ"
                    onAdd={openCatgAdd}
                    addButtonLabel="ເພີ່ມປະເພດອາຫານ"
                    primaryColor={primary}
                    toolbarClassName={toolbarAlign}
                />
            );
        }
        if (section === 'tables') {
            return (
                <GenericDataTable
                    title="ຂໍ້ມູນໂຕະ"
                    columns={tableColumns}
                    rows={tableRowsAll}
                    searchKeys={['table_no', 'zone', 'status']}
                    searchPlaceholder="ຄົ້ນຫາ…"
                    totalCount={tableRowsAll.length}
                    totalLabel="ທັງໝົດ"
                    countSuffix="ໂຕະ"
                    emptyMessage="ຍັງບໍ່ມີຂໍ້ມູນໂຕະ"
                    onAdd={openTableAdd}
                    addButtonLabel="ເພີ່ມຂໍ້ມູນໂຕະ"
                    primaryColor={primary}
                    toolbarClassName={toolbarAlign}
                />
            );
        }
        if (section === 'news') {
            return (
                <GenericDataTable
                    title="ຂໍ້ມູນຂ່າວສານ"
                    columns={newsColumns}
                    rows={newsRowsAll}
                    searchKeys={['title']}
                    searchPlaceholder="ຄົ້ນຫາຫົວຂໍ້ຂ່າວ…"
                    totalCount={newsRowsAll.length}
                    totalLabel="ທັງໝົດ"
                    countSuffix="ຂ່າວ"
                    emptyMessage="ຍັງບໍ່ມີຂ່າວສານ"
                    onAdd={openNewsAdd}
                    addButtonLabel="ເພີ່ມຂ່າວສານ"
                    primaryColor={primary}
                    toolbarClassName={toolbarAlign}
                />
            );
        }
        if (section === 'ingredients_master') {
            return (
                <GenericDataTable
                    title="ຂໍ້ມູນວັດຖຸດິບ"
                    columns={ingredientColumns}
                    rows={ingredientRowsAll}
                    searchKeys={['ing_name']}
                    searchPlaceholder="ຄົ້ນຫາວັດຖຸດິບ…"
                    totalCount={ingredientRowsAll.length}
                    totalLabel="ທັງໝົດ"
                    countSuffix="ລາຍການ"
                    emptyMessage="ຍັງບໍ່ມີວັດຖຸດິບ"
                    onAdd={openIngredientAdd}
                    addButtonLabel="ເພີ່ມຂໍ້ມູນວັດຖຸດິບ"
                    primaryColor={primary}
                    toolbarClassName={toolbarAlign}
                />
            );
        }
        if (section === 'suppliers') {
            return (
                <GenericDataTable
                    title="ຂໍ້ມູນຜູ້ສະໜອງ"
                    columns={supplierColumns}
                    rows={supplierRowsAll}
                    searchKeys={['sup_name', 'contact_person']}
                    searchPlaceholder="ຄົ້ນຫາຜູ້ສະໜອງ…"
                    totalCount={supplierRowsAll.length}
                    totalLabel="ທັງໝົດ"
                    countSuffix="ລາຍການ"
                    emptyMessage="ຍັງບໍ່ມີຜູ້ສະໜອງ"
                    onAdd={openSupplierAdd}
                    addButtonLabel="ເພີ່ມຂໍ້ມູນຜູ້ສະໜອງ"
                    primaryColor={primary}
                    toolbarClassName={toolbarAlign}
                />
            );
        }
        return (
            <GenericDataTable
                title={MASTER_DATA_SECTIONS.find((s) => s.value === section)?.label ?? ''}
                columns={placeholderColumns}
                rows={[]}
                searchKeys={[]}
                emptyMessage="ກຳລັງພັດທະນາ — ໃຊ້ຕາຕະລາງກົງກັນນີ້ເມນື່ອງມີ API."
                primaryColor={primary}
                toolbarClassName={toolbarAlign}
            />
        );
    };

    return (
        <AdminLayout title="ຈັດການຂໍ້ມູນພື້ນຖານ">
            <Head title="ຈັດການຂໍ້ມູນພື້ນຖານ" />

            <div className="-mx-4 -mt-2 bg-slate-50 px-4 pb-12 pt-4 md:-mx-8 md:px-8 md:pb-14 md:pt-6">
                <div className="mx-auto max-w-6xl space-y-10">
                    {pageErrors?.staff && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm shadow-slate-200/40 sm:px-5">
                            {pageErrors.staff}
                        </div>
                    )}
                    {pageErrors?.buffet_tier && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm shadow-slate-200/40 sm:px-5">
                            {pageErrors.buffet_tier}
                        </div>
                    )}
                    {pageErrors?.menu && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm shadow-slate-200/40 sm:px-5">
                            {pageErrors.menu}
                        </div>
                    )}
                    {pageErrors?.menu_category && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm shadow-slate-200/40 sm:px-5">
                            {pageErrors.menu_category}
                        </div>
                    )}
                    {pageErrors?.table && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm shadow-slate-200/40 sm:px-5">
                            {pageErrors.table}
                        </div>
                    )}
                    {pageErrors?.news && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm shadow-slate-200/40 sm:px-5">
                            {pageErrors.news}
                        </div>
                    )}
                    {pageErrors?.ingredient && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm shadow-slate-200/40 sm:px-5">
                            {pageErrors.ingredient}
                        </div>
                    )}
                    {pageErrors?.supplier && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm shadow-slate-200/40 sm:px-5">
                            {pageErrors.supplier}
                        </div>
                    )}

                    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-200/80 sm:p-8">
                        <div className="flex items-start gap-4">
                            <div
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50 text-slate-700 shadow-sm"
                                aria-hidden
                            >
                                <Database className="h-6 w-6" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <label
                                    htmlFor="master-section"
                                    className="block text-xl font-bold tracking-tight text-[#0f2744] sm:text-2xl"
                                >
                                    ເລືອກປະເພດຂໍ້ມູນ
                                </label>
                                <p className="mt-1 text-sm text-slate-500">ເລືອກປະເພດຂໍ້ມູນທີ່ຕ້ອງການຈັດການ</p>
                            </div>
                        </div>

                        <div className="relative mt-5 max-w-md">
                            <select
                                id="master-section"
                                className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-3.5 pl-4 pr-12 text-base font-semibold text-slate-800 shadow-sm outline-none transition hover:border-slate-300 hover:bg-slate-50/90 focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/25"
                                value={section}
                                onChange={(e) => changeSection(e.target.value)}
                            >
                                {MASTER_DATA_SECTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                                strokeWidth={2}
                                aria-hidden
                            />
                        </div>
                    </section>

                    {renderDataTable()}
                </div>
            </div>

            <GenericFormModal
                open={addOpen}
                onClose={() => !addForm.processing && setAddOpen(false)}
                title="ຟອມເພີ່ມພະນັກງານ"
                submitLabel="ເພີ່ມພະນັກງານ"
                formId="master-add-staff"
                schema={staffFormSchema('add')}
                data={addForm.data}
                setData={addForm.setData}
                errors={addForm.errors}
                processing={addForm.processing}
                onSubmit={submitAdd}
                primaryColor={primary}
            />

            <GenericFormModal
                open={Boolean(editing)}
                onClose={() => !editForm.processing && setEditing(null)}
                title="ຟອມແກ້ໄຂຂໍ້ມູນພະນັກງານ"
                submitLabel="ບັນທຶກການແກ້ໄຂ"
                formId="master-edit-staff"
                schema={staffFormSchema('edit')}
                data={editForm.data}
                setData={editForm.setData}
                errors={editForm.errors}
                processing={editForm.processing}
                onSubmit={submitEdit}
                primaryColor={primary}
            />

            <GenericFormModal
                open={buffetAddOpen}
                onClose={() => !buffetAddForm.processing && setBuffetAddOpen(false)}
                title="ຟອມເພີ່ມຂໍ້ມູນບຸບເຟ່"
                submitLabel="ເພີ່ມເມນູບຸບເຟ່"
                formId="master-add-buffet-tier"
                schema={buffetFormSchema('add')}
                data={buffetAddForm.data}
                setData={buffetAddForm.setData}
                errors={buffetAddForm.errors}
                processing={buffetAddForm.processing}
                onSubmit={submitBuffetAdd}
                primaryColor={primary}
                panelMaxClassName="sm:max-w-lg"
            />

            <GenericFormModal
                open={Boolean(buffetEditing)}
                onClose={() => !buffetEditForm.processing && setBuffetEditing(null)}
                title="ຟອມແກ້ໄຂຂໍ້ມູນບຸບເຟ່"
                submitLabel="ບັນທຶກການແກ້ໄຂ"
                formId="master-edit-buffet-tier"
                schema={buffetFormSchema('edit')}
                data={buffetEditForm.data}
                setData={buffetEditForm.setData}
                errors={buffetEditForm.errors}
                processing={buffetEditForm.processing}
                onSubmit={submitBuffetEdit}
                primaryColor={primary}
                panelMaxClassName="sm:max-w-lg"
            />

            <GenericFormModal
                open={menuAddOpen}
                onClose={() => !menuAddForm.processing && setMenuAddOpen(false)}
                title="ຟອມເພີ່ມຂໍ້ມູນລາຍການອາຫານ"
                submitLabel="ເພີ່ມຂໍ້ມູນອາຫານ"
                formId="master-add-menu"
                schema={menuFormSchema('add')}
                data={menuAddForm.data}
                setData={menuAddForm.setData}
                errors={menuAddForm.errors}
                processing={menuAddForm.processing}
                onSubmit={submitMenuAdd}
                primaryColor={primary}
                panelMaxClassName="sm:max-w-2xl"
                splitLeadImage
            />

            <GenericFormModal
                open={Boolean(menuEditing)}
                onClose={() => !menuEditForm.processing && setMenuEditing(null)}
                title="ຟອມແກ້ໄຂຂໍ້ມູນລາຍການອາຫານ"
                submitLabel="ບັນທຶກການແກ້ໄຂ"
                formId="master-edit-menu"
                schema={menuFormSchema('edit')}
                data={menuEditForm.data}
                setData={menuEditForm.setData}
                errors={menuEditForm.errors}
                processing={menuEditForm.processing}
                onSubmit={submitMenuEdit}
                primaryColor={primary}
                panelMaxClassName="sm:max-w-2xl"
                splitLeadImage
            />

            <GenericFormModal
                open={catgAddOpen}
                onClose={() => !catgAddForm.processing && setCatgAddOpen(false)}
                title="ເພີ່ມປະເພດອາຫານ"
                submitLabel="ບັນທຶກປະເພດອາຫານ"
                formId="master-add-menu-catg"
                schema={categoryFormSchema('add')}
                data={catgAddForm.data}
                setData={catgAddForm.setData}
                errors={catgAddForm.errors}
                processing={catgAddForm.processing}
                onSubmit={submitCatgAdd}
                primaryColor={primary}
                panelMaxClassName="sm:max-w-lg"
                splitLeadImage
            />

            <GenericFormModal
                open={Boolean(catgEditing)}
                onClose={() => !catgEditForm.processing && setCatgEditing(null)}
                title="ແກ້ໄຂປະເພດອາຫານ"
                submitLabel="ບັນທຶກການແກ້ໄຂ"
                formId="master-edit-menu-catg"
                schema={categoryFormSchema('edit')}
                data={catgEditForm.data}
                setData={catgEditForm.setData}
                errors={catgEditForm.errors}
                processing={catgEditForm.processing}
                onSubmit={submitCatgEdit}
                primaryColor={primary}
                panelMaxClassName="sm:max-w-lg"
                splitLeadImage
            />

            <GenericFormModal
                open={tableAddOpen}
                onClose={() => !tableAddForm.processing && setTableAddOpen(false)}
                title="ເພີ່ມຂໍ້ມູນໂຕະ"
                submitLabel="ບັນທຶກຂໍ້ມູນໂຕະ"
                formId="master-add-table"
                schema={tableFormFields}
                data={tableAddForm.data}
                setData={tableAddForm.setData}
                errors={tableAddForm.errors}
                processing={tableAddForm.processing}
                onSubmit={submitTableAdd}
                primaryColor={primary}
                panelMaxClassName="sm:max-w-lg"
            />

            <GenericFormModal
                open={Boolean(tableEditing)}
                onClose={() => !tableEditForm.processing && setTableEditing(null)}
                title="ແກ້ໄຂຂໍ້ມູນໂຕະ"
                submitLabel="ບັນທຶກຂໍ້ມູນໂຕະ"
                formId="master-edit-table"
                schema={tableFormFields}
                data={tableEditForm.data}
                setData={tableEditForm.setData}
                errors={tableEditForm.errors}
                processing={tableEditForm.processing}
                onSubmit={submitTableEdit}
                primaryColor={primary}
                panelMaxClassName="sm:max-w-lg"
            />

            <GenericFormModal
                open={newsAddOpen}
                onClose={() => !newsAddForm.processing && setNewsAddOpen(false)}
                title="ເພີ່ມຂ່າວສານ"
                submitLabel="ບັນທຶກຂ່າວສານ"
                formId="master-add-news"
                schema={newsFormSchema('add')}
                data={newsAddForm.data}
                setData={newsAddForm.setData}
                errors={newsAddForm.errors}
                processing={newsAddForm.processing}
                onSubmit={submitNewsAdd}
                primaryColor={primary}
                panelMaxClassName="sm:max-w-2xl"
                splitLeadImage
            />

            <GenericFormModal
                open={Boolean(newsEditing)}
                onClose={() => !newsEditForm.processing && setNewsEditing(null)}
                title="ແກ້ໄຂຂໍ້ມູນຂ່າວສານ"
                submitLabel="ບັນທຶກຂ່າວສານ"
                formId="master-edit-news"
                schema={newsFormSchema('edit')}
                data={newsEditForm.data}
                setData={newsEditForm.setData}
                errors={newsEditForm.errors}
                processing={newsEditForm.processing}
                onSubmit={submitNewsEdit}
                primaryColor={primary}
                panelMaxClassName="sm:max-w-2xl"
                splitLeadImage
            />

            <GenericFormModal
                open={ingredientAddOpen}
                onClose={() => !ingredientAddForm.processing && setIngredientAddOpen(false)}
                title="ເພີ່ມຂໍ້ມູນວັດຖຸດິບ"
                submitLabel="ບັນທຶກຂໍ້ມູນວັດຖຸດິບ"
                formId="master-add-ingredient"
                schema={ingredientFormSchema}
                data={ingredientAddForm.data}
                setData={ingredientAddForm.setData}
                errors={ingredientAddForm.errors}
                processing={ingredientAddForm.processing}
                onSubmit={submitIngredientAdd}
                primaryColor={primary}
                panelMaxClassName="sm:max-w-lg"
            />

            <GenericFormModal
                open={Boolean(ingredientEditing)}
                onClose={() => !ingredientEditForm.processing && setIngredientEditing(null)}
                title="ແກ້ໄຂຂໍ້ມູນວັດຖຸດິບ"
                submitLabel="ບັນທຶກຂໍ້ມູນວັດຖຸດິບ"
                formId="master-edit-ingredient"
                schema={ingredientFormSchema}
                data={ingredientEditForm.data}
                setData={ingredientEditForm.setData}
                errors={ingredientEditForm.errors}
                processing={ingredientEditForm.processing}
                onSubmit={submitIngredientEdit}
                primaryColor={primary}
                panelMaxClassName="sm:max-w-lg"
            />

            <GenericFormModal
                open={supplierAddOpen}
                onClose={() => !supplierAddForm.processing && setSupplierAddOpen(false)}
                title="ເພີ່ມຂໍ້ມູນຜູ້ສະໜອງ"
                submitLabel="ບັນທຶກຂໍ້ມູນຜູ້ສະໜອງ"
                formId="master-add-supplier"
                schema={supplierFormSchema}
                data={supplierAddForm.data}
                setData={supplierAddForm.setData}
                errors={supplierAddForm.errors}
                processing={supplierAddForm.processing}
                onSubmit={submitSupplierAdd}
                primaryColor={primary}
                panelMaxClassName="sm:max-w-lg"
            />

            <GenericFormModal
                open={Boolean(supplierEditing)}
                onClose={() => !supplierEditForm.processing && setSupplierEditing(null)}
                title="ແກ້ໄຂຂໍ້ມູນຜູ້ສະໜອງ"
                submitLabel="ບັນທຶກຂໍ້ມູນຜູ້ສະໜອງ"
                formId="master-edit-supplier"
                schema={supplierFormSchema}
                data={supplierEditForm.data}
                setData={supplierEditForm.setData}
                errors={supplierEditForm.errors}
                processing={supplierEditForm.processing}
                onSubmit={submitSupplierEdit}
                primaryColor={primary}
                panelMaxClassName="sm:max-w-lg"
            />

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                onClose={() => !deleteBusy && setDeleteTarget(null)}
                title="ຢືນຢັນການລຶບ"
                message={
                    deleteTarget
                        ? `ທ່ານຕ້ອງການລຶບພະນັກງານ “${deleteTarget.name} ${deleteTarget.surname}” (ເບີ ${deleteTarget.phone}) ແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`
                        : ''
                }
                cancelLabel="ຍົກເລີກ"
                confirmLabel="ລຶບຖາວອນ"
                onConfirm={runDelete}
                processing={deleteBusy}
                primaryColor={primary}
            />

            <ConfirmDialog
                open={Boolean(buffetDeleteTarget)}
                onClose={() => !buffetDeleteBusy && setBuffetDeleteTarget(null)}
                title="ຢືນຢັນການລຶບ"
                message={
                    buffetDeleteTarget
                        ? `ທ່ານຕ້ອງການລຶບປະເພດບຸບເຟ່ “${buffetDeleteTarget.tier_name}” ແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`
                        : ''
                }
                cancelLabel="ຍົກເລີກ"
                confirmLabel="ລຶບຖາວອນ"
                onConfirm={runBuffetDelete}
                processing={buffetDeleteBusy}
                primaryColor={primary}
            />

            <ConfirmDialog
                open={Boolean(menuDeleteTarget)}
                onClose={() => !menuDeleteBusy && setMenuDeleteTarget(null)}
                title="ຢືນຢັນການລຶບ"
                message={
                    menuDeleteTarget
                        ? `ທ່ານຕ້ອງການລຶບລາຍການ “${menuDeleteTarget.name}” ແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`
                        : ''
                }
                cancelLabel="ຍົກເລີກ"
                confirmLabel="ລຶບຖາວອນ"
                onConfirm={runMenuDelete}
                processing={menuDeleteBusy}
                primaryColor={primary}
            />

            <ConfirmDialog
                open={Boolean(catgDeleteTarget)}
                onClose={() => !catgDeleteBusy && setCatgDeleteTarget(null)}
                title="ຢືນຢັນການລຶບ"
                message={
                    catgDeleteTarget
                        ? `ທ່ານຕ້ອງການລຶບປະເພດ “${catgDeleteTarget.catg_name}” ແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`
                        : ''
                }
                cancelLabel="ຍົກເລີກ"
                confirmLabel="ລຶບຖາວອນ"
                onConfirm={runCatgDelete}
                processing={catgDeleteBusy}
                primaryColor={primary}
            />

            <ConfirmDialog
                open={Boolean(tableDeleteTarget)}
                onClose={() => !tableDeleteBusy && setTableDeleteTarget(null)}
                title="ຢືນຢັນການລຶບ"
                message={
                    tableDeleteTarget
                        ? `ທ່ານຕ້ອງການລຶບໂຕະ “${tableDeleteTarget.table_no}” ແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`
                        : ''
                }
                cancelLabel="ຍົກເລີກ"
                confirmLabel="ລຶບຖາວອນ"
                onConfirm={runTableDelete}
                processing={tableDeleteBusy}
                primaryColor={primary}
            />

            <ConfirmDialog
                open={Boolean(newsDeleteTarget)}
                onClose={() => !newsDeleteBusy && setNewsDeleteTarget(null)}
                title="ຢືນຢັນການລຶບ"
                message={
                    newsDeleteTarget
                        ? `ທ່ານຕ້ອງການລຶບຂ່າວ “${newsDeleteTarget.title}” ແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`
                        : ''
                }
                cancelLabel="ຍົກເລີກ"
                confirmLabel="ລຶບຖາວອນ"
                onConfirm={runNewsDelete}
                processing={newsDeleteBusy}
                primaryColor={primary}
            />

            <ConfirmDialog
                open={Boolean(ingredientDeleteTarget)}
                onClose={() => !ingredientDeleteBusy && setIngredientDeleteTarget(null)}
                title="ຢືນຢັນການລຶບ"
                message={
                    ingredientDeleteTarget
                        ? `ທ່ານຕ້ອງການລຶບວັດຖຸດິບ “${ingredientDeleteTarget.ing_name}” ແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`
                        : ''
                }
                cancelLabel="ຍົກເລີກ"
                confirmLabel="ລຶບຖາວອນ"
                onConfirm={runIngredientDelete}
                processing={ingredientDeleteBusy}
                primaryColor={primary}
            />

            <ConfirmDialog
                open={Boolean(supplierDeleteTarget)}
                onClose={() => !supplierDeleteBusy && setSupplierDeleteTarget(null)}
                title="ຢືນຢັນການລຶບ"
                message={
                    supplierDeleteTarget
                        ? `ທ່ານຕ້ອງການລຶບຜູ້ສະໜອງ “${supplierDeleteTarget.sup_name}” ແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`
                        : ''
                }
                cancelLabel="ຍົກເລີກ"
                confirmLabel="ລຶບຖາວອນ"
                onConfirm={runSupplierDelete}
                processing={supplierDeleteBusy}
                primaryColor={primary}
            />
        </AdminLayout>
    );
}
