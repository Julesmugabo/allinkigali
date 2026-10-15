/**
 * format.js — small display helpers for the client dashboard
 * (Kigali time, Rwandan francs, "12 min ago").
 */
export const rwf = (n) => `${Number(n || 0).toLocaleString('en-US')} RWF`;

export const clock = (d) => (d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' }) : '');

export const day = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'Africa/Kigali' }) : '');

export function minutesSince(d, now = Date.now()) {
  return d ? Math.max(0, Math.floor((now - new Date(d).getTime()) / 60000)) : 0;
}

export function ago(d, now = Date.now()) {
  const m = minutesSince(d, now);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} min`;
}
