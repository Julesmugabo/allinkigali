/**
 * browseLogic.js — pure helpers for the browse page: reading/writing the
 * choices in the web address, filtering, sorting and the "nothing matches"
 * sentence. No React here, so each piece is easy to reason about.
 */
import { isOpen } from '../home/useDiscoverData';
import { matchesLocation, locationLabel } from '../../../utils/placeLocation';

export const SORTS = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'rating', label: 'Top rated' },
  { key: 'price', label: 'Price: low to high' },
  { key: 'near', label: 'Nearest' },
];

const split = (v) => (v ? String(v).split(',').filter(Boolean) : []);

// Route params (the ?query in the address) → browse state.
export function stateFromParams(params = {}, groups) {
  const picked = {};
  groups.forEach((g) => { const v = split(params[g.key]); if (v.length) picked[g.key] = v; });
  const loc = { province: params.prov || null, district: params.dist || null, sector: params.sect || null };
  return { q: params.q || '', picks: split(params.pick), groups: picked, loc, sort: params.sort || 'recommended' };
}

// Browse state → route params; empty values are dropped (undefined clears them).
export function paramsFromState(state, groups) {
  const out = {
    q: state.q || undefined, pick: state.picks.join(',') || undefined, sort: state.sort !== 'recommended' ? state.sort : undefined,
    prov: state.loc.province || undefined, dist: state.loc.district || undefined, sect: state.loc.sector || undefined,
  };
  groups.forEach((g) => { out[g.key] = (state.groups[g.key] || []).join(',') || undefined; });
  return out;
}

function distanceKm(a, b) {
  const rad = (x) => (x * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Filters and sorts in one pass over the list. `index` maps id → lowercase
// search text, built once per list, so typing stays cheap.
export function applyBrowse({ places, index, state, chips, groups, here }) {
  const q = state.q.trim().toLowerCase();
  const activeChips = chips.filter((c) => state.picks.includes(c.key));
  const activeGroups = groups.filter((g) => state.groups[g.key]?.length);
  const out = [];
  for (const p of places) {
    if (q && !index.get(p.id)?.includes(q)) continue;
    if (!activeChips.every((c) => c.test(p))) continue;
    if (!activeGroups.every((g) => g.test(p, state.groups[g.key]))) continue;
    if (!matchesLocation(p, state.loc)) continue;
    const km = here && p.lat && p.lng ? distanceKm(here, { lat: Number(p.lat), lng: Number(p.lng) }) : null;
    out.push(km == null ? p : { ...p, distanceKm: km });
  }
  const rating = (p) => Number(p.rating || 0);
  const by = {
    recommended: (a, b) => (isOpen(b) - isOpen(a)) || rating(b) - rating(a),
    rating: (a, b) => rating(b) - rating(a),
    price: (a, b) => (a.price || 9) - (b.price || 9) || rating(b) - rating(a),
    near: (a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9),
  };
  return out.sort(by[state.sort] || by.recommended);
}

export const buildIndex = (places, kind) =>
  new Map(places.map((p) => [p.id, kind.searchText(p).filter(Boolean).join(' ').toLowerCase()]));

export const formatKm = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

// "No vegan rooftop in Remera" style summary of what's switched on.
export function describeChoices(state, chips, groups) {
  const words = [
    ...chips.filter((c) => state.picks.includes(c.key)).map((c) => c.label.replace(/^\W+\s*/, '')),
    ...groups.flatMap((g) => (state.groups[g.key] || []).map((v) => g.options.find((o) => o.key === v)?.label || v)),
  ];
  if (state.q) words.unshift(state.q);
  if (state.loc.province) words.push(`in ${locationLabel(state.loc)}`);
  return words.join(' · ');
}
