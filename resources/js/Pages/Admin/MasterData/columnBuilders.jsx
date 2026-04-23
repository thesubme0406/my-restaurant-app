// ຖັນຕາຕະລາງ Master Data — ໂຕປະກອບສົ່ງ onEdit / onDelete ເຂົ້າມາ
import { TablePackageNameCell } from '@/Components/MasterData/GenericDataTable';
import { Pencil, Trash2 } from 'lucide-react';
import {
    formatBuffetPrice,
    formatJoined,
    ingredientStatusBadge,
    newsStatusBadge,
    roleLabel,
    staffInitials,
    tableReadinessBadge,
    tableUsageMasterBadge,
    zoneLabel,
} from './helpers';

export function buildStaffColumns({ primaryColor, currentStaffId, onEdit, onDelete }) {
    return [
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
                        style={{ backgroundColor: primaryColor }}
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
                        onClick={() => onEdit(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        ແກ້ໄຂ
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(row)}
                        disabled={row.id === currentStaffId}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        ລຶບ
                    </button>
                </div>
            ),
        },
    ];
}

export function buildBuffetColumns({ onEdit, onDelete }) {
    return [
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
                        onClick={() => onEdit(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        ແກ້ໄຂ
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        ລຶບ
                    </button>
                </div>
            ),
        },
    ];
}

export function buildFoodMenuColumns({ onEdit, onDelete }) {
    return [
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
                        onClick={() => onEdit(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        ແກ້ໄຂ
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        ລຶບ
                    </button>
                </div>
            ),
        },
    ];
}

export function buildFoodCategoryColumns({ onEdit, onDelete }) {
    return [
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
                        onClick={() => onEdit(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        ແກ້ໄຂ
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        ລຶບ
                    </button>
                </div>
            ),
        },
    ];
}

export function buildTableColumns({ onEdit, onDelete }) {
    return [
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
            key: 'readiness',
            header: 'ຄວາມພ້ອມໃຊ້ງານ',
            cell: ({ row }) => tableReadinessBadge(row.readiness ?? 'ready'),
        },
        {
            key: 'usage_status',
            header: 'ສະຖານະນັ່ງຄິວ',
            cell: ({ row }) => tableUsageMasterBadge(row.usage_status ?? 'available'),
        },
        {
            key: 'actions',
            header: 'Action',
            className: 'w-40',
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        ແກ້ໄຂ
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        ລຶບ
                    </button>
                </div>
            ),
        },
    ];
}

export function buildNewsColumns({ onEdit, onDelete }) {
    return [
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
                        onClick={() => onEdit(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        ແກ້ໄຂ
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        ລຶບ
                    </button>
                </div>
            ),
        },
    ];
}

export function buildIngredientColumns({ onEdit, onDelete }) {
    return [
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
                        onClick={() => onEdit(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        ແກ້ໄຂ
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        ລຶບ
                    </button>
                </div>
            ),
        },
    ];
}

export function buildSupplierColumns({ onEdit, onDelete }) {
    return [
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
                        onClick={() => onEdit(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        ແກ້ໄຂ
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        ລຶບ
                    </button>
                </div>
            ),
        },
    ];
}

// ພາກທີ່ຍັງບໍ່ມີ API — ຕາຕະລາງຫວ່າງ
export function buildPlaceholderColumns() {
    return [
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
    ];
}
