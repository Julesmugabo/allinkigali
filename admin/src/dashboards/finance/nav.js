/**
 * nav.js — finance's sub-items for the portal sidebar (one per section).
 */
import { SECTIONS } from './constants';

export const financeNav = SECTIONS.map((s) => ({
  to: s.key === 'overview' ? '/finance' : `/finance/${s.key}`,
  label: s.label,
}));
