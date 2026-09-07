/**
 * format.js — Gutunganya amafaranga n'inyandiko ngufi.
 * Currency + small string helpers.
 */

/**
 * 12500 -> "12,500 RWF"
 */
export function formatPrice(amount, currency = 'RWF') {
  const rounded = Math.round(Number(amount) || 0);
  const withSeparators = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${withSeparators} ${currency}`;
}

/**
 * Initials for the avatar circle: "Jean", "Habimana" -> "JH"
 */
export function initials(firstName = '', lastName = '') {
  const a = (firstName || '').trim().charAt(0);
  const b = (lastName || '').trim().charAt(0);
  return `${a}${b}`.toUpperCase() || '?';
}

export function fullName(user) {
  if (!user) return '';
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
}

/**
 * Loose, accent-insensitive search matching.
 */
export function normalise(value = '') {
  return value
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * "ORD-8F3K2A" — readable order reference.
 */
export function makeOrderRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ORD-${out}`;
}

export function isValidEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function isValidPhone(value = '') {
  // Rwandan mobile numbers: 07xxxxxxxx or +2507xxxxxxxx
  const cleaned = value.replace(/[\s-]/g, '');
  return /^(\+?250)?0?7[0-9]{8}$/.test(cleaned);
}

export default { formatPrice, initials, fullName, normalise, makeOrderRef };
