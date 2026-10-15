/**
 * nav.js — the Sales Partners dashboard's sections and sidebar sub-items.
 * Sections with a `group` sit nested under it in the sidebar
 * (Clients › All clients / Onboard a client / Support activity).
 */
export const SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'applications', label: 'Applications' },
  { key: 'clients', label: 'All clients', group: 'Clients' },
  { key: 'onboard', label: 'Onboard a client', group: 'Clients' },
  { key: 'client-activity', label: 'Support activity', group: 'Clients' },
  { key: 'deliveries', label: 'Deliveries' },
  { key: 'visits', label: 'Wedding visits' },
  { key: 'fliers', label: 'Shop Fliers' },
];

const link = (s) => ({ to: s.key === 'overview' ? '/sellers' : `/sellers/${s.key}`, label: s.label });

export const sellersNav = SECTIONS.reduce((nav, s) => {
  if (!s.group) return [...nav, link(s)];
  const group = nav.find((x) => x.children && x.label === s.group);
  if (group) { group.children.push(link(s)); return nav; }
  return [...nav, { label: s.group, children: [link(s)] }];
}, []);
