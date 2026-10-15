/**
 * venueApi.js — a wedding venue's calls: its profile and reviews
 * (/clients/venue), and visit requests (the shared booking routes, which
 * keep a venue's sign-in to its own venue).
 */
import { apiFetch } from '../../api';

export const venueApi = {
  profile: () => apiFetch('/clients/venue'),
  save: (body) => apiFetch('/clients/venue', { method: 'PUT', body }),
  reviews: () => apiFetch('/clients/venue/reviews'),
  reply: (id, reply) => apiFetch(`/clients/venue/reviews/${id}/reply`, { method: 'POST', body: { reply } }),
  visits: () => apiFetch('/resto-bookings/admin'),
  setVisit: (id, status, reason) => apiFetch(`/resto-bookings/${id}/status`, { method: 'PUT', body: { status, reason } }),
};
