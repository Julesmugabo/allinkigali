/**
 * money.js — prices as people read them: 3500 → "3,500 RWF".
 */
export const rwf = (n) => `${Number(n || 0).toLocaleString()} RWF`;
