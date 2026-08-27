import { Head } from '@inertiajs/react';
import CallingHistoryPanel from './QueueBoard/CallingHistoryPanel';
import NowCallingPanel from './QueueBoard/NowCallingPanel';
import QueueBoardHeader from './QueueBoard/QueueBoardHeader';
import { formatBoardClock } from './QueueBoard/queueBoardFormat';
import UpNextPanel from './QueueBoard/UpNextPanel';
import { useQueueBoardPolling } from '@/hooks/useQueueBoardPolling';

export default function QueueBoard({ board: initialBoard, broadcast = null }) {
    const { board, liveNow } = useQueueBoardPolling(initialBoard, broadcast);
    const nowCalling = board?.now_calling ?? null;
    const callingHistory = Array.isArray(board?.calling_history) ? board.calling_history : [];
    const waitingRows = Array.isArray(board?.waiting_rows) ? board.waiting_rows : [];
    const liveLabel = broadcast?.enabled ? 'ອັບເດດແບບ real-time (WebSocket)' : 'ອັບເດດອັດຕະໂນມັດທຸກໆ 8 ວິນາທີ';

    return (
        <>
            <Head title="ບອດຄິວໜ້າຮ້ານ">
                <style>{`
                    @keyframes queueBoardPulse {
                        0% { transform: scale(0.88); opacity: 0.35; }
                        45% { transform: scale(1.06); opacity: 1; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    .queue-board-hero {
                        animation: queueBoardPulse 0.85s ease-out;
                    }
                `}</style>
            </Head>

            <div className="customer-responsive-shell flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-[#071428] font-lao text-white">
                <QueueBoardHeader boardDate={board?.date} liveNow={liveNow} formatClock={formatBoardClock} />

                <main className="grid w-full min-w-0 max-w-full flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-2 md:gap-6 md:p-8 lg:grid-cols-5 lg:gap-[2vh] lg:p-12">
                    <NowCallingPanel nowCalling={nowCalling} nowServing={board?.now_serving} />
                    <CallingHistoryPanel callingHistory={callingHistory} />
                    <UpNextPanel waitingRows={waitingRows} />
                </main>

                <footer className="fluid-body shrink-0 break-words border-t border-white/10 px-4 py-3 text-center text-white/40 md:px-8 lg:px-12">
                    {liveLabel}
                </footer>
            </div>
        </>
    );
}
