// ລາຍງານ: ໜ້າກາງ (orchestrator) ທີ່ຮວບຮວມ filter + table + summary
import AdminLayout from '@/Layouts/AdminLayout';
import GenericReportTable from '@/Components/Reports/GenericReportTable';
import { Head, usePage } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatAmount } from '@/utils/formatAmount';
import ReportFilterBar from './Reports/ReportFilterBar';
import ReportSummarySection from './Reports/ReportSummarySection';
import { getIncomeColumns } from './Reports/IncomeReport';
import { getQueueStatisticsColumns } from './Reports/QueueStatisticsReport';
import { getQueueBookingColumns } from './Reports/QueueBookingReport';
import { getMenuColumns } from './Reports/MenuReport';
import { getIngredientUsageColumns } from './Reports/IngredientUsageReport';
import { getIngredientPurchaseColumns } from './Reports/IngredientPurchaseReport';
import { getIngredientImportColumns } from './Reports/IngredientImportReport';
import { getServiceColumns } from './Reports/ServiceReport';

const reportOptions = [
    { value: 'income', label: 'ລາຍງານລາຍຮັບ' },
    { value: 'queue_statistics', label: 'ລາຍງານສະຖິຕິຄິວ' },
    { value: 'queue_booking', label: 'ລາຍງານການຈອງຄິວ' },
    { value: 'service', label: 'ລາຍງານການບໍລິການ' },
    { value: 'menu', label: 'ລາຍງານຂໍ້ມູນເມນູ' },
    { value: 'ingredient_usage', label: 'ລາຍງານການໃຊ້ວັດຖຸດິບ' },
    { value: 'ingredient_purchase', label: 'ລາຍງານການສັ່ງຊື້ວັດຖຸດິບ' },
    { value: 'ingredient_import', label: 'ລາຍງານນຳເຂົ້າວັດຖຸດິບ' },
];

const menuStatusOptions = [
    { value: 'all', label: 'ເມນູທັງໝົດ' },
    { value: 'active', label: 'ເມນູເປີດໃຊ້ງານ' },
    { value: 'inactive', label: 'ເມນູປິດໃຊ້ງານ' },
];

const paymentMethodOptions = [
    { value: 'all', label: 'ທຸກວິທີ' },
    { value: 'cash', label: 'ເງິນສົດ' },
    { value: 'transfer', label: 'ເງິນໂອນ' },
];

const queueStatusFilterOptions = [
    { value: 'all', label: 'ສະຫຼຸບຕໍ່ມື້ (ທຸກສະຖານະ)' },
    { value: 'completed', label: 'ສະເພາະຄິວສຳເລັດ' },
    { value: 'skipped', label: 'ສະເພາະຄິວຂ້າມ' },
    { value: 'cancelled', label: 'ສະເພາະຄິວຍົກເລີກ' },
    { value: 'other', label: 'ສະເພາະສະຖານະອື່ນ' },
];

const servicePaymentStatusOptions = [
    { value: 'all', label: 'ທຸກສະຖານະຊຳລະ' },
    { value: 'paid', label: 'ຊຳລະແລ້ວ' },
    { value: 'unpaid', label: 'ຍັງບໍ່ຊຳລະ' },
];

const purchaseStatusOptions = [
    { value: 'all', label: 'ສະຖານະທັງໝົດ' },
    { value: 'pending', label: 'ກຳລັງລໍຖ້າ' },
    { value: 'received', label: 'ເຄື່ອງເຂົ້າແລ້ວ' },
];

const filterButtonClass =
    'inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-semibold shadow-sm transition font-sans';

function defaultReportFromDate() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
}

function defaultReportToDate() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function moneyKip(v) {
    return `${formatAmount(v ?? 0)} KIP`;
}

function reportTitleByType(type) {
    return reportOptions.find((opt) => opt.value === type)?.label ?? 'ລາຍງານ';
}

