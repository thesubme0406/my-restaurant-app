import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Landmark, Plus, Printer, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

const primary = '#194c9f';

const methodOptions = [
    { value: '', label: 'ທຸກວິທີ' },
    { value: 'cash', label: 'ເງິນສົດ' },
    { value: 'transfer', label: 'ເງິນໂອນ' },
];

const payMethods = methodOptions.filter((x) => x.value);

function fmtMoney(v) {
    const n = Number(v);
    if (Number.isNaN(n)) {
        return '0';
    }
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function methodBadge(method) {
    if (method === 'cash') {
        return <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">ເງິນສົດ</span>;
    }
    return <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">ເງິນໂອນ</span>;
}

export default function PaymentsPage({ payments = [], summary = {}, filters = {} }) {
    const page = usePage();
    const pageErrors = page.props.errors ?? {};
    const flashSuccess = page.props.flash?.success;
    const [showModal, setShowModal] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [serviceSearch, setServiceSearch] = useState('');
    const [activeServices, setActiveServices] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [method, setMethod] = useState('cash');
    const [receivedAmount, setReceivedAmount] = useState('');
    const [querySearch, setQuerySearch] = useState(filters.search ?? '');
    const [queryMethod, setQueryMethod] = useState(filters.method ?? '');
    const [queryFrom, setQueryFrom] = useState(filters.from ?? '');
    const [queryTo, setQueryTo] = useState(filters.to ?? '');

    const selectedService = useMemo(
        () => activeServices.find((item) => String(item.service_id) === String(selectedServiceId)) ?? null,
        [activeServices, selectedServiceId]
    );

    const totalAmount = Number(selectedService?.total_amount ?? 0);
    const received = Number(receivedAmount || 0);
    const change = method === 'cash' ? Math.max(received - totalAmount, 0) : 0;
    const insufficientCash = method === 'cash' && receivedAmount !== '' && received < totalAmount;

    const applyFilters = () => {
        router.get(
            route('admin.payments'),
            { search: querySearch, method: queryMethod, from: queryFrom, to: queryTo },
            { preserveScroll: true, replace: true }
        );
    };

    const openModal = () => {
        setShowModal(true);
        setServiceSearch('');
        setActiveServices([]);
        setSelectedServiceId('');
        setMethod('cash');
        setReceivedAmount('');
        loadActiveServices('');
    };

    const loadActiveServices = async (q) => {
        setLookupLoading(true);
        try {
            const resp = await fetch(`${route('admin.payments.active-services')}?q=${encodeURIComponent(q)}`, {
                headers: { Accept: 'application/json' },
            });
            const data = await resp.json();
            const rows = Array.isArray(data.services) ? data.services : [];
            setActiveServices(rows);
            if (rows.length === 0) {
                setSelectedServiceId('');
            } else if (!rows.some((item) => String(item.service_id) === String(selectedServiceId))) {
                setSelectedServiceId(String(rows[0].service_id));
            }
        } finally {
            setLookupLoading(false);
        }
    };

    const submitPayment = () => {
        if (!selectedService || submitting || insufficientCash) {
            return;
        }
        setSubmitting(true);
        router.post(
            route('admin.payments.store'),
            {
                service_id: selectedService.service_id,
                total_amount: totalAmount,
                method,
                received_amount: method === 'cash' ? receivedAmount : null,
            },
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
                                onSuccess: () => setShowModal(false),
            }
        );
    };

    const deletePayment = (row) => {
        const ok = window.confirm(`ຢືນຢັນລຶບການຊຳລະ #${row.id} ?`);
        if (!ok) {
            return;
        }
        router.delete(route('admin.payments.destroy', row.id), { preserveScroll: true });
    };

    const printReceipt = (row) => {
        const receiptHtml = `
            <html>
                <head><title>Receipt #${row.id}</title></head>
                <body style="font-family: Arial, sans-serif; padding: 24px;">
                    <h2>Payment Receipt</h2>
                    <hr />
                    <p><strong>Payment ID:</strong> ${row.id}</p>
                    <p><strong>Service ID:</strong> ${row.service_id}</p>
                    <p><strong>Staff ID:</strong> ${row.staff_id}</p>
                    <p><strong>Customer:</strong> ${row.customer_name ?? '-'}</p>
                    <p><strong>Table:</strong> ${row.table_no ?? '-'}</p>
                    <p><strong>Guests:</strong> ${row.guest_count ?? 0}</p>
                    <p><strong>Buffet Tier:</strong> ${row.buffet_tier ?? '-'}</p>
                    <p><strong>Tier Price:</strong> ${fmtMoney(row.tier_price)} K</p>
                    <p><strong>Total:</strong> ${fmtMoney(row.total_amount)} K</p>
                    <p><strong>Method:</strong> ${row.method}</p>
                    <p><strong>Payment Time:</strong> ${row.payment_time}</p>
                </body>
            </html>
        `;
        const win = window.open('', '_blank', 'width=600,height=800');
        if (!win) return;
        win.document.write(receiptHtml);
        win.document.close();
        win.focus();
        win.print();
    };

    return (
        <AdminLayout title="ຊຳລະເງິນ">
            <Head title="ຊຳລະເງິນ" />
            <div className="-mx-4 -mt-2 bg-slate-50 px-4 pb-12 pt-4 md:-mx-8 md:px-8 md:pb-14 md:pt-6">
                <div className="mx-auto max-w-7xl space-y-5">
                    {(flashSuccess || pageErrors?.service_id || pageErrors?.received_amount) && (
                        <div
                            className={`rounded-2xl border px-4 py-3 text-sm shadow-sm sm:px-5 ${
                                flashSuccess
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : 'border-rose-200 bg-rose-50 text-rose-800'
                            }`}
                        >
                            {flashSuccess || pageErrors.service_id || pageErrors.received_amount}
                        </div>
                    )}

                    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/80">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-[#0f2744]">ຈ່າຍເງິນ</h2>
                                <p className="text-sm text-slate-500">ລາຍການຊຳລະເງິນມື້ນີ້</p>
                            </div>
                            <button
                                type="button"
                                onClick={openModal}
                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md"
                                style={{ backgroundColor: primary }}
                            >
                                <Plus className="h-4 w-4" />
                                ບັນທຶກການຊຳລະເງິນ
                            </button>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-bold text-slate-500">ລາຍການຊຳລະເງິນທັງໝົດ</p>
                                <p className="mt-1 text-2xl font-extrabold text-slate-900">{summary.count ?? 0}</p>
                                <p className="text-sm font-semibold text-slate-700">{fmtMoney(summary.total)} K</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="mb-1 inline-flex rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
                                    <Landmark className="h-4 w-4" />
                                </div>
                                <p className="text-xs font-bold text-slate-500">ເງິນສົດ</p>
                                <p className="text-lg font-bold text-slate-900">{fmtMoney(summary.cash)} K</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="mb-1 inline-flex rounded-lg bg-sky-100 p-1.5 text-sky-700">
                                    <Landmark className="h-4 w-4" />
                                </div>
                                <p className="text-xs font-bold text-slate-500">ເງິນໂອນ</p>
                                <p className="text-lg font-bold text-slate-900">{fmtMoney(summary.transfer)} K</p>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/80">
                        <h3 className="text-2xl font-bold tracking-tight text-[#0f2744]">ລາຍການຊຳລະເງິນ</h3>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <div className="relative w-full max-w-sm">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    value={querySearch}
                                    onChange={(e) => setQuerySearch(e.target.value)}
                                    placeholder="Search"
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                />
                            </div>
                            <select
                                value={queryMethod}
                                onChange={(e) => setQueryMethod(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                            >
                                {methodOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="date"
                                value={queryFrom}
                                onChange={(e) => setQueryFrom(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                            />
                            <input
                                type="date"
                                value={queryTo}
                                onChange={(e) => setQueryTo(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                            />
                            <button
                                type="button"
                                onClick={applyFilters}
                                className="rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md"
                                style={{ backgroundColor: primary }}
                            >
                                ກອງຂໍ້ມູນ
                            </button>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-100 text-slate-700">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-bold">Payment ID</th>
                                        <th className="px-3 py-2 text-left font-bold">ລະຫັດບໍລິການ</th>
                                        <th className="px-3 py-2 text-left font-bold">ລະຫັດພະນັກງານ</th>
                                        <th className="px-3 py-2 text-left font-bold">ໂຕະ</th>
                                        <th className="px-3 py-2 text-left font-bold">ຍອດລວມ</th>
                                        <th className="px-3 py-2 text-left font-bold">ວິທີຊຳລະ</th>
                                        <th className="px-3 py-2 text-left font-bold">ເວລາຊຳລະ</th>
                                        <th className="px-3 py-2 text-left font-bold">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {payments.map((row, idx) => (
                                        <tr key={row.id}>
                                            <td className="px-3 py-2 font-semibold">{row.id}</td>
                                            <td className="px-3 py-2 font-semibold text-[#194c9f]">{row.service_id}</td>
                                            <td className="px-3 py-2">{row.staff_id}</td>
                                            <td className="px-3 py-2 font-semibold text-[#194c9f]">{row.table_no}</td>
                                            <td className="px-3 py-2 font-semibold">{fmtMoney(row.total_amount)} K</td>
                                            <td className="px-3 py-2">{methodBadge(row.method)}</td>
                                            <td className="px-3 py-2">{row.payment_time}</td>
                                            <td className="px-3 py-2">
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => printReceipt(row)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                                                    >
                                                        <Printer className="h-3.5 w-3.5" />
                                                        ພິມບິນ
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deletePayment(row)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-600"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        ລົບ
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {payments.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                                                ບໍ່ພົບຂໍ້ມູນຊຳລະເງິນ
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                        <h3 className="text-xl font-bold text-[#0f2744]">ບັນທຶກການຊຳລະເງິນ</h3>
                        <div className="mt-4 space-y-2">
                            <input
                                type="search"
                                value={serviceSearch}
                                onChange={(e) => setServiceSearch(e.target.value)}
                                placeholder="Service ID / ລູກຄ້າ / ໂຕະ"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => loadActiveServices(serviceSearch)}
                                    disabled={lookupLoading}
                                    className="rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md disabled:cursor-not-allowed disabled:bg-slate-300"
                                    style={{ backgroundColor: lookupLoading ? undefined : primary }}
                                >
                                    ຄົ້ນຫາບໍລິການ
                                </button>
                                <select
                                    value={selectedServiceId}
                                    onChange={(e) => setSelectedServiceId(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                >
                                    <option value="">ເລືອກບໍລິການ</option>
                                    {activeServices.map((svc) => (
                                        <option key={svc.service_id} value={svc.service_id}>
                                            #{svc.service_id} - {svc.customer_name} ({svc.table_no})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {selectedService && (
                            <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <p><span className="font-bold text-slate-600">Customer:</span> {selectedService.customer_name}</p>
                                    <p><span className="font-bold text-slate-600">People:</span> {selectedService.guest_count}</p>
                                    <p><span className="font-bold text-slate-600">Table:</span> <span className="font-semibold text-[#194c9f]">{selectedService.table_no}</span></p>
                                    <p><span className="font-bold text-slate-600">Tier:</span> {selectedService.buffet_tier}</p>
                                    <p><span className="font-bold text-slate-600">Price/Tier:</span> {fmtMoney(selectedService.tier_price)} K</p>
                                    <p><span className="font-bold text-slate-600">Service ID:</span> <span className="font-semibold text-[#194c9f]">#{selectedService.service_id}</span></p>
                                    <p className="col-span-2"><span className="font-bold text-slate-600">Check-in:</span> {selectedService.check_in_time}</p>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-slate-600">ວິທີການຊຳລະ</label>
                                    <select
                                        value={method}
                                        onChange={(e) => setMethod(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                    >
                                        {payMethods.map((m) => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-slate-600">ຍອດລວມທັງໝົດ</label>
                                    <input
                                        readOnly
                                        value={`${fmtMoney(selectedService.total_amount)} K`}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800"
                                    />
                                </div>
                                {method === 'cash' && (
                                    <div className="space-y-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={receivedAmount}
                                            onChange={(e) => setReceivedAmount(e.target.value)}
                                            placeholder="ຮັບເງິນມາ"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                                        />
                                        <input
                                            readOnly
                                            value={`ເງິນທອນ: ${fmtMoney(change)} K`}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700"
                                        />
                                        {insufficientCash && <p className="text-xs font-semibold text-rose-600">ຈຳນວນເງິນຮັບມາບໍ່ພຽງພໍ</p>}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                            >
                                ຍົກເລີກ
                            </button>
                            <button
                                type="button"
                                onClick={submitPayment}
                                disabled={!selectedService || submitting || insufficientCash}
                                className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                                style={{ backgroundColor: !selectedService || submitting || insufficientCash ? undefined : primary }}
                            >
                                ຢືນຢັນການຊຳລະເງິນ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
