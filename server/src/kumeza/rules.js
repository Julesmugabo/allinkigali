/**
 * rules.js — the honesty rules from the Ku Meza spec, in one place:
 * unguessable table tokens and codes, rate limits, the distance check,
 * opening hours, and which station (kitchen or bar) cooks a dish.
 */
const crypto = require('crypto');

// Codes avoid letters people confuse (0/O, 1/I/L).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newQrToken = () => crypto.randomBytes(18).toString('base64url'); // 24 characters
function newShortCode() {
  let s = '';
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  return `${s.slice(0, 3)}-${s.slice(3)}`; // e.g. K7P-3F9
}
const cleanCode = (raw) => {
  const c = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return c.length === 6 ? `${c.slice(0, 3)}-${c.slice(3)}` : null;
};

// Simple fixed-window counters (single API process).
const hits = new Map();
function allow(key, limit, windowMs) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.start > windowMs) { hits.set(key, { start: now, n: 1 }); return true; }
  h.n += 1;
  return h.n <= limit;
}
setInterval(() => { const cut = Date.now() - 3_600_000; hits.forEach((h, k) => { if (h.start < cut) hits.delete(k); }); }, 600_000).unref();

const LIMITS = {
  code: [20, 10 * 60_000],          // typed table codes per IP
  orderPerDevice: [6, 10 * 60_000], // orders per phone
  orderPerTable: [25, 10 * 60_000], // orders per table
  requestPerDevice: [10, 10 * 60_000],
};
const limited = (kind, key) => !allow(`${kind}:${key}`, ...LIMITS[kind]);

function distanceM(a, b) {
  const rad = (x) => (x * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return Math.round(6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}
const FAR_M = 1000; // further than this from the place → refused

const isOpenNow = (place) => /^open/i.test(place?.open_status || 'Open now');

const BAR_WORDS = ['drink', 'juice', 'coffee', 'tea', 'smoothie', 'shake', 'beer', 'wine', 'cocktail', 'soda', 'water', 'beverage', 'latte', 'cappuccino', 'espresso', 'bar'];
const stationOf = (item) => (BAR_WORDS.some((w) => `${item.category} ${item.name}`.toLowerCase().includes(w)) ? 'bar' : 'kitchen');

const validDevice = (id) => /^[A-Za-z0-9_-]{16,64}$/.test(String(id || ''));

module.exports = { newQrToken, newShortCode, cleanCode, limited, distanceM, FAR_M, isOpenNow, stationOf, validDevice };
