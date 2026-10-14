/**
 * preorder.js — the dishes a guest picks from the menu while booking a
 * table, written into the booking the same way from the website and the
 * phone: "Pre-order for the table: 2× Burger, 1× Coke (≈ 8,000 RWF)".
 * The restaurant reads it in the booking's notes on its dashboard.
 */
import { rwf } from './money';

export function preorderNote(items) {
  const list = items.filter((i) => i && (i.qty || 1) > 0);
  if (!list.length) return '';
  const total = list.reduce((s, i) => s + Number(i.price || 0) * (i.qty || 1), 0);
  return `Pre-order for the table: ${list.map((i) => `${i.qty || 1}× ${i.name}`).join(', ')} (≈ ${rwf(total)})`;
}

export const withPreorder = (notes, items) => [String(notes || '').trim(), preorderNote(items)].filter(Boolean).join('\n');
