/**
 * constants.js — news dashboard vocabulary: sections (sidebar order),
 * article filters, labels, editor toolbar, author roles, status colours.
 * Mirrors the original in-app news admin.
 */
export const SECTIONS = [
  { key: 'newsroom', label: 'Newsroom' },
  { key: 'articles', label: 'Articles' },
  { key: 'write', label: 'New Article' },
  { key: 'categories', label: 'Categories' },
  { key: 'stories', label: 'Live Stories' },
  { key: 'app-ads', label: 'App ads' },
  { key: 'web-ads', label: 'Web ads' },
  { key: 'advertisers', label: 'Advertisers' },
  { key: 'authors', label: 'Authors' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
];

export const ARTICLE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'pending', label: 'Pending' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'archived', label: 'Archived' },
];

// Labels besides Breaking (which has its own flag). Same keys as the app.
export const EDITOR_LABELS = [
  { key: 'exclusive', label: 'Exclusive', color: '#BA7517' },
  { key: 'opinion', label: 'Opinion', color: '#533AB7' },
  { key: 'sponsored', label: 'Sponsored', color: '#5A6B7D' },
  { key: 'pick', label: "Editor's pick", color: '#185FA5' },
];

export const DESTINATIONS = [
  { key: 'draft', label: 'Save draft' },
  { key: 'pending', label: 'Submit for approval' },
  { key: 'published', label: 'Publish now' },
];

// Icons the reader app shows per category (same map as the in-app editor).
export const CATEGORY_ICONS = {
  world: 'earth', africa: 'map', politics: 'gavel',
  business: 'chart-line', sport: 'trophy', science: 'dna',
};

export const AUTHOR_ROLES = [
  { value: 'reporter', label: 'Reporter' },
  { value: 'editor', label: 'Editor' },
  { value: 'contributor', label: 'Contributor' },
];

export const STATUS_COLOR = {
  published: '#34D399',
  draft: '#94A3B8',
  pending: '#FBBF24',
  rejected: '#F87171',
  archived: '#64748B',
  scheduled: '#A78BFA',
  active: '#34D399',
  paused: '#FBBF24',
  ended: '#64748B',
  inactive: '#64748B',
  live: '#F87171',
};

export function slugify(label) {
  return String(label).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** The status an article shows as, folding archived/scheduled in. */
export function displayStatus(a) {
  if (a.isArchived) return 'archived';
  if (a.status === 'draft' && a.publishAt && new Date(a.publishAt) > new Date()) return 'scheduled';
  return a.status;
}
