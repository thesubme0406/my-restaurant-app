import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echoInstance = null;

/**
 * @param {{ key?: string, host?: string, port?: number|string, scheme?: string } | null | undefined} config
 */
export function initQueueBoardEcho(config) {
    if (!config?.key || echoInstance) {
        return echoInstance;
    }

    window.Pusher = Pusher;

    const scheme = config.scheme ?? 'http';
    const port = Number(config.port ?? (scheme === 'https' ? 443 : 8080));
    const useTls = scheme === 'https';

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key: config.key,
        wsHost: config.host ?? window.location.hostname,
        wsPort: useTls ? port : port,
        wssPort: port,
        forceTLS: useTls,
        enabledTransports: ['ws', 'wss'],
    });

    return echoInstance;
}

export function getQueueBoardEcho() {
    return echoInstance;
}

export function destroyQueueBoardEcho() {
    if (echoInstance) {
        echoInstance.disconnect();
        echoInstance = null;
    }
}
