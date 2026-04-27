import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Monitor, RefreshCw, Users } from 'lucide-react';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';

function formatClock(value) {
    if (!value) return '--:--:--';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return '--:--:--';
    return dt.toLocaleTimeString('en-GB', { hour12: false });
}

export default function QueueBoard({ board: initialBoard }) {
    const [board, setBoard] = useState(initialBoard ?? {});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [liveNow, setLiveNow] = useState(() => new Date());

    const refreshBoard = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await axios.get(route('admin.queue-board.data'));
            setBoard(res?.data?.board ?? {});
        } catch (_err) {
            setError('ອັບເດດບໍ່ສຳເລັດ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = window.setInterval(() => {
            void refreshBoard();
        }, 5000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const clockTimer = window.setInterval(() => {
            setLiveNow(new Date());
        }, 1000);
        return () => window.clearInterval(clockTimer);
    }, []);

    const upNextLabel = useMemo(() => {
        const rows = Array.isArray(board?.up_next) ? board.up_next : [];
        return rows.length ? rows : ['—'];
    }, [board]);

    const waitingRows = Array.isArray(board?.waiting_rows) ? board.waiting_rows : [];

    return (
        <AdminLayout title="ບອດຄິວໜ້າຮ້ານ">
            <Head title="Queue Waiting Board" />

            <div className="space-y-5">
                <section className="rounded-2xl border border-[#194c9f]/25 bg-white p-6 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-[#194c9f]/10 p-2.5 ring-1 ring-[#194c9f]/25">
                                <Monitor className="h-7 w-7 text-[#194c9f]" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#194c9f]/70">Live Queue Board</p>
                                <h1 className="text-2xl font-black text-[#194c9f] lg:text-3xl">ບອດຄິວສຳລັບຫນ້າຮ້ານ</h1>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={refreshBoard}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-[#194c9f] shadow-lg ring-1 ring-white/40 transition hover:-translate-y-0.5 hover:bg-[#f6f9ff]"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            ອັບເດດທັນທີ
                        </button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-700">
                        <p>ວັນທີ: <span className="font-bold text-[#194c9f]">{board?.date ?? '—'}</span></p>
                        <p>ເວລາຈິງ: <span className="font-bold text-[#194c9f]">{formatClock(liveNow)}</span></p>
                        {error ? <p className="font-semibold text-rose-600">{error}</p> : null}
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-[#194c9f]/20 bg-white p-5 shadow-sm">
                        <p className="text-sm font-bold text-slate-500">ກຳລັງເອີ້ນ</p>
                        <p className="mt-2 text-6xl font-black tracking-wide text-[#194c9f]">{board?.now_serving ?? '—'}</p>
                    </div>
                    <div className="rounded-2xl border border-[#194c9f]/20 bg-white p-5 shadow-sm">
                        <p className="text-sm font-bold text-slate-500">ຄິວຖັດໄປ</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {upNextLabel.map((queueNo) => (
                                <span
                                    key={String(queueNo)}
                                    className="inline-flex rounded-lg bg-[#194c9f] px-3 py-1.5 text-base font-extrabold text-white shadow-sm"
                                >
                                    {queueNo}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[#194c9f]/20 bg-white p-5 shadow-sm">
                        <p className="text-sm font-bold text-slate-500">ຄິວລໍຖ້າທັງໝົດ</p>
                        <div className="mt-2 flex items-end gap-2">
                            <p className="text-6xl font-black tracking-tight text-slate-900">{board?.total_waiting ?? 0}</p>
                            <Users className="mb-1 h-6 w-6 text-slate-500" />
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-[#194c9f]/20 bg-white p-4 shadow-sm">
                    <h2 className="text-lg font-extrabold text-slate-900">ລາຍການຄິວລໍຖ້າ (ມື້ນີ້)</h2>
                    {waitingRows.length === 0 ? (
                        <p className="mt-4 rounded-xl bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
                            ບໍ່ມີຄິວລໍຖ້າໃນຕອນນີ້
                        </p>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                                        <th className="px-3 py-2 font-bold">ລຳດັບ</th>
                                        <th className="px-3 py-2 font-bold">ຄິວ</th>
                                        <th className="px-3 py-2 font-bold">ຈຳນວນຄົນ</th>
                                        <th className="px-3 py-2 font-bold">ເຂົ້າຄິວເວລາ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {waitingRows.map((row) => (
                                        <tr key={row.queue_no} className="border-b border-slate-100 text-slate-800">
                                            <td className="px-3 py-2 font-semibold">{row.position}</td>
                                            <td className="px-3 py-2 text-lg font-black text-[#194c9f]">{row.queue_no}</td>
                                            <td className="px-3 py-2 font-semibold">{row.guest_count} ຄົນ</td>
                                            <td className="px-3 py-2">{formatClock(row.queued_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}

