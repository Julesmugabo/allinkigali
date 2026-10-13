/**
 * nav.js — news sub-items for the portal sidebar (one per section).
 */
import { SECTIONS } from './constants';

export const newsNav = SECTIONS.map((s) => ({
  to: s.key === 'newsroom' ? '/news' : `/news/${s.key}`,
  label: s.label,
}));
