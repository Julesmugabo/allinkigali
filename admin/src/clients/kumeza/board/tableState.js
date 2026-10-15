/**
 * tableState.js — how the waiter board reads a table: one state per table
 * (most urgent first) for the card's colour, and the labels and colours of
 * an order's status.
 */
export const STATE = {
  confirm: { label: 'New guest — confirm', color: '#FBBF24', urgent: true },
  call: { label: 'Calling a waiter', color: '#F87171', urgent: true },
  bill: { label: 'Wants the bill', color: '#F472B6', urgent: true },
  new: { label: 'New order — accept', color: '#38BDF8', urgent: true },
  ready: { label: 'Ready to serve', color: '#4ADE80', urgent: true },
  preparing: { label: 'Preparing', color: '#FB923C' },
  served: { label: 'Served', color: '#A78BFA' },
  free: { label: 'Free', color: '#64748B' },
};

export const ORDER = {
  needs_confirm: { label: 'Waiting for you to confirm the guest', color: '#FBBF24' },
  placed: { label: 'New', color: '#38BDF8' },
  accepted: { label: 'Accepted', color: '#A5B4FC' },
  preparing: { label: 'Preparing', color: '#FB923C' },
  ready: { label: 'Ready to serve', color: '#4ADE80' },
  served: { label: 'Served', color: '#94A3B8' },
  cancelled: { label: 'Cancelled', color: '#64748B' },
  rejected: { label: 'Not confirmed', color: '#64748B' },
};

export const liveOrders = (session) => (session?.orders || []).filter((o) => !['cancelled', 'rejected'].includes(o.status));

// Part of an order is ready (e.g. the drinks) while the rest is cooking.
export const partReady = (o) => o.readyStations?.length > 0 && !['ready', 'served'].includes(o.status);

export function tableState(table) {
  const s = table.session;
  if (!s) return 'free';
  const orders = liveOrders(s);
  if (orders.some((o) => o.status === 'needs_confirm')) return 'confirm';
  if (s.requests.some((r) => r.type === 'call_waiter')) return 'call';
  if (s.requests.some((r) => r.type === 'bill')) return 'bill';
  if (orders.some((o) => o.status === 'placed')) return 'new';
  if (orders.some((o) => o.status === 'ready' || partReady(o))) return 'ready';
  if (orders.some((o) => ['accepted', 'preparing'].includes(o.status))) return 'preparing';
  return 'served';
}
