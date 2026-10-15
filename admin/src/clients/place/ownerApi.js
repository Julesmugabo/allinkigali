/**
 * ownerApi.js — the place pages' calls. /my-restaurant serves restaurants and
 * coffee shops alike; the sign-in (owner, manager or allinkigali support)
 * decides which place.
 */
import { apiFetch } from '../../api';

export function makeOwnerApi() {
  const url = (p) => `/my-restaurant${p}`;
  const send = (method, p, body) => apiFetch(url(p), { method, body });
  return {
    profile: () => apiFetch(url('')),
    saveProfile: (body) => send('PUT', '', body),
    setBusy: (busy) => send('PUT', '/busy', { busy }),
    bookings: () => apiFetch(url('/bookings')),
    setBookingStatus: (id, status, reason) => send('PUT', `/bookings/${id}/status`, { status, reason }),
    menu: () => apiFetch(url('/menu')),
    addMenuItem: (body) => send('POST', '/menu', body),
    updateMenuItem: (id, body) => send('PUT', `/menu/${id}`, body),
    deleteMenuItem: (id) => send('DELETE', `/menu/${id}`),
    orders: () => apiFetch(url('/orders')),
    setOrderStatus: (id, status) => send('PUT', `/orders/${id}/status`, { status }),
    reviews: () => apiFetch(url('/reviews')),
    reply: (id, reply) => send('POST', `/reviews/${id}/reply`, { reply }),
  };
}
