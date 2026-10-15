/**
 * session.js — signing in and out of the client dashboard. The token itself
 * decides the place and the role; /clients/auth/me describes it.
 */
import { apiFetch, getToken, setToken } from '../api';

const post = (path, body) => apiFetch(path, { method: 'POST', body });

export const session = {
  hasToken: () => !!getToken(),
  me: () => apiFetch('/clients/auth/me'),
  async ownerLogin(email, password) { const d = await post('/clients/auth/login', { email, password }); setToken(d.token); return d; },
  async staffLogin(phone, pin, memberId) {
    const d = await post('/clients/auth/staff-login', { phone, pin, memberId });
    if (d.token) setToken(d.token);
    return d; // { token } or { choose: [...] } when the PIN works at several places
  },
  async connectDevice(code) { const d = await post('/clients/auth/device', { code }); setToken(d.token); return d; },
  async supportExchange(code) { const d = await post('/clients/support/exchange', { code }); setToken(d.token, { thisTabOnly: true }); return d; },
  async makeChanges() { const d = await post('/clients/support/elevate', {}); setToken(d.token); return d; },
  async switchPlace(memberId) { const d = await post('/clients/auth/switch', { memberId }); setToken(d.token); return d; },
  signOut: () => setToken(null),
};

export const ROLE_LABEL = { owner: 'Owner', manager: 'Manager', waiter: 'Waiter', kitchen: 'Kitchen', cashier: 'Cashier' };
export const PLACE_LABEL = { restaurant: 'Restaurant', coffeeshop: 'Coffee shop', wedding: 'Wedding venue' };
