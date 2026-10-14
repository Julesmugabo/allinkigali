/**
 * placesApi.js — platform-level calls for restaurants and coffee shops.
 * `type` is an entry of PLACE_TYPES.
 */
import { apiFetch } from '../../api';

export const placesApi = {
  // all listings of both kinds, active or not (staff only)
  list: () => apiFetch('/admin/restaurants-list'),
  // what readers see (active listings, with tags and photos)
  publicList: (type) => apiFetch(type.api),
  get: (type, id) => apiFetch(`${type.api}/${id}`),
  create: (type, body) => apiFetch(type.api, { method: 'POST', body }),
  update: (type, id, body) => apiFetch(`${type.api}/${id}`, { method: 'PUT', body }),
  remove: (type, id) => apiFetch(`${type.api}/${id}`, { method: 'DELETE' }),
  quick: (type, id, body) => apiFetch(`${type.admin}/${id}`, { method: 'PATCH', body }),

  bookings: (type) => apiFetch(`/resto-bookings/admin?type=${type.bookingType}`),
  setBookingStatus: (id, status) => apiFetch(`/resto-bookings/${id}/status`, { method: 'PUT', body: { status } }),

  menu: (restaurantId) => apiFetch(`/restaurant-menu/${restaurantId}`),
  createMenuItem: (body) => apiFetch('/restaurant-menu', { method: 'POST', body }),
  updateMenuItem: (id, body) => apiFetch(`/restaurant-menu/${id}`, { method: 'PUT', body }),
  deleteMenuItem: (id) => apiFetch(`/restaurant-menu/${id}`, { method: 'DELETE' }),
};
