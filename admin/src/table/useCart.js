/**
 * useCart.js — what the guest is about to order at this table, with a note
 * per dish. Kept on the phone, so a refresh doesn't lose it; emptied once
 * the order is sent.
 */
import { useEffect, useState } from 'react';
import { remember } from './device';

const MAX_QTY = 20;

export default function useCart(token) {
  const key = `kumeza-cart-${token}`;
  const [lines, setLines] = useState(() => remember.get(key, [])); // [{ id, qty, notes }]
  useEffect(() => { remember.set(key, lines); }, [key, lines]);

  const change = (id, by) => setLines((ls) => {
    const found = ls.find((l) => l.id === id);
    if (!found) return by > 0 ? [...ls, { id, qty: 1, notes: '' }] : ls;
    const qty = Math.min(found.qty + by, MAX_QTY);
    return qty > 0 ? ls.map((l) => (l.id === id ? { ...l, qty } : l)) : ls.filter((l) => l.id !== id);
  });

  return {
    lines,
    count: lines.reduce((n, l) => n + l.qty, 0),
    qtyOf: (id) => lines.find((l) => l.id === id)?.qty || 0,
    add: (id) => change(id, 1),
    remove: (id) => change(id, -1),
    setNotes: (id, notes) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, notes: notes.slice(0, 200) } : l))),
    keepOnly: (ids) => setLines((ls) => ls.filter((l) => ids.has(l.id))), // dishes no longer on the menu drop out
    clear: () => setLines([]),
  };
}
