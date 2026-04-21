import { ChevronDown, Loader2, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const defaultPrimary = '#194c9f';

/**
 * Buffet tier ↔ menu checklist: category filter + debounced name search (cross-filter).
 * Checked state lives in the parent (`checked` Set) so clearing filters never loses selections.
 *
 * @param {object} props
 * @param {Array<{ id: number, name: string, category_name?: string, category_id?: number|null, description?: string, is_active?: boolean }>} props.menus
 * @param {Set<number>} props.checked
 * @param {(menuId: number) => void} props.onToggle
 * @param {boolean} props.viewSelectedOnly
 * @param {boolean} props.tierPivotLoading
 * @param {boolean} props.bindingSaveBusy
 * @param {string} [props.primaryColor]
 */
export default function BuffetTierMapping({
    menus = [],
    checked,
    onToggle,
    viewSelectedOnly,
    tierPivotLoading,
    bindingSaveBusy,
    primaryColor = defaultPrimary,
}) {
    const [categoryFilter, setCategoryFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const t = window.setTimeout(() => setDebouncedSearch(searchInput), 300);
        return () => window.clearTimeout(t);
    }, [searchInput]);

    const categoryOptions = useMemo(() => {
        const byId = new Map();
        for (const m of menus) {
            const id = m.category_id;
            if (id == null || id === '') {
                continue;
            }
            const key = String(id);
            if (!byId.has(key)) {
                byId.set(key, {
                    value: key,
                    label: (m.category_name ?? '').trim() || '—',
                });
            }
        }
        return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label, 'lo'));
    }, [menus]);

    const rowsAfterViewMode = useMemo(() => {
        if (!viewSelectedOnly) {
            return menus;
        }
        return menus.filter((m) => checked.has(m.id));
    }, [menus, viewSelectedOnly, checked]);

    const rowsAfterCategory = useMemo(() => {
        if (!categoryFilter) {
            return rowsAfterViewMode;
        }
        return rowsAfterViewMode.filter((m) => String(m.category_id ?? '') === categoryFilter);
    }, [rowsAfterViewMode, categoryFilter]);

    const rowsFiltered = useMemo(() => {
        const q = debouncedSearch.trim().toLowerCase();
        if (!q) {
            return rowsAfterCategory;
        }
        return rowsAfterCategory.filter((m) => String(m.name ?? '').toLowerCase().includes(q));
    }, [rowsAfterCategory, debouncedSearch]);

    const showNoResultsMessage =
        rowsFiltered.length === 0 &&
        menus.length > 0 &&
        (viewSelectedOnly || !!categoryFilter || debouncedSearch.trim().length > 0);

    const showViewSelectedEmpty = viewSelectedOnly && rowsAfterViewMode.length === 0;

    return (
        <div className="relative mt-4">
            {tierPivotLoading ? (
                <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/85 backdrop-blur-[1px]"
                    aria-busy="true"
                    aria-live="polite"
                >
                    <Loader2 className="h-8 w-8 animate-spin text-[#194c9f]" aria-hidden />
                    <span className="text-sm font-semibold text-[#194c9f]">ກຳລັງໂຫຼດການຜູກເມນູ…</span>
                </div>
            ) : null}

            <div className="mb-4 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
                <div className="relative w-full min-w-0 sm:max-w-[14rem] sm:flex-initial">
                    <label htmlFor="tier-bind-category" className="mb-1.5 block text-xs font-semibold text-slate-600">
                        ປະເພດອາຫານ
                    </label>
                    <div className="relative">
                        <select
                            id="tier-bind-category"
                            className="w-full cursor-pointer appearance-none rounded-xl border border-transparent py-3 pl-4 pr-11 text-sm font-bold text-white shadow-sm outline-none transition hover:opacity-95 focus:ring-2 focus:ring-white/40"
                            style={{ backgroundColor: primaryColor }}
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            disabled={tierPivotLoading || bindingSaveBusy}
                            aria-label="ປະເພດອາຫານ"
                        >
                            <option value="">ທຸກປະເພດ</option>
                            {categoryOptions.map((opt) => (
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
                </div>
                <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
                    <label htmlFor="tier-bind-search" className="mb-1.5 block text-xs font-semibold text-slate-600">
                        ຄົ້ນຫາ
                    </label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2} aria-hidden />
                        <input
                            id="tier-bind-search"
                            type="search"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="ຄົ້ນຫາຊື່ເມນູ..."
                            disabled={tierPivotLoading || bindingSaveBusy}
                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-300 hover:bg-slate-50/80 focus:border-slate-300 focus:ring-2 focus:ring-slate-200/80 disabled:opacity-60"
                            autoComplete="off"
                        />
                    </div>
                </div>
            </div>

            {showViewSelectedEmpty ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                    ບໍ່ມີລາຍການທີ່ເລືອກໄວ້ສຳລັບປະເພດບຸບເຟ່ນີ້ — ກົດປຸ່ມ «ເບິ່ງເມນູທີ່ເລືອກໄວ້» ເພື່ອເບິ່ງລາຍການທັງໝົດ ຫຼື ເລືອກເມນູໃໝ່.
                </p>
            ) : showNoResultsMessage ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-600">
                    ບໍ່ພົບລາຍການເມນູທີ່ທ່ານຄົ້ນຫາ
                </p>
            ) : (
                <ul className="max-h-[min(60vh,520px)] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                    {rowsFiltered.map((m) => (
                        <li key={m.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/80">
                            <input
                                id={`tier-menu-${m.id}`}
                                type="checkbox"
                                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-[#194c9f] focus:ring-[#194c9f]/40 disabled:opacity-50"
                                checked={checked.has(m.id)}
                                disabled={tierPivotLoading || bindingSaveBusy}
                                onChange={() => onToggle(m.id)}
                            />
                            <label
                                htmlFor={`tier-menu-${m.id}`}
                                className={`min-w-0 flex-1 ${tierPivotLoading || bindingSaveBusy ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                            >
                                <span className="font-semibold text-slate-900">{m.name}</span>
                                <span className="ml-2 text-xs font-medium text-slate-500">({m.category_name || '—'})</span>
                                {!m.is_active ? (
                                    <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                                        ປິດໃຊ້ງານ
                                    </span>
                                ) : null}
                                {m.description ? (
                                    <span className="mt-0.5 block text-xs text-slate-500 line-clamp-2">{m.description}</span>
                                ) : null}
                            </label>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
