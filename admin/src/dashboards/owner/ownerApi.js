/**
 * ownerApi.js — the owner dashboard's calls (/my-restaurant serves both
 * restaurants and coffee shops). An owner acts on their own place; platform
 * staff pass `place` ({ kind, id }) to act on any place.
 */
import { apiFetch } from '../../api';

export function makeOwnerApi(place) {
  const q = place ? `placeType=${place.kind === 'coffeeshop' ? 'coffee_shop' : 'restaurant'}&placeId=${encodeURIComponent(place.id)}` : '';
  const url = (p) => `/my-restaurant${p}${q ? `${p.includes('?') ? '&' : '?'}${q}` : ''}`;
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
