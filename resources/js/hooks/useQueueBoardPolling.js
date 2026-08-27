import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { playDingDong } from '@/utils/queueBoardAudio';
import { destroyQueueBoardEcho, getQueueBoardEcho, initQueueBoardEcho } from '@/utils/queueBoardEcho';

const POLL_MS = 8_000;

function callingSignature(board) {
    const calling = board?.now_calling;
    if (!calling?.id) {
        return null;
    }
    return `${calling.id}:${calling.called_at ?? ''}`;
}

function applyBoardUpdate(nextBoard, lastSigRef, setBoard) {
    const nextSig = callingSignature(nextBoard);
    if (nextSig !== null && nextSig !== lastSigRef.current) {
        playDingDong();
    }
    lastSigRef.current = nextSig;
    setBoard(nextBoard ?? {});
}

/**
 * Poll + optional Reverb websocket for the public queue board.
 * @param {Record<string, unknown>} initialBoard
 * @param {{ enabled?: boolean, reverb?: Record<string, unknown> } | null | undefined} broadcastConfig
 */
export function useQueueBoardPolling(initialBoard, broadcastConfig) {
    const [board, setBoard] = useState(initialBoard ?? {});
    const [liveNow, setLiveNow] = useState(() => new Date());
    const lastCallingSigRef = useRef(callingSignature(initialBoard));

    const refreshBoard = useCallback(async () => {
        try {
            const res = await axios.get(route('queue-board.data'));
            const nextBoard = res?.data?.board ?? {};
            applyBoardUpdate(nextBoard, lastCallingSigRef, setBoard);
        } catch {
            // Keep last good snapshot on transient network errors.
        }
    }, []);

    useEffect(() => {
        const pollTimer = window.setInterval(() => {
            void refreshBoard();
        }, POLL_MS);
        return () => window.clearInterval(pollTimer);
    }, [refreshBoard]);

    useEffect(() => {
        const clockTimer = window.setInterval(() => setLiveNow(new Date()), 1000);
        return () => window.clearInterval(clockTimer);
    }, []);

    useEffect(() => {
        if (!broadcastConfig?.enabled || !broadcastConfig?.reverb?.key) {
            return undefined;
        }

        const echo = initQueueBoardEcho(broadcastConfig.reverb);
        if (!echo) {
            return undefined;
        }

        const channel = echo.channel('queue-board');
        channel.listen('.QueueBoardUpdated', (payload) => {
            const nextBoard = payload?.board ?? {};
            applyBoardUpdate(nextBoard, lastCallingSigRef, setBoard);
        });

        return () => {
            channel.stopListening('.QueueBoardUpdated');
            destroyQueueBoardEcho();
        };
    }, [broadcastConfig?.enabled, broadcastConfig?.reverb?.key]);

    return { board, liveNow, refreshBoard };
}
