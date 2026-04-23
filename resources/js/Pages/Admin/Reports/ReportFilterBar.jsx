import { useMemo, useState } from 'react';
import { RField, RInput, RSelect, TierSelectField } from '@/Components/Reports/ReportFilterPrimitives';

/** ແຖບກັ່ນຕອງກາງ — ໃຊ້ໂຄງ flex ແຖວດຽວຮ່ວມກັນທຸກລາຍງານ */
export default function ReportFilterBar({
    reportType,
    loading,
    filters,
    menuCategories,
    buffetTiers,
    supplierOptions,
    options,
    onChangeReportType,
    onPatch,
    onSearch,
    onReset,
    filterButtonClass,
}) {
    const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
    const [supplierSearch, setSupplierSearch] = useState(() => {
        const matched = supplierOptions.find((s) => String(s.id) === String(filters.supplierId));
        return matched?.name ?? '';
    });

    const isMenuReport = reportType === 'menu';
    const isIncomeReport = reportType === 'income';
    const isQueueStatsReport = reportType === 'queue_statistics';
    const isPurchaseReport = reportType === 'ingredient_purchase';
    const isImportReport = reportType === 'ingredient_import';

    const resolveSupplierIdFromText = (text) => {
        const normalized = String(text ?? '').trim().toLowerCase();
        if (normalized === '') return 'all';
        const exact = supplierOptions.find((s) => String(s.name ?? '').trim().toLowerCase() === normalized);
        if (exact) return String(exact.id);
        const partial = supplierOptions.find((s) => String(s.name ?? '').toLowerCase().includes(normalized));
        return partial ? String(partial.id) : 'all';
    };

    const visibleSupplierOptions = useMemo(() => {
        const q = String(supplierSearch ?? '').trim().toLowerCase();
        if (q === '') return supplierOptions;
        return supplierOptions.filter((s) => String(s.name ?? '').toLowerCase().includes(q));
    }, [supplierOptions, supplierSearch]);

    const pickSupplier = (id, name) => {
        const nextId = String(id);
        setSupplierSearch(name);
        setSupplierDropdownOpen(false);
        onPatch({ supplierId: nextId });
    };

    return (
        <section className="w-full overflow-visible rounded-xl border border-slate-100 bg-white p-4 shadow-sm md:p-5">
            <div className="flex w-full min-w-0 flex-nowrap items-end gap-2 md:gap-3">
                <div className="flex min-h-0 min-w-0 flex-1 flex-nowrap items-end gap-2">
                    <RField className="min-w-[11rem] max-w-[14rem] flex-1" label="ເລືອກປະເພດລາຍງານ">
                        <RSelect value={reportType} onChange={(e) => onChangeReportType(e.target.value)}>
                            {options.reportOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </RSelect>
                    </RField>

                    {isMenuReport ? (
                        <>
                            <RField className="w-[11rem] shrink-0" label="ສະຖານະເມນູ">
                                <RSelect value={filters.statusFilter} onChange={(e) => onPatch({ statusFilter: e.target.value })}>
                                    {options.menuStatusOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </RSelect>
                            </RField>
                            <RField className="w-[13rem] shrink-0" label="ປະເພດອາຫານ">
                                <RSelect value={filters.categoryId} onChange={(e) => onPatch({ categoryId: e.target.value })}>
                                    <option value="all">ເລືອກທັງໝົດ</option>
                                    {menuCategories.map((cat) => (
                                        <option key={cat.id} value={String(cat.id)}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </RSelect>
                            </RField>
                            <TierSelectField
                                boxClass="w-[12rem] shrink-0"
                                label="Buffet Tier (ເມນູ)"
                                tiers={buffetTiers}
                                value={filters.tierId}
                                onChange={(e) => onPatch({ tierId: e.target.value })}
                            />
                        </>
                    ) : (
                        <>
                            <RField className="w-[8.5rem] shrink-0" label="ຕັ້ງແຕ່">
                                <RInput type="date" value={filters.from} onChange={(e) => onPatch({ from: e.target.value })} />
                            </RField>
                            <RField className="w-[8.5rem] shrink-0" label="ຫາ">
                                <RInput type="date" value={filters.to} onChange={(e) => onPatch({ to: e.target.value })} />
                            </RField>

                            {isIncomeReport && (
                                <>
                                    <RField className="w-28 max-w-[130px] shrink-0" label="ວິທີຊຳລະ">
                                        <RSelect value={filters.paymentMethod} onChange={(e) => onPatch({ paymentMethod: e.target.value })}>
                                            {options.paymentMethodOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </RSelect>
                                    </RField>
                                    <TierSelectField
                                        boxClass="w-40 shrink-0"
                                        label="Buffet Tier (ລາຍຮັບ)"
                                        tiers={buffetTiers}
                                        value={filters.tierId}
                                        onChange={(e) => onPatch({ tierId: e.target.value })}
                                    />
                                </>
                            )}

                            {isPurchaseReport && (
                                <>
                                    <RField className="w-[8.5rem] shrink-0" label="ສະຖານະ PO">
                                        <RSelect value={filters.purchaseStatus} onChange={(e) => onPatch({ purchaseStatus: e.target.value })}>
                                            {options.purchaseStatusOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </RSelect>
                                    </RField>
                                    <RField className="w-[8.5rem] shrink-0" label="ຜູ້ສະໜອງ">
                                        <div className="relative">
                                            <RInput
                                                type="text"
                                                value={supplierSearch}
                                                onFocus={() => setSupplierDropdownOpen(true)}
                                                onBlur={() => setTimeout(() => setSupplierDropdownOpen(false), 120)}
                                                onChange={(e) => {
                                                    const text = e.target.value;
                                                    setSupplierSearch(text);
                                                    onPatch({ supplierId: resolveSupplierIdFromText(text) });
                                                    setSupplierDropdownOpen(true);
                                                }}
                                                placeholder="ຄົ້ນຫາ/ເລືອກຜູ້ສະໜອງ"
                                            />
                                            {supplierDropdownOpen && (
                                                <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                                                    <button
                                                        type="button"
                                                        className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => {
                                                            setSupplierSearch('');
                                                            onPatch({ supplierId: 'all' });
                                                            setSupplierDropdownOpen(false);
                                                        }}
                                                    >
                                                        ຜູ້ສະໜອງທັງໝົດ
                                                    </button>
                                                    {visibleSupplierOptions.map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={() => pickSupplier(opt.id, opt.name)}
                                                        >
                                                            {opt.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </RField>
                                </>
                            )}

                            {isImportReport && (
                                <RField className="w-[9rem] shrink-0" label="ຜູ້ສະໜອງ">
                                    <div className="relative">
                                        <RInput
                                            type="text"
                                            value={supplierSearch}
                                            onFocus={() => setSupplierDropdownOpen(true)}
                                            onBlur={() => setTimeout(() => setSupplierDropdownOpen(false), 120)}
                                            onChange={(e) => {
                                                const text = e.target.value;
                                                setSupplierSearch(text);
                                                onPatch({ supplierId: resolveSupplierIdFromText(text) });
                                                setSupplierDropdownOpen(true);
                                            }}
                                            placeholder="ຄົ້ນຫາ/ເລືອກຜູ້ສະໜອງ"
                                        />
                                        {supplierDropdownOpen && (
                                            <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                                                <button
                                                    type="button"
                                                    className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => {
                                                        setSupplierSearch('');
                                                        onPatch({ supplierId: 'all' });
                                                        setSupplierDropdownOpen(false);
                                                    }}
                                                >
                                                    ຜູ້ສະໜອງທັງໝົດ
                                                </button>
                                                {visibleSupplierOptions.map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => pickSupplier(opt.id, opt.name)}
                                                    >
                                                        {opt.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </RField>
                            )}

                            {isQueueStatsReport && (
                                <RField className="w-[14rem] shrink-0" label="ສະຖານະຄິວ">
                                    <RSelect value={filters.queueStatus} onChange={(e) => onPatch({ queueStatus: e.target.value })}>
                                        {options.queueStatusFilterOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </RSelect>
                                </RField>
                            )}
                        </>
                    )}
                </div>

                <div className="flex shrink-0 gap-2">
                    <button
                        type="button"
                        onClick={onSearch}
                        disabled={loading}
                        className={`${filterButtonClass} w-24 bg-[#194c9f] text-white disabled:opacity-60`}
                    >
                        {loading ? 'ກຳລັງໂຫຼດ...' : 'ຄົ້ນຫາ'}
                    </button>
                    <button type="button" onClick={onReset} className={`${filterButtonClass} w-32 bg-rose-600 text-white`}>
                        ລ້າງຕົວກອງ
                    </button>
                </div>
            </div>
        </section>
    );
}

