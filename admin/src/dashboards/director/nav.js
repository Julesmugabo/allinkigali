/**
 * nav.js — the director's own sections and sidebar sub-items.
 */
export const SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'marketplace', label: 'Marketplace Shops' },
  { key: 'team', label: 'Team & Access' },
];

export const directorNav = SECTIONS.map((s) => ({ to: s.key === 'overview' ? '/overview' : `/overview/${s.key}`, label: s.label }));
