/**
 * kumezaApi.js — Ku Meza calls from the client dashboard: the waiter board,
 * the kitchen/bar screen, the live-stream ticket, and tables & QR setup.
 * The sign-in decides the place.
 */
import { apiFetch } from '../../api';

const base = '/clients/kumeza';
const post = (p, body = {}) => apiFetch(`${base}${p}`, { method: 'POST', body });
const patch = (p, body) => apiFetch(`${base}${p}`, { method: 'PATCH', body });

export const kumezaApi = {
  // During service
  board: () => apiFetch(`${base}/board`),
  kitchen: () => apiFetch(`${base}/kitchen`),
  order: (id, action) => post(`/orders/${id}/${action}`), // confirm | reject | accept | preparing | served | cancel
  ready: (id, station) => post(`/orders/${id}/ready`, { station }),
  handleRequest: (id) => post(`/requests/${id}/handle`),
  closeTable: (sessionId, paymentMethod) => post(`/sessions/${sessionId}/close`, { paymentMethod }),
  streamTicket: () => post('/stream-ticket'),

  // Tables & QR codes
  setup: () => apiFetch(`${base}/setup`),
  addSection: (name) => post('/sections', { name }),
  renameSection: (id, name) => patch(`/sections/${id}`, { name }),
  deleteSection: (id) => apiFetch(`${base}/sections/${id}`, { method: 'DELETE' }),
  addTables: (body) => post('/tables', body), // { label, sectionId } or { count, sectionId }
  updateTable: (id, body) => patch(`/tables/${id}`, body),
  rotateTable: (id) => post(`/tables/${id}/rotate`),
};
