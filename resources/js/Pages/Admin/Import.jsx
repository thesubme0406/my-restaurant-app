import MoneyAmountInput from '@/Components/MoneyAmountInput';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatAmount } from '@/utils/formatAmount';

const primary = '#194c9f';

function statusBadge(status) {
    if (status === 'Received' || status === 'Completed') {
        return <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">ເສັດສິ້ນ</span>;
    }
    return <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">ລໍຖ້າຈັດສົ່ງ</span>;
}

export default function ImportPage({ purchaseOrders = [] }) {
    const page = usePage();
    const pageErrors = page.props.errors ?? {};
    const flashSuccess = page.props.flash?.success;

    const [search, setSearch] = useState('');
    const [selectedPoId, setSelectedPoId] = useState(purchaseOrders[0]?.id ?? null);
    const [lineItems, setLineItems] = useState(purchaseOrders[0]?.items ?? []);
    const [submitting, setSubmitting] = useState(false);

    const filteredOrders = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) {
            return purchaseOrders;
        }
        return purchaseOrders.filter((po) => {
            const sup = String(po.supplier_name ?? '').toLowerCase();
            const no = String(po.po_no ?? '').toLowerCase();
            return sup.includes(q) || no.includes(q);
        });
    }, [purchaseOrders, search]);

    const selectedPo = useMemo(
        () => purchaseOrders.find((po) => po.id === selectedPoId) ?? null,
        [purchaseOrders, selectedPoId]
    );
    const isImported = Boolean(selectedPo?.is_imported);
    const displayItems = isImported ? selectedPo?.imported_items ?? [] : lineItems;
    const totalPrice = useMemo(
        () =>
            displayItems.reduce(
                (sum, item) => sum + Number(item.quantity || 0) * Number(item.cost_price || 0),
                0
            ),
        [displayItems]
    );

    const selectPo = (po) => {
        setSelectedPoId(po.id);
        const sourceItems = po.is_imported ? po.imported_items ?? [] : po.items ?? [];
        setLineItems(sourceItems.map((item) => ({ ...item })));
    };

    const updateItem = (ingId, key, value) => {
        setLineItems((prev) => prev.map((it) => (it.ing_id === ingId ? { ...it, [key]: value } : it)));
    };

    const removeItem = (ingId) => {
        setLineItems((prev) => prev.filter((it) => it.ing_id !== ingId));
    };

    const submitStockIn = () => {
        if (!selectedPo || isImported || lineItems.length === 0 || submitting) {
            return;
        }
        setSubmitting(true);
        router.post(
            route('admin.import.store'),
            {
                po_id: selectedPo.id,
                items: lineItems.map((item) => ({
                    ing_id: item.ing_id,
                    quantity: item.quantity,
                    cost_price: item.cost_price,
                })),
            },
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
            }
        );
    };

    return (
        <AdminLayout title="ນຳເຂົ້າວັດຖຸດິບ">
            <Head title="ນຳເຂົ້າວັດຖຸດິບ" />

            <div className="-mx-4 -mt-2 bg-slate-50 px-4 pb-12 pt-4 md:-mx-8 md:px-8 md:pb-14 md:pt-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    {(flashSuccess || pageErrors?.po_id || pageErrors?.items) && (
                        <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm sm:px-5 ${
                            flashSuccess
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-rose-200 bg-rose-50 text-rose-800'
                        }`}>
                            {flashSuccess || pageErrors.po_id || pageErrors.items}
                        </div>
                    )}

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-200/80 sm:p-5">
                            <h2 className="text-2xl font-bold tracking-tight text-[#0f2744]">ລາຍການສັ່ງຊື້ວັດຖຸດິບ</h2>
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
                                            <th className="px-3 py-2 text-left font-bold">ວັນທີສັ່ງຊື້</th>
                                            <th className="px-3 py-2 text-left font-bold">ຜູ້ສະໜອງ</th>
                                            <th className="px-3 py-2 text-left font-bold">ຈຳນວນວັດຖຸດິບ</th>
                                            <th className="px-3 py-2 text-left font-bold">ສະຖານະ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white">
                                        {filteredOrders.map((po) => (
                                            <tr
                                                key={po.id}
                                                onClick={() => selectPo(po)}
                                                className={`cursor-pointer transition ${selectedPoId === po.id ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="px-3 py-2 font-semibold text-slate-700">{po.po_no}</td>
                                                <td className="px-3 py-2">{po.po_date || '—'}</td>
                                                <td className="max-w-[180px] truncate px-3 py-2">{po.supplier_name}</td>
                                                <td className="px-3 py-2">{po.item_count} ລາຍການ</td>
                                                <td className="px-3 py-2">{statusBadge(po.po_status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <aside className="h-fit rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/80 lg:sticky lg:top-6">
                            <div className="rounded-t-2xl border-b border-slate-200 bg-slate-50 px-5 py-4">
                                <h3 className="text-2xl font-bold tracking-tight text-[#0f2744]">ລາຍລະອຽດການນຳເຂົ້າ</h3>
                                {selectedPo && (
                                    <div className="mt-3 flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-3xl font-extrabold tracking-tight text-[#0f2744]">PO-{selectedPo.po_no}</p>
                                            <p className="mt-1 text-base font-semibold text-slate-700">{selectedPo.supplier_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">ວັນທີສັ່ງຊື້</p>
                                            <p className="text-sm font-bold text-slate-700">{selectedPo.po_date || '—'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4">
                                {displayItems.map((item) => (
                                    <div key={item.ing_id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="min-w-0 truncate text-sm font-semibold text-slate-900">{item.ing_name}</p>
                                            {!isImported ? (
                                                <button type="button" onClick={() => removeItem(item.ing_id)} className="text-slate-400 hover:text-rose-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            ) : null}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(item.ing_id, 'quantity', e.target.value)}
                                                disabled={isImported}
                                                className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                                            />
                                            <span className="text-sm font-semibold text-slate-600">{item.ing_unit}</span>
                                        </div>
                                        <div className="mt-2">
                                            <label className="mb-1 block text-xs font-semibold text-slate-600">ລາຄາຕົ້ນທຶນ</label>
                                            <MoneyAmountInput
                                                value={item.cost_price}
                                                onChange={(v) => updateItem(item.ing_id, 'cost_price', v)}
                                                disabled={isImported}
                                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                                            />
                                        </div>
                                    </div>
                                ))}
                                {selectedPo && displayItems.length === 0 && <p className="text-sm text-slate-500">ບໍ່ມີລາຍການໃຫ້ນຳເຂົ້າ</p>}
                                {!selectedPo && <p className="text-sm text-slate-500">ເລືອກໃບສັ່ງຊື້ຈາກຕາຕະລາງດ້ານຊ້າຍ</p>}
                            </div>

                            <div className="border-t border-slate-200 p-5">
                                <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2">
                                    <span className="text-sm font-bold text-slate-600">ລາຄາລວມ</span>
                                    <span className="text-xl font-extrabold text-[#0f2744]">
                                        {formatAmount(isImported ? selectedPo?.imported_total_price ?? 0 : totalPrice)}
                                    </span>
                                </div>
                                {!isImported ? (
                                    <button
                                        type="button"
                                        onClick={submitStockIn}
                                        disabled={!selectedPo || lineItems.length === 0 || submitting}
                                        className="w-full rounded-xl px-4 py-3 text-base font-bold text-white shadow-md transition disabled:cursor-not-allowed disabled:bg-slate-300"
                                        style={{ backgroundColor: !selectedPo || lineItems.length === 0 || submitting ? undefined : primary }}
                                    >
                                        ນຳເຂົ້າວັດຖຸດິບ
                                    </button>
                                ) : (
                                    <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">
                                        ລາຍການນີ້ນຳເຂົ້າແລ້ວ
                                    </div>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
