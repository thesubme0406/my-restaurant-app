// ຕາຕະລາງລາຍງານ (ຫົວຕາຕະລາງສີຟ້າ OSHINEI)
function defaultCell(value) {
    if (value === null || value === undefined || value === '') return '—';
    return value;
}

export default function GenericReportTable({ columns = [], rows = [] }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-[#194c9f] text-white">
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} className="px-3 py-2 text-left text-xs font-semibold md:text-sm">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                    {rows.map((row, idx) => (
                        <tr key={row.id ?? idx}>
                            {columns.map((col) => {
                                const val = typeof col.cell === 'function' ? col.cell(row, idx) : row[col.key];
                                return (
                                    <td key={col.key} className="px-3 py-1.5 align-middle text-xs leading-5 text-slate-700 md:py-2 md:text-sm">
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
                </tbody>
            </table>
        </div>
    );
}

