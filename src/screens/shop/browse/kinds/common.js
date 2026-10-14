/**
 * common.js — building blocks shared by the per-category browse settings
 * (resto.js, coffee.js, wedding.js).
 *
 * A filter group is { key, title, options: [{ key, label }], test(place, picked) }.
 * A chip is { key, label, test(place) }.
 */
import { isOpen } from '../../home/useDiscoverData';

const list = (v) => (Array.isArray(v) ? v : []);
export const optionsFrom = (keys, labels = {}) => keys.map((k) => ({ key: String(k), label: labels[k] || k }));

// Matches when the place has ANY of the picked values in `field`.
export const anyOf = (key, title, field, options) => ({
  key, title, options,
  test: (p, picked) => picked.some((v) => list(p[field]).map(String).includes(v)),
});

// Matches only when the place has ALL picked values (used for diets).
export const allOf = (key, title, field, options) => ({
  key, title, options,
  test: (p, picked) => picked.every((v) => list(p[field]).map(String).includes(v)),
});

export const priceGroup = (labels) => ({
  key: 'price', title: 'Price', options: optionsFrom(Object.keys(labels), labels),
  test: (p, picked) => picked.includes(String(p.price)),
});

export const ratingGroup = {
  key: 'rating', title: 'Rating', options: [{ key: '4.5', label: '4.5+ ★' }, { key: '4', label: '4.0+ ★' }, { key: '3.5', label: '3.5+ ★' }],
  test: (p, picked) => Number(p.rating || 0) >= Math.min(...picked.map(Number)),
};

export const openNowChip = { key: 'open', label: '🟢 Open now', test: isOpen };
export const deliversChip = { key: 'delivers', label: '🚚 Delivers', test: (p) => !!p.deliveryEnabled };
export const topRatedChip = { key: 'top', label: '⭐ Top rated', test: (p) => Number(p.rating || 0) >= 4.5 };
export const has = (field, values) => (p) => list(p[field]).some((v) => values.includes(v));
