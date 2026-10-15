/**
 * tableState.js — how the waiter board reads a table: one state per table
 * (most urgent first) for the card's colour, and the labels and colours of
 * an order's status. Lime = go (new order, ready), gold = needs you (new
 * guest, bill), red = a guest is calling; the words stay black.
 */
import { LIME, GOLD, RED } from '../../look';

const SAND = '#CDBF98';
const GREY = '#B7B0A2';

export const STATE = {
  confirm: { label: 'New guest — confirm', color: GOLD, urgent: true },
  call: { label: 'Calling a waiter', color: RED, urgent: true },
  bill: { label: 'Wants the bill', color: GOLD, urgent: true },
  new: { label: 'New order — accept', color: LIME, urgent: true },
  ready: { label: 'Ready to serve', color: LIME, urgent: true },
  preparing: { label: 'Preparing', color: SAND },
  served: { label: 'Served', color: GREY },
  free: { label: 'Free', color: GREY },
};

export const ORDER = {
  needs_confirm: { label: 'Waiting for you to confirm the guest', color: GOLD },
  placed: { label: 'New', color: LIME },
  accepted: { label: 'Accepted', color: SAND },
  preparing: { label: 'Preparing', color: SAND },
  ready: { label: 'Ready to serve', color: LIME },
  served: { label: 'Served', color: GREY },
  cancelled: { label: 'Cancelled', color: GREY },
  rejected: { label: 'Not confirmed', color: GREY },
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
