/**
 * device.js — this phone's random id, kept in the browser, so the restaurant
 * can tell the phones at a table apart (and remember a phone the waiter
 * already confirmed). Nothing personal is stored.
 */
const KEY = 'kumeza-device';

function fresh() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

let cached = null;
export function deviceId() {
  if (cached) return cached;
  try {
    cached = localStorage.getItem(KEY);
    if (!cached || !/^[A-Za-z0-9_-]{16,64}$/.test(cached)) {
      cached = fresh();
      localStorage.setItem(KEY, cached);
    }
  } catch {
    cached = cached || fresh(); // private mode: fine for this visit
  }
  return cached;
}

// Small helpers for things the page remembers (language, an unsent order).
export const remember = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } },
  drop(key) { try { localStorage.removeItem(key); } catch { /* private mode */ } },
};
