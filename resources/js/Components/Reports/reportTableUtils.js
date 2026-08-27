export const PAGE_SIZE = 7;

export function defaultCell(value) {
    if (value === null || value === undefined || value === '') return '—';
    return value;
}

/** Flatten React nodes for client-side table search (print path is unchanged). */
export function extractTextFromReactNode(node) {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractTextFromReactNode).join(' ');
    if (typeof node === 'object' && node.props) {
        return extractTextFromReactNode(node.props.children ?? '');
    }
    return '';
}

/** Slice an array for the current page (client-side tables). */
export function paginateSlice(items, page, pageSize = PAGE_SIZE) {
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIdx = (safePage - 1) * pageSize;
    return {
        pageRows: items.slice(startIdx, startIdx + pageSize),
        safePage,
        totalPages,
        startIdx,
        totalItems,
    };
}

export function buildVisiblePageNumbers(safePage, totalPages, maxVisible = 5) {
    const pages = [];
    let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    if (end > totalPages) {
        end = totalPages;
        start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }
    return pages;
}
