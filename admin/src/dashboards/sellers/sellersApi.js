/**
 * sellersApi.js — the Sales Partners admin's calls.
 */
import { apiFetch } from '../../api';

export const sellersApi = {
  places: () => apiFetch('/admin/restaurants-list'),
  quick: (kind, id, body) => apiFetch(`/admin/${kind === 'restaurant' ? 'restaurants' : 'coffee-shops'}/${id}`, { method: 'PATCH', body }),

  applications: () => apiFetch('/pending-listings'),
  approve: (id) => apiFetch(`/pending-listings/${id}/approve`, { method: 'POST' }),
  decline: (id, reason) => apiFetch(`/pending-listings/${id}/decline`, { method: 'POST', body: { reason } }),

  weddingVisits: () => apiFetch('/resto-bookings/admin?type=wedding'),
  setBookingStatus: (id, status, reason) => apiFetch(`/resto-bookings/${id}/status`, { method: 'PUT', body: { status, reason } }),

  fliers: () => apiFetch('/fliers'),
  businesses: () => apiFetch('/businesses'),
  createFlier: (body) => apiFetch('/fliers', { method: 'POST', body }),
  updateFlier: (id, body) => apiFetch(`/fliers/${id}`, { method: 'PATCH', body }),
  deleteFlier: (id) => apiFetch(`/fliers/${id}`, { method: 'DELETE' }),
};
