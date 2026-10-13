const API_URL = import.meta.env.VITE_API_URL;

export function getToken() {
  return localStorage.getItem('admin-token');
}

export function setToken(token) {
  if (token) localStorage.setItem('admin-token', token);
  else localStorage.removeItem('admin-token');
}

export function getUser() {
  const raw = localStorage.getItem('admin-user');
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user) {
  if (user) localStorage.setItem('admin-user', JSON.stringify(user));
  else localStorage.removeItem('admin-user');
}

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
    throw err;
  }
  return data;
}

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

export async function login(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (!data.user?.role) throw new Error('This account has no admin role.');
  setToken(data.token);
  setUser(data.user);
  return data.user;
}

export function logout() {
  setToken(null);
  setUser(null);
}
