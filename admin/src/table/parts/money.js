/** money.js — Rwandan francs, e.g. 12,500 RWF. */
export const rwf = (n) => `${Number(n || 0).toLocaleString('en-US')} RWF`;
