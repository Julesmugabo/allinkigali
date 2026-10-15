/**
 * api.js — the guest page's calls to Ku Meza. Every call carries this
 * phone's random id (device.js); errors carry a short code the page turns
 * into words in the guest's language.
 */
import { deviceId } from './device';

const API = import.meta.env.VITE_API_URL;

async function call(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${API}/kumeza${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Device-Id': deviceId() },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const e = new Error('offline');
    e.code = 'OFFLINE';
    throw e;
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = new Error(data?.error || 'Something went wrong.');
    e.code = data?.code || 'FAILED';
    throw e;
  }
  return data;
}

export const tableApi = {
  byCode: (code) => call('/code', { method: 'POST', body: { code } }),
  table: (token) => call(`/t/${token}`),
  tab: (token) => call(`/t/${token}/tab`),
  order: (token, items, where) => call(`/t/${token}/orders`, { method: 'POST', body: { items, ...where } }),
  cancel: (token, orderId) => call(`/t/${token}/orders/${orderId}/cancel`, { method: 'POST' }),
  request: (token, type) => call(`/t/${token}/requests`, { method: 'POST', body: { type } }), // call_waiter | bill
};

// Where the phone is, if the guest allows it — only to check they're at the
// place. Never blocks ordering: no answer in 5 seconds, or a "no", sends without.
export function whereAmI() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve({}); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve({}),
      { timeout: 5000, maximumAge: 5 * 60 * 1000, enableHighAccuracy: false },
    );
  });
}
