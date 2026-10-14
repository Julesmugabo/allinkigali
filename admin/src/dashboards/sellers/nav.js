/**
 * nav.js — the Sales Partners dashboard's sections and sidebar sub-items.
 */
export const SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'applications', label: 'Applications' },
  { key: 'clients', label: 'Clients' },
  { key: 'deliveries', label: 'Deliveries' },
  { key: 'visits', label: 'Wedding visits' },
  { key: 'fliers', label: 'Shop Fliers' },
];

export const sellersNav = SECTIONS.map((s) => ({ to: s.key === 'overview' ? '/sellers' : `/sellers/${s.key}`, label: s.label }));
