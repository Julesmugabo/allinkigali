/**
 * apiClient.js — the one connection every future data/auth call goes
 * through, talking to our own Express + Postgres backend (server/) instead
 * of Supabase. Same role in the app as supabaseClient.js used to play —
 * mirrors how every screen already only ever talks to a Context, never a
 * raw data source directly.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationsChanged } from './notificationsBus';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = 'allinkigali-auth-token';

if (!API_URL) {
  console.warn('apiClient: EXPO_PUBLIC_API_URL is not set in .env — API calls will fail until it is.');
}

let cachedToken = null;

export async function getToken() {
  if (cachedToken !== null) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function setToken(token) {
  cachedToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

/**
 * A small fetch wrapper: attaches the bearer token when signed in, always
 * sends/expects JSON, and throws a real Error (with the server's message
 * when there is one) on a non-2xx response so callers can just try/catch.
 */
export async function apiFetch(path, { method = 'GET', body } = {}) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const err = new Error(data?.error || `Request failed (${response.status})`);
    err.code = data?.code;
    err.status = response.status;
    throw err;
  }
  // Anything the person sent may have added a notification for them (booking
  // sent, order sent…): the bells re-check. Article view counts don't.
  if (method !== 'GET' && !NO_NOTICE.test(path)) notificationsChanged();
  return data;
}

const NO_NOTICE = /\/view$|push-token/;
