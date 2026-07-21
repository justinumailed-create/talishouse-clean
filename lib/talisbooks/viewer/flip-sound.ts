/**
 * Lightweight paper-flip SFX via Web Audio (no binary asset required).
 * Safe to call from user gestures and timers; failures are swallowed.
 */

let audioContext: AudioContext | null = null;
let lastPlayAt = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioCtx) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioCtx();
  }

  return audioContext;
}

function createPaperNoiseBuffer(ctx: AudioContext, durationSec = 0.14): AudioBuffer {
  const frameCount = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < frameCount; i += 1) {
    const t = i / frameCount;
    const envelope = Math.exp(-t * 16) * (1 - t * 0.85);
    // Soft paper rustle — filtered noise with a light crackle.
    const noise = Math.random() * 2 - 1;
    const crackle = Math.random() > 0.97 ? (Math.random() * 2 - 1) * 0.45 : 0;
    data[i] = (noise * 0.72 + crackle) * envelope;
  }

  return buffer;
}

/** Plays a short page-turn sound. Dedupes rapid double-fires. */
export function playViewerFlipSound(volume = 0.28): void {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - lastPlayAt < 180) {
    return;
  }
  lastPlayAt = now;

  try {
    const ctx = getAudioContext();
    if (!ctx) {
      return;
    }

    void ctx.resume().catch(() => undefined);

    const source = ctx.createBufferSource();
    source.buffer = createPaperNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1400;
    filter.Q.value = 0.65;

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 280;

    const gain = ctx.createGain();
    const start = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.05, Math.min(volume, 0.5)), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.13);

    source.connect(highpass);
    highpass.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(start);
    source.stop(start + 0.16);
  } catch {
    // Autoplay / AudioContext restrictions — ignore.
  }
}