export default function ReportsPage({
    initialType,
    initialFrom,
    initialTo,
    initialStatusFilter,
    initialCategoryId,
    menuCategories = [],
    buffetTiers = [],
    supplierOptions = [],
    initialPaymentMethod = 'all',
    initialTierId = 'all',
    initialQueueStatus = 'all',
    initialSearchQuery = '',
    initialPurchaseStatus = 'all',
    initialSupplierId = 'all',
    initialRows = [],
    initialSummary = {},
}) {
    const { auth } = usePage().props;
    const printedBy = auth?.user?.name ?? '—';
    const printedAt = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    // ສະຖານະ filter ກາງ
    const [reportType, setReportType] = useState(initialType ?? 'income');
    const [from, setFrom] = useState(initialFrom ?? '');
    const [to, setTo] = useState(initialTo ?? '');
    const [statusFilter, setStatusFilter] = useState(initialStatusFilter ?? 'all');
    const [categoryId, setCategoryId] = useState(initialCategoryId ?? 'all');
    const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod ?? 'all');
    const [tierId, setTierId] = useState(initialTierId ?? 'all');
    const [queueStatus, setQueueStatus] = useState(initialQueueStatus ?? 'all');
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery ?? '');
    const [purchaseStatus, setPurchaseStatus] = useState(initialPurchaseStatus ?? 'all');
    const [supplierId, setSupplierId] = useState(initialSupplierId ?? 'all');

    // ຂໍ້ມູນຜົນລັບ
    const [rows, setRows] = useState(initialRows);
    const [summary, setSummary] = useState(initialSummary);
    const [loading, setLoading] = useState(false);

    const columns = useMemo(() => {
        if (reportType === 'income') return getIncomeColumns();
        if (reportType === 'queue_statistics') return getQueueStatisticsColumns(queueStatus);
        if (reportType === 'queue_booking') return getQueueBookingColumns();
        if (reportType === 'service') return getServiceColumns();
        if (reportType === 'menu') return getMenuColumns();
        if (reportType === 'ingredient_usage') return getIngredientUsageColumns();
        if (reportType === 'ingredient_purchase') return getIngredientPurchaseColumns();
        if (reportType === 'ingredient_import') return getIngredientImportColumns();
        return [{ key: 'message', header: 'ລາຍງານ', cell: () => 'Coming soon' }];
    }, [reportType, queueStatus]);

    // ຮວບພາຣາມິເຕີສົ່ງຫາ backend
    const fetchReport = (
        nextType = reportType,
        nextFrom = from,
        nextTo = to,
        nextStatus = statusFilter,
        nextCategory = categoryId,
        nextPaymentMethod = paymentMethod,
        nextTierId = tierId,
        nextQueueStatus = queueStatus,
        nextSearchQuery = searchQuery,
        nextPurchaseStatus = purchaseStatus,
        nextSupplierId = supplierId
    ) => {
        setLoading(true);
        const paramsObj = { type: nextType, _ts: String(Date.now()) };

        if (nextType === 'menu') {
            paramsObj.status_filter = nextStatus;
            paramsObj.category_id = nextCategory;
            paramsObj.tier_id = nextTierId;
            paramsObj.from = nextFrom;
            paramsObj.to = nextTo;
            paramsObj.search_query = nextSearchQuery;
        } else {
            paramsObj.from = nextFrom;
            paramsObj.to = nextTo;
            if (nextType === 'income') {
                paramsObj.payment_method = nextPaymentMethod;
                paramsObj.tier_id = nextTierId;
            }
            if (nextType === 'queue_statistics') {
                paramsObj.queue_status = nextQueueStatus;
            }
            if (nextType === 'service') {
                paramsObj.queue_status = nextQueueStatus;
                paramsObj.tier_id = nextTierId;
            }
            if (nextType === 'ingredient_purchase') {
                paramsObj.purchase_status = nextPurchaseStatus;
                paramsObj.supplier_id = nextSupplierId;
            }
            if (nextType === 'ingredient_import') {
                paramsObj.supplier_id = nextSupplierId;
            }
        }

        const params = new URLSearchParams(paramsObj);
        fetch(`${route('admin.reports.data')}?${params.toString()}`, {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
        })
            .then((res) => {
                if (!res.ok) throw new Error(`Report fetch failed: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                setRows(Array.isArray(data.rows) ? data.rows : []);
                setSummary(data.summary ?? {});
            })
            .catch(() => {
                setRows([]);
                setSummary({});
            })
            .finally(() => setLoading(false));
    };

    const refetch = (patch = {}) =>
        fetchReport(
            patch.reportType ?? reportType,
            patch.from ?? from,
            patch.to ?? to,
            patch.statusFilter ?? statusFilter,
            patch.categoryId ?? categoryId,
            patch.paymentMethod ?? paymentMethod,
            patch.tierId ?? tierId,
            patch.queueStatus ?? queueStatus,
            patch.searchQuery ?? searchQuery,
            patch.purchaseStatus ?? purchaseStatus,
            patch.supplierId ?? supplierId
        );

    const onPatch = (patch) => {
        if (Object.prototype.hasOwnProperty.call(patch, 'from')) setFrom(patch.from);
        if (Object.prototype.hasOwnProperty.call(patch, 'to')) setTo(patch.to);
        if (Object.prototype.hasOwnProperty.call(patch, 'statusFilter')) setStatusFilter(patch.statusFilter);
        if (Object.prototype.hasOwnProperty.call(patch, 'categoryId')) setCategoryId(patch.categoryId);
        if (Object.prototype.hasOwnProperty.call(patch, 'paymentMethod')) setPaymentMethod(patch.paymentMethod);
        if (Object.prototype.hasOwnProperty.call(patch, 'tierId')) setTierId(patch.tierId);
        if (Object.prototype.hasOwnProperty.call(patch, 'queueStatus')) setQueueStatus(patch.queueStatus);
        if (Object.prototype.hasOwnProperty.call(patch, 'searchQuery')) setSearchQuery(patch.searchQuery);
        if (Object.prototype.hasOwnProperty.call(patch, 'purchaseStatus')) setPurchaseStatus(patch.purchaseStatus);
        if (Object.prototype.hasOwnProperty.call(patch, 'supplierId')) setSupplierId(patch.supplierId);
        refetch(patch);
    };

    const onChangeReportType = (nextType) => {
        setReportType(nextType);
        setRows([]);
        setSummary({});
        fetchReport(nextType, from, to, statusFilter, categoryId, paymentMethod, tierId, queueStatus, searchQuery, purchaseStatus, supplierId);
    };

    const onReset = () => {
        const nextFrom = defaultReportFromDate();
        const nextTo = defaultReportToDate();
        setFrom(nextFrom);
        setTo(nextTo);
        setStatusFilter('all');
        setCategoryId('all');
        setPaymentMethod('all');
        setTierId('all');
        setQueueStatus('all');
        setSearchQuery('');
        setPurchaseStatus('all');
        setSupplierId('all');
        fetchReport(reportType, nextFrom, nextTo, 'all', 'all', 'all', 'all', 'all', '', 'all', 'all');
    };

    return (
        <AdminLayout title="ລາຍງານ">
            <Head title="ລາຍງານ" />
            <div className="-mx-4 -mt-2 bg-slate-50 px-4 pb-12 pt-4 font-sans md:-mx-8 md:px-8 md:pb-14 md:pt-6">
                <div className="mx-auto max-w-7xl space-y-4">
                    <div className="no-print">
                        <ReportFilterBar
                            reportType={reportType}
                            loading={loading}
                            filters={{
                                from,
                                to,
                                statusFilter,
                                categoryId,
                                paymentMethod,
                                tierId,
                                queueStatus,
                                purchaseStatus,
                                supplierId,
                            }}
                            menuCategories={menuCategories}
                            buffetTiers={buffetTiers}
                            supplierOptions={supplierOptions}
                            options={{
                                reportOptions,
                                menuStatusOptions,
                                paymentMethodOptions,
                                queueStatusFilterOptions,
                                servicePaymentStatusOptions,
                                purchaseStatusOptions,
                            }}
                            onChangeReportType={onChangeReportType}
                            onPatch={onPatch}
                            onSearch={() => fetchReport()}
                            onReset={onReset}
                            filterButtonClass={filterButtonClass}
                        />
                    </div>

                    <section className={`report-print-area report-${reportType} rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-200/80`}>
                        <div className="print-only mb-3 hidden border-b border-slate-300 px-1 pb-3 print:block">
                            <h1 className="text-lg font-black text-[#194c9f]">OSHINEI RESTAURANT</h1>
                            <p className="text-xs text-slate-700">ທີ່ຢູ່: ບ້ານ ສະພານທອງ, ເມືອງ ໄຊເສດຖາ, ນະຄອນຫຼວງວຽງຈັນ</p>
                            <p className="text-xs text-slate-700">ໂທ: 021 454 565, 020 59 494 465</p>
                            <h2 className="mt-2 text-base font-extrabold text-slate-900">{reportTitleByType(reportType)}</h2>
                            <div className="mt-1 grid grid-cols-1 gap-0.5 text-xs text-slate-700">
                                <p>ຊ່ວງວັນທີ: {from || '-'} ຫາ {to || '-'}</p>
                                <p>ວັນທີພິມລາຍງານ: {printedAt}</p>
                                <p>ຜູ້ພິມລາຍງານ: {printedBy}</p>
                            </div>
                        </div>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="no-print w-full min-w-0">
                                <ReportSummarySection reportType={reportType} summary={summary} moneyKip={moneyKip} />
                            </div>
                        </div>

                        <GenericReportTable columns={columns} rows={rows} />
                        <div className="no-print mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#194c9f] px-4 text-sm font-semibold text-white font-sans"
                            >
                                <Printer className="h-4 w-4" />
                                ພິມລາຍງານ
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
