// ສັ່ງຊື້ວັດຖຸດິບ — ກະຕ່າ + ບັນທຶກສັ່ງຊື້
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FlashAlert from '@/Components/Admin/Common/FlashAlert';
import { Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatAmount } from '@/utils/formatAmount';

const primary = '#194c9f';

function formatQty(value) {
    const n = Number(value);
    if (Number.isNaN(n)) {
        return '—';
    }
    return formatAmount(n);
}

export default function PurchasePage({ ingredients = [], suppliers = [] }) {
    const page = usePage();
    const [search, setSearch] = useState('');
    const [supplierId, setSupplierId] = useState(suppliers[0]?.id ? String(suppliers[0].id) : '');
    const [cart, setCart] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const flashSuccess = page.props.flash?.success;
    const pageErrors = page.props.errors ?? {};

    const filteredIngredients = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) {
            return ingredients;
        }
        return ingredients.filter((i) => String(i.ing_name ?? '').toLowerCase().includes(q));
    }, [ingredients, search]);

    const inCart = useMemo(() => new Set(cart.map((c) => c.ing_id)), [cart]);

    const addToCart = (row) => {
        if (inCart.has(row.id)) {
            return;
        }
        setCart((prev) => [
            ...prev,
            {
                ing_id: row.id,
                ing_name: row.ing_name,
                ing_unit: row.ing_unit,
                quantity: '1',
            },
        ]);
    };

    const updateCartQty = (ingId, qty) => {
        setCart((prev) => prev.map((item) => (item.ing_id === ingId ? { ...item, quantity: qty } : item)));
    };

    const removeCartItem = (ingId) => {
        setCart((prev) => prev.filter((item) => item.ing_id !== ingId));
    };

    const submitPurchase = () => {
        if (!supplierId || cart.length === 0 || submitting) {
            return;
        }
        setSubmitting(true);
        router.post(
            route('admin.purchase.store'),
            {
                sup_id: Number(supplierId),
                items: cart.map((item) => ({
                    ing_id: item.ing_id,
                    quantity: item.quantity,
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => setCart([]),
                onFinish: () => setSubmitting(false),
            }
        );
    };

    return (
        <AdminLayout title="ສັ່ງຊື້ວັດຖຸດິບ">
            <Head title="ສັ່ງຊື້ວັດຖຸດິບ" />

            <div className="-mx-4 -mt-2 bg-slate-50 px-4 pb-12 pt-4 md:-mx-8 md:px-8 md:pb-14 md:pt-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    <FlashAlert successMessage={flashSuccess} errorMessage={pageErrors.sup_id || pageErrors.items} />

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-200/80 sm:p-5">
                            <h2 className="text-2xl font-bold tracking-tight text-[#0f2744]">ລາຍການວັດຖຸດິບ</h2>
                            <div className="relative mt-4 max-w-sm">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search"
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                />
                            </div>

                            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-100 text-slate-700">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-bold">#</th>
                                            <th className="px-3 py-2 text-left font-bold">ວັດຖຸດິບ</th>
                                            <th className="px-3 py-2 text-left font-bold">ຈຳນວນປັດຈຸບັນ</th>
                                            <th className="px-3 py-2 text-left font-bold">ຈຳນວນຕ່ຳສຸດ</th>
                                            <th className="px-3 py-2 text-left font-bold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white">
                                        {filteredIngredients.map((row, idx) => {
                                            const low = Number(row.ing_quantity) < Number(row.ing_min);
                                            const added = inCart.has(row.id);
                                            return (
                                                <tr key={row.id}>
                                                    <td className="px-3 py-2">{idx + 1}</td>
                                                    <td className="px-3 py-2 font-semibold text-slate-900">{row.ing_name}</td>
                                                    <td className={`px-3 py-2 font-semibold ${low ? 'text-rose-600' : 'text-slate-800'}`}>
                                                        {formatQty(row.ing_quantity)} {row.ing_unit}
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-700">
                                                        {formatQty(row.ing_min)} {row.ing_unit}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => addToCart(row)}
                                                            disabled={added}
                                                            className={`inline-flex w-24 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm ${
                                                                added
                                                                    ? 'cursor-not-allowed border border-slate-300 bg-slate-100 text-slate-400'
                                                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                            }`}
                                                        >
                                                            {added ? 'ເພີ່ມແລ້ວ' : '+ ເພີ່ມ'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <aside className="h-fit rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/80 lg:sticky lg:top-6">
                            <div className="border-b border-slate-200 px-5 py-4">
                                <h3 className="text-2xl font-bold tracking-tight text-[#0f2744]">ລາຍການສັ່ງຊື້</h3>
                            </div>
                            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
                                <label className="block text-sm font-semibold text-slate-700">ເລືອກຜູ້ສະໜອງ</label>
                                <select
                                    value={supplierId}
                                    onChange={(e) => setSupplierId(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                >
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.sup_name}
                                        </option>
                                    ))}
                                </select>

                                <div className="space-y-2">
                                    {cart.map((item) => (
                                        <div key={item.ing_id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="min-w-0 truncate text-sm font-semibold text-slate-900">{item.ing_name}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => removeCartItem(item.ing_id)}
                                                    className="text-slate-400 hover:text-rose-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={item.quantity}
                                                    onChange={(e) => updateCartQty(item.ing_id, e.target.value)}
                                                    className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                                />
                                                <span className="text-sm font-semibold text-slate-600">{item.ing_unit}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {cart.length === 0 && <p className="text-sm text-slate-500">ຍັງບໍ່ມີລາຍການໃນກະຕ່າ</p>}
                                </div>
                            </div>
                            <div className="border-t border-slate-200 p-5">
                                <button
                                    type="button"
                                    onClick={submitPurchase}
                                    disabled={!supplierId || cart.length === 0 || submitting}
                                    className="w-full rounded-xl px-4 py-3 text-base font-bold text-white shadow-md transition disabled:cursor-not-allowed disabled:bg-slate-300"
                                    style={{ backgroundColor: !supplierId || cart.length === 0 || submitting ? undefined : primary }}
                                >
                                    ພຣີວິວ ແລະ ພິມ
                                </button>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
