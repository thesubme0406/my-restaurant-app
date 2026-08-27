/** ສຽງແຈ້ງເຕືອນເມື່ອມີຄິວໃໝ່ຖືກເອີ້ນ (Web Audio API). */
export function playDingDong() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        const tone = (frequency, startOffset, duration) => {
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            const start = ctx.currentTime + startOffset;
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
            oscillator.start(start);
            oscillator.stop(start + duration + 0.05);
        };

        tone(880, 0, 0.35);
        tone(660, 0.4, 0.55);
        window.setTimeout(() => void ctx.close(), 1200);
    } catch {
        // TV browsers may block audio until user gesture — fail silently.
    }
}
