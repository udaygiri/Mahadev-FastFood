/**
 * Web Audio API Notification Chime Synthesizer
 * Generates a clean, pleasant double-tone chime for incoming kitchen & driver orders.
 * Automatically handles browser Autoplay policies by unlocking context on user interaction.
 */

let globalAudioCtx = null;

const getAudioContext = () => {
  if (!globalAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      globalAudioCtx = new AudioContextClass();
    }
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
  return globalAudioCtx;
};

// 🔓 Auto-unlock AudioContext on first user click or touch anywhere on the page
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    getAudioContext();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };

  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
}

export const playOrderNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Ensure context is running
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // First Tone (C5 - 523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second Tone (G5 - 783.99 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.15);
    gain2.gain.setValueAtTime(0.45, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.15);
    osc2.stop(now + 0.65);
  } catch (err) {
    console.error('Failed to play audio notification:', err);
  }
};
