import { ChevronDown, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

const defaultPrimary = '#194c9f';

// ຕາຕະລາງທົ່ວໄປ: ຄົ້ນຫາຝັ່ງຄລາຍ, ປຸ່ມເພີ່ມ, ກອງໝວດໝູ່ (categoryFilter) — primaryColor ຄ່າເລີ່ມ #194c9f
export default function GenericDataTable({
    columns,
    rows = [],
    searchKeys = [],
    searchPlaceholder = 'ຄົ້ນຫາ…',
    title,
    totalCount,
    totalLabel = 'ທັງໝົດ',
    countSuffix = 'ຄົນ',
    emptyMessage = 'ບໍ່ມີຂໍ້ມູນ',
    onAdd,
    addButtonLabel,
    primaryColor = defaultPrimary,
    toolbarClassName = '',
    categoryFilter,
}) {
    const [query, setQuery] = useState('');
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q || searchKeys.length === 0) {
            return rows;
        }
        return rows.filter((row) =>
            searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(q))
        );
    }, [rows, query, searchKeys]);

    const count = totalCount ?? rows.length;
    const displayCount = query.trim() ? filtered.length : count;

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-200/70 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    {title ? <h3 className="text-lg font-bold text-slate-900">{title}</h3> : null}
                    <p className="mt-1 text-sm text-slate-500">
                        {totalLabel} <span className="font-semibold text-slate-800">{displayCount}</span> {countSuffix}
                    </p>
                </div>
                <div
                    className={`flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:w-auto ${toolbarClassName}`.trim()}
                >
                    <div className="relative w-full min-w-0 sm:max-w-xs lg:min-w-[16rem] lg:flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-300 hover:bg-slate-50/80 focus:border-slate-300 focus:ring-2 focus:ring-slate-200/80"
                        />
                    </div>
                    {categoryFilter ? (
                        <div className="relative w-full min-w-0 sm:max-w-[14rem] sm:flex-1">
                            <select
                                className="w-full cursor-pointer appearance-none rounded-xl border border-transparent py-3 pl-4 pr-11 text-sm font-bold text-white shadow-sm outline-none transition hover:opacity-95 focus:ring-2 focus:ring-white/40"
                                style={{ backgroundColor: primaryColor }}
                                value={categoryFilter.value}
                                onChange={(e) => categoryFilter.onChange(e.target.value)}
                                aria-label={categoryFilter.allLabel ?? 'ໝວດໝູ່'}
                            >
                                <option value="">{categoryFilter.allLabel ?? 'ທຸກໝວດໝູ່'}</option>
                                {(categoryFilter.options ?? []).map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/90"
                                strokeWidth={2.5}
                                aria-hidden
                            />
                        </div>
                    ) : null}
                    {onAdd && addButtonLabel ? (
                        <button
                            type="button"
                            onClick={onAdd}
                            className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                            {addButtonLabel}
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                    <thead className="bg-slate-50/90">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    scope="col"
                                    className={`whitespace-nowrap px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-600 sm:px-4 ${col.thClassName ?? ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            filtered.map((row, index) => (
                                <tr key={row.id ?? index} className="hover:bg-slate-50/50">
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={`align-middle px-3 py-3 text-slate-800 sm:px-4 ${col.className ?? ''}`}
                                        >
                                            {col.cell({ row, index })}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ຮູບຫຼຽນ + ຊື່ແຖວ (ບຸບເຟ່ / ເມນູ)
export function TablePackageNameCell({ imageUrl, name }) {
    return (
        <div className="flex min-w-0 items-center gap-4">
            <div
                className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-200 shadow-inner"
                aria-hidden
            >
                {imageUrl ? (
                    <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : null}
            </div>
            <span className="min-w-0 font-medium leading-snug text-slate-900">{name}</span>
        </div>
    );
}
