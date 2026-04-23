// ສະຕ໋ອກວັດຖຸດິບ + ບັນທຶກການເບີກ
import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from '@headlessui/react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FlashAlert from '@/Components/Admin/Common/FlashAlert';
import { CalendarDays, ChevronDown, Pencil, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatAmount } from '@/utils/formatAmount';

const primary = '#194c9f';

export default function InventoryPage({ ingredients = [], usageRows = [] }) {
    const page = usePage();
    const pageErrors = page.props.errors ?? {};
    const flashSuccess = page.props.flash?.success;
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [ingQuery, setIngQuery] = useState('');
    const [editingRow, setEditingRow] = useState(null);
    const [editQty, setEditQty] = useState('');
    const [editNote, setEditNote] = useState('');
    const [editBusy, setEditBusy] = useState(false);
    const [deleteBusyId, setDeleteBusyId] = useState(null);

    const form = useForm({
        ing_id: ingredients[0]?.id ? String(ingredients[0].id) : '',
        usage_qty: '',
        usage_detail: '',
    });

    const filteredPickList = useMemo(() => {
        const q = ingQuery.trim().toLowerCase();
        if (!q) {
            return ingredients;
        }
        return ingredients.filter((i) => String(i.ing_name ?? '').toLowerCase().includes(q));
    }, [ingredients, ingQuery]);

    const selectedIngredient = useMemo(
        () => ingredients.find((i) => String(i.id) === String(form.data.ing_id)) ?? null,
        [ingredients, form.data.ing_id]
    );
    const enteredQty = Number(form.data.usage_qty || 0);
    const availableQty = Number(selectedIngredient?.ing_quantity ?? 0);
    const overLimit = form.data.usage_qty !== '' && !Number.isNaN(enteredQty) && enteredQty > availableQty;
    const invalidQty = form.data.usage_qty === '' || Number.isNaN(enteredQty) || enteredQty <= 0 || overLimit;
    const editEnteredQty = Number(editQty || 0);
    const editMaxQty = editingRow ? Number(editingRow.ing_quantity || 0) + Number(editingRow.usage_qty || 0) : 0;
    const editOverLimit = Boolean(editingRow) && editQty !== '' && !Number.isNaN(editEnteredQty) && editEnteredQty > editMaxQty;
    const editInvalid = editQty === '' || Number.isNaN(editEnteredQty) || editEnteredQty <= 0 || editOverLimit;

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return usageRows.filter((row) => {
            const byText =
                !q ||
                String(row.ingredient_name ?? '').toLowerCase().includes(q) ||
                String(row.staff_name ?? '').toLowerCase().includes(q) ||
                String(row.usage_detail ?? '').toLowerCase().includes(q);
            const byDate = !dateFilter || row.usage_date_iso === dateFilter;
            return byText && byDate;
        });
    }, [usageRows, search, dateFilter]);

    const submitUsage = (e) => {
        e.preventDefault();
        form.post(route('admin.inventory.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('usage_qty', 'usage_detail');
            },
        });
    };

    const openEdit = (row) => {
        setEditingRow(row);
        setEditQty(String(row.usage_qty ?? ''));
        setEditNote(row.usage_detail ?? '');
    };

    const submitEdit = (e) => {
        e.preventDefault();
        if (!editingRow || editInvalid || editBusy) {
            return;
        }
        setEditBusy(true);
        router.patch(
            route('admin.inventory.update', editingRow.id),
            {
                usage_qty: editQty,
                usage_detail: editNote,
            },
            {
                preserveScroll: true,
                onFinish: () => setEditBusy(false),
                onSuccess: () => setEditingRow(null),
            }
        );
    };

    const runDelete = (row) => {
        if (deleteBusyId != null) {
            return;
        }
        const ok = window.confirm(`ຢືນຢັນລຶບປະຫວັດການເບີກຂອງ “${row.ingredient_name}” ?`);
        if (!ok) {
            return;
        }
        setDeleteBusyId(row.id);
        router.delete(route('admin.inventory.destroy', row.id), {
            preserveScroll: true,
            onFinish: () => setDeleteBusyId(null),
        });
    };

    const comboDisplay = (id) => {
        if (id == null || id === '') {
            return '';
        }
        const i = ingredients.find((x) => String(x.id) === String(id));
        return i?.ing_name ?? '';
    };

    const usageQtyPlaceholder = selectedIngredient
        ? `ຄົງເຫຼືອ: ${formatAmount(selectedIngredient.ing_quantity)} ${selectedIngredient.ing_unit}`
        : '';

    return (
        <AdminLayout title="ເບີກວັດຖຸດິບ">
            <Head title="ເບີກວັດຖຸດິບ" />

            <div className="-mx-4 -mt-2 bg-slate-50 px-4 pb-12 pt-4 md:-mx-8 md:px-8 md:pb-14 md:pt-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    <FlashAlert successMessage={flashSuccess} errorMessage={pageErrors.ing_id || pageErrors.usage_qty} />

                    <section className="rounded-2xl border border-slate-100 bg-white p-5 font-sans shadow-md shadow-slate-200/80">
                        <h2 className="text-2xl font-bold tracking-tight text-[#0f2744]">ຟອມເບີກວັດຖຸດິບ</h2>
                        <form onSubmit={submitUsage} className="mt-4">
                            {ingredients.length === 0 ? (
                                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                    ຍັງບໍ່ມີວັດຖຸດິບໃນລະບົບ
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(9.5rem,12rem)_minmax(0,1.45fr)_auto] lg:items-end lg:gap-x-3 lg:gap-y-0">
                                    {/* ເລືອກວັດຖຸດິບ — label ກັບ input ຫ່າງໜ້ອຍ */}
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <label
                                            htmlFor="usage-ingredient"
                                            className="block text-xs font-bold leading-tight text-slate-600"
                                        >
                                            ເລືອກວັດຖຸດິບ
                                        </label>
                                        <Combobox
                                            value={form.data.ing_id === '' ? null : form.data.ing_id}
                                            onChange={(id) => {
                                                form.setData('ing_id', id == null ? '' : String(id));
                                                setIngQuery('');
                                            }}
                                            onClose={() => setIngQuery('')}
                                        >
                                            <div className="relative">
                                                <ComboboxInput
                                                    id="usage-ingredient"
                                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm leading-none text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                                    displayValue={comboDisplay}
                                                    onChange={(e) => setIngQuery(e.target.value)}
                                                    placeholder="ພິມຄົ້ນຫາ ຫຼື ເລືອກວັດຖຸດິບ..."
                                                />
                                                <ComboboxButton
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500"
                                                >
                                                    <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
                                                </ComboboxButton>
                                                <ComboboxOptions className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 font-sans shadow-lg empty:invisible">
                                                    {filteredPickList.length === 0 ? (
                                                        <div className="px-3 py-2 text-sm text-slate-500">ບໍ່ພົບວັດຖຸດິບ</div>
                                                    ) : (
                                                        filteredPickList.map((i) => (
                                                            <ComboboxOption
                                                                key={i.id}
                                                                value={String(i.id)}
                                                                className="cursor-pointer px-3 py-2 text-sm text-slate-800 data-[focus]:bg-[#194c9f]/10"
                                                            >
                                                                {i.ing_name}
                                                            </ComboboxOption>
                                                        ))
                                                    )}
                                                </ComboboxOptions>
                                            </div>
                                        </Combobox>
                                    </div>

                                    {/* ຈຳນວນ — placeholder ຄົງເຫຼືອໃຊ້ຕົວໜ້ອຍເພື່ອເຫັນຊື່ຍາວ */}
                                    <div className="flex w-full min-w-0 flex-col gap-1">
                                        <label
                                            htmlFor="usage-qty"
                                            className="block text-xs font-bold leading-tight text-slate-600"
                                        >
                                            ຈຳນວນ
                                        </label>
                                        <input
                                            id="usage-qty"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={form.data.usage_qty}
                                            onChange={(e) => form.setData('usage_qty', e.target.value)}
                                            placeholder={usageQtyPlaceholder}
                                            aria-label={
                                                selectedIngredient
                                                    ? `${usageQtyPlaceholder} — ປ້ອນຈຳນວນເບີກ`
                                                    : 'ປ້ອນຈຳນວນເບີກ'
                                            }
                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-[10px] placeholder:leading-snug placeholder:text-slate-400/60 focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                        />
                                        {overLimit && selectedIngredient ? (
                                            <p className="mt-1 text-xs font-semibold leading-tight text-rose-600">
                                                ຂໍໂທດ, ວັດຖຸດິບໃນສາງມີບໍ່ພຽງພໍ (ຄົງເຫຼືອ:{' '}
                                                {formatAmount(selectedIngredient.ing_quantity)}
                                                {selectedIngredient.ing_unit})
                                            </p>
                                        ) : null}
                                    </div>

                                    {/* ໝາຍເຫດ — ຄອລຸມ fr ກວ້າງກວ່າຈຳນວນ (rem) */}
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <label
                                            htmlFor="usage-note"
                                            className="block text-xs font-bold leading-tight text-slate-600"
                                        >
                                            ໝາຍເຫດ
                                        </label>
                                        <input
                                            id="usage-note"
                                            type="text"
                                            value={form.data.usage_detail}
                                            onChange={(e) => form.setData('usage_detail', e.target.value)}
                                            placeholder="ຂໍ້ມູນເພີ່ມເຕີມ..."
                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                        />
                                    </div>

                                    {/* ປຸ່ມ — ຈັດແຖວກັບ input (ມີຊ່ອງ label ເທົ່າກັນ) */}
                                    <div className="flex flex-col gap-1 lg:w-auto lg:shrink-0">
                                        <span
                                            className="hidden text-xs font-bold leading-tight text-transparent lg:block"
                                            aria-hidden
                                        >
                                            .
                                        </span>
                                        <button
                                            type="submit"
                                            disabled={form.processing || invalidQty || !form.data.ing_id}
                                            className="h-10 w-full min-w-[10.5rem] whitespace-nowrap rounded-xl px-4 text-sm font-bold text-white shadow-md transition disabled:cursor-not-allowed disabled:bg-slate-300 lg:w-auto"
                                            style={{ backgroundColor: form.processing ? undefined : primary }}
                                        >
                                            + ເບີກວັດຖຸດິບ
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </section>

                    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/80">
                        <h2 className="text-2xl font-bold tracking-tight text-[#0f2744]">ປະຫວັດການເບີກວັດຖຸດິບ</h2>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <div className="relative w-full max-w-sm">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="ຄົ້ນຫາ..."
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                />
                            </div>
                            <div className="relative">
                                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                />
                            </div>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-100 text-slate-700">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-bold">#</th>
                                        <th className="px-3 py-2 text-left font-bold">ວັນເວລາເບີກ</th>
                                        <th className="px-3 py-2 text-left font-bold">ວັດຖຸດິບ</th>
                                        <th className="px-3 py-2 text-left font-bold">ປະລິມານ</th>
                                        <th className="px-3 py-2 text-left font-bold">ຜູ້ເບີກ</th>
                                        <th className="px-3 py-2 text-left font-bold">ໝາຍເຫດ</th>
                                        <th className="px-3 py-2 text-left font-bold">ຈັດການ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {filteredRows.map((row, idx) => (
                                        <tr key={row.id}>
                                            <td className="px-3 py-2">{idx + 1}</td>
                                            <td className="px-3 py-2">{row.usage_date}</td>
                                            <td className="px-3 py-2 font-semibold" style={{ color: primary }}>
                                                {row.ingredient_name}
                                            </td>
                                            <td className="px-3 py-2">
                                                {formatAmount(row.usage_qty)} {row.ing_unit}
                                            </td>
                                            <td className="px-3 py-2 font-semibold" style={{ color: primary }}>
                                                {row.staff_name}
                                            </td>
                                            <td className="px-3 py-2">{row.usage_detail || '—'}</td>
                                            <td className="px-3 py-2">
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-700"
                                                        onClick={() => openEdit(row)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center rounded-lg border border-rose-300 bg-white px-2 py-1 text-rose-600"
                                                        onClick={() => runDelete(row)}
                                                        disabled={deleteBusyId === row.id}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredRows.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                                                ບໍ່ພົບຂໍ້ມູນປະຫວັດ
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
            {editingRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                        <h3 className="text-lg font-bold text-[#0f2744]">ແກ້ໄຂປະຫວັດການເບີກ</h3>
                        <p className="mt-1 text-sm text-slate-600">{editingRow.ingredient_name}</p>
                        <form onSubmit={submitEdit} className="mt-4 space-y-3">
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-600">ຈຳນວນ</label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={editQty}
                                    onChange={(e) => setEditQty(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                />
                                {editOverLimit && (
                                    <p className="mt-1 text-xs font-semibold text-rose-600">
                                        ຂໍໂທດ, ວັດຖຸດິບໃນສາງມີບໍ່ພຽງພໍ (ຄົງເຫຼືອ: {formatAmount(editMaxQty)}
                                        {editingRow.ing_unit})
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-600">ໝາຍເຫດ</label>
                                <input
                                    type="text"
                                    value={editNote}
                                    onChange={(e) => setEditNote(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingRow(null)}
                                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                                >
                                    ຍົກເລີກ
                                </button>
                                <button
                                    type="submit"
                                    disabled={editInvalid || editBusy}
                                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                                    style={{ backgroundColor: editInvalid || editBusy ? undefined : primary }}
                                >
                                    ບັນທຶກ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
