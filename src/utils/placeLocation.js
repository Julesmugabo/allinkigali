/**
 * placeLocation.js — matches a place against a Province > District > Sector
 * choice. Places store a district name and a free-text address, so the
 * district comes from `district` (or the address), the province from the
 * district, and the sector from the address/description text.
 */
import { PROVINCES } from '../data/rwandaLocations';

const DISTRICTS = PROVINCES.flatMap((p) => p.districts.map((d) => ({ ...d, province: p.key })));
const lower = (s) => String(s || '').toLowerCase();

export const EMPTY_LOCATION = { province: null, district: null, sector: null };

function districtOf(place) {
  const named = lower(place.district);
  const exact = named && DISTRICTS.find((d) => lower(d.label) === named || d.key === named);
  if (exact) return exact;
  const text = lower(`${place.location} ${place.district}`);
  return DISTRICTS.find((d) => text.includes(lower(d.label))) || null;
}

export function matchesLocation(place, loc) {
  if (!loc?.province) return true;
  const d = districtOf(place);
  if (!d || d.province !== loc.province) return false;
  if (loc.district && d.key !== loc.district) return false;
  if (loc.sector) {
    const text = lower(`${place.sector || ''} ${place.location} ${place.description || ''}`);
    if (!text.includes(lower(loc.sector))) return false;
  }
  return true;
}

// "Remera, Gasabo" style label for chips and empty-result messages.
export function locationLabel(loc) {
  if (!loc?.province) return '';
  const p = PROVINCES.find((x) => x.key === loc.province);
  const d = p?.districts.find((x) => x.key === loc.district);
  return [loc.sector, d?.label, d ? null : p?.label].filter(Boolean).join(', ');
}
