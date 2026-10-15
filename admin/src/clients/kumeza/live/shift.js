/**
 * shift.js — what a service screen needs once someone taps "Start shift":
 * sound (browsers only allow it after a tap) and keeping the screen awake.
 * chime() plays a short alert: 'urgent' for calls, bills and new guests.
 */
let ctx = null;
let lock = null;

async function keepAwake() {
  try { lock = await navigator.wakeLock?.request('screen'); } catch { lock = null; }
}

// The screen lock is dropped when the tab is hidden; take it again on return.
function onVisible() {
  if (document.visibilityState === 'visible' && ctx && (!lock || lock.released)) keepAwake();
}

export async function startShift() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (AudioCtx) {
    ctx = ctx || new AudioCtx();
    await ctx.resume().catch(() => {});
  }
  await keepAwake();
  document.removeEventListener('visibilitychange', onVisible);
  document.addEventListener('visibilitychange', onVisible);
  chime('soft');
}

export const shiftStarted = () => !!ctx && ctx.state === 'running';

const NOTES = { soft: [660], normal: [784, 1047], urgent: [988, 1319, 988, 1319] };

export function chime(kind = 'normal') {
  if (!ctx || ctx.state !== 'running') return;
  (NOTES[kind] || NOTES.normal).forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t0 = ctx.currentTime + i * 0.2;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.5, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.2);
  });
}
