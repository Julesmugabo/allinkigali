/**
 * sections.js — the owner dashboard's sections (sidebar order), and the
 * sidebar sub-items for an owner's own "My Restaurant / My Coffee Shop".
 */
export function ownerSections(isCafe) {
  return [
    { key: 'overview', label: 'Overview' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'orders', label: 'Orders' },
    { key: 'menu', label: 'Menu' },
    { key: 'insights', label: 'Insights' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'finance', label: 'Earnings' },
    { key: 'reports', label: 'Reports' },
    ...(isCafe ? [{ key: 'intents', label: 'Visitor Intents' }] : []),
    { key: 'settings', label: 'Profile & Settings' },
  ];
}

export const ownerNav = (isCafe) => ownerSections(isCafe).map((s) => ({
  to: s.key === 'overview' ? '/my-place' : `/my-place/${s.key}`,
  label: s.label,
}));
