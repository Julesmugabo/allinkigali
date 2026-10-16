/**
 * directorApi.js — the director's calls.
 */
import { apiFetch } from '../../api';

export const directorApi = {
  team: () => apiFetch('/admin/admins'),
  assignRole: (body) => apiFetch('/admin/assign-role', { method: 'POST', body }),
  linkPlace: (email, kind, id) => apiFetch('/admin/link-restaurant', {
    method: 'POST', body: kind === 'coffeeshop' ? { email, coffeeShopId: id } : { email, restaurantId: id },
  }),
  places: () => apiFetch('/admin/restaurants-list'),
  applications: () => apiFetch('/pending-listings'),
  articles: () => apiFetch('/news/articles'),
  categories: () => apiFetch('/news/categories'),
  shops: () => apiFetch('/businesses'),
  verifyShop: (id) => apiFetch(`/businesses/${id}/approve`, { method: 'POST' }),
  unverifyShop: (id) => apiFetch(`/businesses/${id}`, { method: 'PATCH', body: { verified: false } }),
  deleteShop: (id) => apiFetch(`/businesses/${id}`, { method: 'DELETE' }),
  shopRequests: () => apiFetch('/bookings'),
  finance: () => apiFetch('/finance/dashboard/summary'),
};
