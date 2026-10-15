/**
 * teamApi.js — Team calls: the place's staff (phone + PIN sign-ins) and its
 * kitchen/bar tablets.
 */
import { apiFetch } from '../../api';

const base = '/clients/team';

export const teamApi = {
  members: () => apiFetch(`${base}/members`),
  addMember: (body) => apiFetch(`${base}/members`, { method: 'POST', body }), // { name, phone, role, pin, sectionId }
  updateMember: (id, body) => apiFetch(`${base}/members/${id}`, { method: 'PATCH', body }), // name, role, sectionId, active, pin
  devices: () => apiFetch(`${base}/devices`),
  addDevice: (body) => apiFetch(`${base}/devices`, { method: 'POST', body }), // { label, role } → { id, label, role, code }
  newDeviceCode: (id) => apiFetch(`${base}/devices/${id}/code`, { method: 'POST', body: {} }),
  removeDevice: (id) => apiFetch(`${base}/devices/${id}`, { method: 'DELETE' }),
};

// A 4-digit PIN to suggest (the owner can type their own).
export function randomPin() {
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return String(1000 + (n[0] % 9000));
}
