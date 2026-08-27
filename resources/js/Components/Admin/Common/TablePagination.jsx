import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { buildVisiblePageNumbers, PAGE_SIZE } from '@/Components/Reports/reportTableUtils';

/**
 * Lao labels, same UX as report tables (ສະແດງ a–b ຈາກ n ລາຍການ + pages).
 */
export default function TablePagination({
    page,
    onPageChange,
    totalItems,
    pageSize = PAGE_SIZE,
    className = '',
}) {
    const totalPages = Math.max(1, Math.ceil(Math.max(0, totalItems) / pageSize) || 1);
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIdx = (safePage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalItems);

    const pageNumbers = useMemo(
        () => buildVisiblePageNumbers(safePage, totalPages),
        [safePage, totalPages]
    );

    if (totalItems <= 0) {
        return null;
    }

    const goToPage = (p) => {
        onPageChange(Math.max(1, Math.min(p, totalPages)));
    };

    return (
        <div
            className={`mt-3 flex flex-wrap items-center justify-between gap-2 ${className}`.trim()}
        >
            <p className="text-xs text-slate-500">
                ສະແດງ {startIdx + 1}–{endIdx} ຈາກ {totalItems} ລາຍການ
            </p>
            {totalPages > 1 ? (
                <nav className="flex items-center gap-1" aria-label="Pagination">
                    <button
                        type="button"
                        onClick={() => goToPage(safePage - 1)}
                        disabled={safePage <= 1}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Previous"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    {pageNumbers.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => goToPage(p)}
                            className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 text-xs font-semibold transition ${
                                p === safePage
                                    ? 'border-[#194c9f] bg-[#194c9f] text-white shadow-sm'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => goToPage(safePage + 1)}
                        disabled={safePage >= totalPages}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Next"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </nav>
            ) : null}
        </div>
    );
}
