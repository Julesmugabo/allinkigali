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
