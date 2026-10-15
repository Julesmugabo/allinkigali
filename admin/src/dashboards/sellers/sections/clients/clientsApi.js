/**
 * clientsApi.js — Sales Partners › Clients: every client place (restaurants,
 * coffee shops, wedding venues) with its owner logins and activity, giving a
 * place its owner login, a new temporary password, and the support log.
 */
import { apiFetch } from '../../../../api';

export const clientsApi = {
  places: () => apiFetch('/clients/admin/places'),
  onboard: (body) => apiFetch('/clients/admin/onboard', { method: 'POST', body }), // { placeType, placeId, firstName, lastName, email, phone }
  resetPassword: (memberId) => apiFetch(`/clients/admin/members/${memberId}/reset-password`, { method: 'POST', body: {} }),
  removeOwner: (memberId) => apiFetch(`/clients/admin/members/${memberId}/remove`, { method: 'POST', body: {} }),
  activity: () => apiFetch('/clients/admin/activity'),
};

export const KIND = { restaurant: 'Restaurant', coffeeshop: 'Coffee shop', wedding: 'Wedding venue' };
