import MoneyAmountInput from '@/Components/MoneyAmountInput';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FlashAlert from '@/Components/Admin/Common/FlashAlert';
import StatusBadge from '@/Components/Admin/Common/StatusBadge';
import TablePagination from '@/Components/Admin/Common/TablePagination';
import { PAGE_SIZE, paginateSlice } from '@/Components/Reports/reportTableUtils';
import { Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatAmount } from '@/utils/formatAmount';
import { importRouteNames } from '@/utils/routeNamesFromUrl';

const primary = '#194c9f';

function sortImportPurchaseOrders(list) {
    return [...list].sort((a, b) => {
        if (Boolean(a.is_imported) !== Boolean(b.is_imported)) {
            return a.is_imported ? 1 : -1;
        }
        if (a.is_imported) {
            return String(a.imported_at ?? '').localeCompare(String(b.imported_at ?? ''));
        }
        return Number(b.id) - Number(a.id);
    });
}

function firstPendingPo(orders) {
    return orders.find((po) => !po.is_imported) ?? orders[0] ?? null;
}

export default function ImportPage({ purchaseOrders = [] }) {
    const page = usePage();
    const pageErrors = page.props.errors ?? {};
    const flashSuccess = page.props.flash?.success;
    const routes = useMemo(() => importRouteNames(page.url ?? ''), [page.url]);
    const [localSuccess, setLocalSuccess] = useState('');

    const [search, setSearch] = useState('');
    const [selectedPoId, setSelectedPoId] = useState(() => firstPendingPo(purchaseOrders)?.id ?? null);
    const [lineItems, setLineItems] = useState(() => firstPendingPo(purchaseOrders)?.items ?? []);
    const [submitting, setSubmitting] = useState(false);
    const [poListPage, setPoListPage] = useState(1);

    const sortedOrders = useMemo(() => sortImportPurchaseOrders(purchaseOrders), [purchaseOrders]);

    const filteredOrders = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) {
            return sortedOrders;
        }
        return sortImportPurchaseOrders(
            sortedOrders.filter((po) => {
            const sup = String(po.supplier_name ?? '').toLowerCase();
            const no = String(po.po_no ?? '').toLowerCase();
            return sup.includes(q) || no.includes(q);
            })
        );
    }, [sortedOrders, search]);

    const { pageRows: pagedOrders } = useMemo(
        () => paginateSlice(filteredOrders, poListPage, PAGE_SIZE),
        [filteredOrders, poListPage]
    );

    useEffect(() => {
        setPoListPage(1);
    }, [purchaseOrders, search]);

    const selectedPo = useMemo(
        () => sortedOrders.find((po) => po.id === selectedPoId) ?? null,
        [sortedOrders, selectedPoId]
    );
    const isImported = Boolean(selectedPo?.is_imported);
    const displayItems = isImported ? selectedPo?.imported_items ?? [] : lineItems;
    const totalPrice = useMemo(
        () =>
            lineItems.reduce(
                (sum, item) => sum + Number(item.quantity || 0) * Number(item.cost_price || 0),
                0
            ),
        [lineItems]
    );

    const canSubmitImport = Boolean(selectedPo) && !isImported && lineItems.length > 0 && !submitting;

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
        if (!canSubmitImport) {
            return;
        }
        setLocalSuccess('');
        setSubmitting(true);
        router.post(
            route(routes.importStore),
            {
                po_id: selectedPo.id,
                items: lineItems.map((item) => ({
                    ing_id: item.ing_id,
                    quantity: Number(item.quantity || 0),
                    cost_price: item.cost_price,
                })),
            },
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
                onSuccess: (visit) => {
                    setLocalSuccess('ບັນທຶກຂໍ້ມູນສຳເລັດແລ້ວ');
                    const nextPending = firstPendingPo(sortImportPurchaseOrders(visit.props.purchaseOrders ?? []));
                    if (nextPending) {
                        setSelectedPoId(nextPending.id);
                        setLineItems(nextPending.items.map((item) => ({ ...item })));
                    }
                },
            }
        );
    };

    return (
        <AdminLayout title="ນຳເຂົ້າວັດຖຸດິບ">
            <Head title="ນຳເຂົ້າວັດຖຸດິບ" />

            <div className="-mx-4 -mt-2 bg-slate-50 px-4 pb-12 pt-4 md:-mx-8 md:px-8 md:pb-14 md:pt-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    <FlashAlert
                        successMessage={localSuccess || flashSuccess}
                        errorMessage={pageErrors.po_id || pageErrors.items}
                    />

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
                                        {pagedOrders.map((po) => (
                                            <tr
                                                key={po.id}
                                                onClick={() => selectPo(po)}
                                                className={`cursor-pointer transition ${selectedPoId === po.id ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="px-3 py-2 font-semibold text-slate-700">{po.po_no}</td>
                                                <td className="px-3 py-2">{po.po_date || '—'}</td>
                                                <td className="max-w-[180px] truncate px-3 py-2">{po.supplier_name}</td>
                                                <td className="px-3 py-2">{po.item_count} ລາຍການ</td>
                                                <td className="px-3 py-2">
                                                    {po.po_status === 'Received' || po.po_status === 'Completed' ? (
                                                        <StatusBadge label="ເສັດສິ້ນ" tone="success" />
                                                    ) : (
                                                        <StatusBadge label="ລໍຖ້າຈັດສົ່ງ" tone="warning" />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="border-t border-slate-100 px-3 pb-3">
                                    <TablePagination
                                        page={poListPage}
                                        onPageChange={setPoListPage}
                                        totalItems={filteredOrders.length}
                                        pageSize={PAGE_SIZE}
                                    />
                                </div>
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
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.ing_id)}
                                                    disabled={submitting}
                                                    className="rounded-md p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            ) : null}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
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
                                        disabled={!canSubmitImport}
                                        className="w-full rounded-xl px-4 py-3 text-base font-bold text-white shadow-md transition hover:bg-[#153d82] disabled:cursor-not-allowed disabled:bg-slate-300"
                                        style={{ backgroundColor: canSubmitImport ? primary : undefined }}
                                    >
                                        {submitting ? 'ກຳລັງບັນທຶກ...' : 'ນຳເຂົ້າວັດຖຸດິບ'}
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
