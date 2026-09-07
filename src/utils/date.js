/**
 * date.js — Gutunganya itariki n'igihe mu Kinyarwanda.
 * Date + relative-time helpers, all output in Kinyarwanda.
 */

export const WEEKDAYS = [
  'Ku cyumweru', // 0 Sunday
  'Kuwa mbere',
  'Kuwa kabiri',
  'Kuwa gatatu',
  'Kuwa kane',
  'Kuwa gatanu',
  'Kuwa gatandatu',
];

export const MONTHS = [
  'Mutarama',
  'Gashyantare',
  'Werurwe',
  'Mata',
  'Gicurasi',
  'Kamena',
  'Nyakanga',
  'Kanama',
  'Nzeri',
  'Ukwakira',
  'Ugushyingo',
  'Ukuboza',
];

/**
 * "Kuwa gatanu, 15 Gicurasi 2026"
 */
export function formatLongDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * "15 Gicurasi 2026, 14:30"
 */
export function formatDateTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

/**
 * Short relative time for news cards: "ubu", "45min", "2h", "3 iminsi".
 */
export function timeAgo(isoOrDate, now = new Date()) {
  const then = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  const seconds = Math.max(0, Math.floor((now - then) / 1000));

  if (seconds < 60) return 'ubu';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'ejo';
  if (days < 7) return `${days} iminsi`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} icyumweru`;

  return formatLongDate(then);
}

/**
 * Build an ISO string N hours in the past — used by the mock data so the feed
 * always looks fresh, whatever day you open it.
 */
export function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

export default { formatLongDate, formatDateTime, timeAgo, hoursAgo, minutesAgo };
