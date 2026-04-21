import { Head, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { CalendarDays, Pencil, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

const primary = '#194c9f';

function numberText(value) {
    const n = Number(value);
    if (Number.isNaN(n)) {
        return '0';
    }
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export default function InventoryPage({ ingredients = [], usageRows = [] }) {
    const page = usePage();
    const pageErrors = page.props.errors ?? {};
    const flashSuccess = page.props.flash?.success;
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('');
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

    const ingredientOptions = ingredients.map((i) => ({
        value: String(i.id),
        label: `${i.ing_name} (${i.ing_unit})`,
    }));
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

    return (
        <AdminLayout title="ເບີກວັດຖຸດິບ">
            <Head title="ເບີກວັດຖຸດິບ" />

            <div className="-mx-4 -mt-2 bg-slate-50 px-4 pb-12 pt-4 md:-mx-8 md:px-8 md:pb-14 md:pt-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    {(flashSuccess || pageErrors?.ing_id || pageErrors?.usage_qty) && (
                        <div
                            className={`rounded-2xl border px-4 py-3 text-sm shadow-sm sm:px-5 ${
                                flashSuccess
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : 'border-rose-200 bg-rose-50 text-rose-800'
                            }`}
                        >
                            {flashSuccess || pageErrors.ing_id || pageErrors.usage_qty}
                        </div>
                    )}

                    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/80">
                        <h2 className="text-2xl font-bold tracking-tight text-[#0f2744]">ຟອມເບີກວັດຖຸດິບ</h2>
                        <form onSubmit={submitUsage} className="mt-4 grid gap-3 md:grid-cols-[1.1fr_0.6fr_1fr_auto]">
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-600">ເລືອກວັດຖຸດິບ</label>
                                <select
                                    value={form.data.ing_id}
                                    onChange={(e) => form.setData('ing_id', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                >
                                    {ingredientOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-600">ຈຳນວນ</label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={form.data.usage_qty}
                                    onChange={(e) => form.setData('usage_qty', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                />
                                {overLimit && selectedIngredient && (
                                    <p className="mt-1 text-xs font-semibold text-rose-600">
                                        ຂໍໂທດ, ວັດຖຸດິບໃນສາງມີບໍ່ພຽງພໍ (ຄົງເຫຼືອ: {numberText(selectedIngredient.ing_quantity)}
                                        {selectedIngredient.ing_unit})
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-600">ໝາຍເຫດ</label>
                                <input
                                    type="text"
                                    value={form.data.usage_detail}
                                    onChange={(e) => form.setData('usage_detail', e.target.value)}
                                    placeholder="ຂໍ້ມູນເພີ່ມເຕີມ..."
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                />
                            </div>
                            <div className="self-end">
                                <button
                                    type="submit"
                                    disabled={form.processing || invalidQty || !form.data.ing_id}
                                    className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition disabled:cursor-not-allowed disabled:bg-slate-300"
                                    style={{ backgroundColor: form.processing ? undefined : primary }}
                                >
                                    + ເບີກວັດຖຸດິບ
                                </button>
                            </div>
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
                                    placeholder="Search"
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
                                        <th className="px-3 py-2 text-left font-bold">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {filteredRows.map((row, idx) => (
                                        <tr key={row.id}>
                                            <td className="px-3 py-2">{idx + 1}</td>
                                            <td className="px-3 py-2">{row.usage_date}</td>
                                            <td className="px-3 py-2 font-semibold text-[#1e4da1]">{row.ingredient_name}</td>
                                            <td className="px-3 py-2">
                                                {numberText(row.usage_qty)} {row.ing_unit}
                                            </td>
                                            <td className="px-3 py-2 font-semibold text-[#1e4da1]">{row.staff_name}</td>
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
                                        ຂໍໂທດ, ວັດຖຸດິບໃນສາງມີບໍ່ພຽງພໍ (ຄົງເຫຼືອ: {numberText(editMaxQty)}
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
