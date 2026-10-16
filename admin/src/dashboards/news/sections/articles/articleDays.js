/**
 * articleDays.js — which calendar day an article belongs to, and the day
 * names the Articles day picker shows. Published articles count on the day
 * they went live, scheduled ones on the day they will, everything else
 * (drafts, pending, rejected) on the day it was written.
 */
import { displayStatus } from '../../constants';

const pad = (n) => String(n).padStart(2, '0');

export const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const dateOf = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
export const todayKey = () => keyOf(new Date());
export const shiftKey = (key, days) => { const d = dateOf(key); d.setDate(d.getDate() + days); return keyOf(d); };
export const isDayKey = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

export function articleTime(a) {
  if (a.status === 'published') return a.publishedAt;
  if (displayStatus(a) === 'scheduled') return a.publishAt;
  return a.createdAt || a.publishedAt;
}

export const articleDay = (a) => { const at = articleTime(a); return at ? keyOf(new Date(at)) : null; };

/** "Today", "Yesterday", "Wed 14 Oct" — or with long, "Today · Friday 16 October 2026". */
export function dayLabel(key, { long } = {}) {
  const today = todayKey();
  const name = key === today ? 'Today' : key === shiftKey(today, -1) ? 'Yesterday' : key === shiftKey(today, 1) ? 'Tomorrow' : null;
  const opts = long ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } : { weekday: 'short', day: 'numeric', month: 'short' };
  const date = dateOf(key).toLocaleDateString('en-GB', opts);
  if (long) return name ? `${name} · ${date}` : date;
  return name || date;
}

export const clock = (d) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
