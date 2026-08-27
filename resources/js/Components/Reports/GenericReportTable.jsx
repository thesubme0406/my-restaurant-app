import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import TablePagination from '@/Components/Admin/Common/TablePagination';
import { PAGE_SIZE, defaultCell, extractTextFromReactNode, paginateSlice } from './reportTableUtils';

function ReportTableBody({ columns, rows, rowClassName }) {
    return (
        <>
            {rows.map((row, idx) => (
                <tr
                    key={row.id ?? idx}
                    className={typeof rowClassName === 'function' ? rowClassName(row) : rowClassName}
                >
                    {columns.map((col) => {
                        const val =
                            typeof col.cell === 'function' ? col.cell(row, idx) : row[col.key];
                        return (
                            <td
                                key={col.key}
                                className="px-3 py-1.5 align-middle text-xs leading-5 text-slate-700 md:py-2 md:text-sm"
                            >
                                {defaultCell(val)}
                            </td>
                        );
                    })}
                </tr>
            ))}
            {rows.length === 0 && (
                <tr>
                    <td colSpan={columns.length || 1} className="px-4 py-10 text-center text-slate-500">
                        ບໍ່ພົບຂໍ້ມູນລາຍງານ
                    </td>
                </tr>
            )}
        </>
    );
}

function ReportTableHead({ columns }) {
    return (
        <thead className="bg-[#194c9f] text-white">
            <tr>
                {columns.map((col) => (
                    <th key={col.key} className="px-3 py-2 text-left text-xs font-semibold md:text-sm">
                        {col.header}
                    </th>
                ))}
            </tr>
        </thead>
    );
}

export default function GenericReportTable({ columns = [], rows = [] }) {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((row, idx) =>
            columns.some((col) => {
                const raw = typeof col.cell === 'function' ? col.cell(row, idx) : row[col.key];
                const text = extractTextFromReactNode(raw);
                return text.toLowerCase().includes(q);
            })
        );
    }, [rows, columns, search]);

    const { pageRows, startIdx } = useMemo(
        () => paginateSlice(filteredRows, currentPage, PAGE_SIZE),
        [filteredRows, currentPage]
    );

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    };

    const printRowClass = (row) => (row.is_voided ? 'bg-rose-50/50' : undefined);

    return (
        <div>
            <div className="no-print mb-3 flex items-center gap-3">
                <div className="relative w-full max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={handleSearch}
                        placeholder="ຄົ້ນຫາໃນຕາຕະລາງ..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white py-0 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/20"
                    />
                </div>
                {search ? (
                    <span className="text-xs text-slate-500">ພົບ {filteredRows.length} ລາຍການ</span>
                ) : null}
            </div>

            <div className="no-print overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <ReportTableHead columns={columns} />
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {pageRows.map((row, idx) => (
                            <tr
                                key={row.id ?? startIdx + idx}
                                className={`transition hover:bg-slate-50 ${row.is_voided ? 'bg-rose-50/50' : ''}`}
                            >
                                {columns.map((col) => {
                                    const val =
                                        typeof col.cell === 'function'
                                            ? col.cell(row, startIdx + idx)
                                            : row[col.key];
                                    return (
                                        <td
                                            key={col.key}
                                            className="px-3 py-1.5 align-middle text-xs leading-5 text-slate-700 md:py-2 md:text-sm"
                                        >
                                            {defaultCell(val)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        {pageRows.length === 0 && (
                            <tr>
                                <td colSpan={columns.length || 1} className="px-4 py-10 text-center text-slate-500">
                                    {search ? 'ບໍ່ພົບຜົນລັບຈາກການຄົ້ນຫາ' : 'ບໍ່ພົບຂໍ້ມູນລາຍງານ'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="no-print">
                <TablePagination
                    page={currentPage}
                    onPageChange={setCurrentPage}
                    totalItems={filteredRows.length}
                    pageSize={PAGE_SIZE}
                />
            </div>

            <div className="report-print-table-wrap hidden print:block">
                <table className="report-print-table min-w-full divide-y divide-slate-200 text-sm">
                    <ReportTableHead columns={columns} />
                    <tbody className="divide-y divide-slate-200 bg-white">
                        <ReportTableBody columns={columns} rows={rows} rowClassName={printRowClass} />
                    </tbody>
                </table>
            </div>
        </div>
    );
}
