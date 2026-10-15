const API_URL = import.meta.env.VITE_API_URL;

// The Staff Portal and the client dashboard share this helper; each keeps its
// sign-in under its own key (they also live on different addresses).
let KEYS = { token: 'admin-token', user: 'admin-user' };
export function configureApi({ tokenKey, userKey }) {
  KEYS = { token: tokenKey || KEYS.token, user: userKey || KEYS.user };
}

// A support visit to a client's dashboard keeps its sign-in in that browser
// tab only (sessionStorage), so two clients open in two tabs never mix.
export function getToken() {
  return sessionStorage.getItem(KEYS.token) || localStorage.getItem(KEYS.token);
}

export function setToken(token, { thisTabOnly = false } = {}) {
  const store = thisTabOnly || sessionStorage.getItem(KEYS.token) ? sessionStorage : localStorage;
  if (token) store.setItem(KEYS.token, token);
  else store.removeItem(KEYS.token);
}

export function getUser() {
  const raw = localStorage.getItem(KEYS.user);
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user) {
  if (user) localStorage.setItem(KEYS.user, JSON.stringify(user));
  else localStorage.removeItem(KEYS.user);
}

export const apiUrl = (path) => `${API_URL}${path}`;

export async function apiFetch(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    if (data?.code) err.code = data.code;
    err.status = res.status;
    if (onAuthError && (res.status === 401 || data?.code === 'REVOKED')) onAuthError(err);
    throw err;
  }
  return data;
}

// The client dashboard signs people out when their sign-in is switched off or expires.
let onAuthError = null;
export function onSignedOut(fn) { onAuthError = fn; }

// Authenticated file download (CSV exports etc.) — a plain link can't carry
// the bearer token, so fetch the file and hand the browser a blob instead.
export async function apiDownload(path, filename) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Who can use the Staff Portal. Restaurants, coffee shops and wedding venues
// sign in to their own client dashboard instead.
export const STAFF_ROLES = ['director', 'news', 'sellers', 'finance'];
const CLIENT_ROLES = ['restaurant', 'coffeeshop', 'wedding'];
const CLIENTS_SITE = (import.meta.env.VITE_CLIENTS_URL || 'https://business.allinkigali.rw').replace(/^https?:\/\//, '').replace(/\/$/, '');

export async function login(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (CLIENT_ROLES.includes(data.user?.role)) throw new Error(`Businesses sign in at ${CLIENTS_SITE} — your dashboard moved there.`);
  if (!STAFF_ROLES.includes(data.user?.role)) throw new Error('This account has no admin role.');
  setToken(data.token);
  setUser(data.user);
  return data.user;
}

export function logout() {
  setToken(null);
  setUser(null);
}
