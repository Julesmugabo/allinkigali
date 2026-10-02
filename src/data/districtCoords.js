/**
 * districtCoords.js — Approximate geographic centres for Rwanda districts,
 * used to place price markers on the property/land map. Coordinates are
 * lat/lng WGS-84, accurate to the town centre.
 */
const DISTRICT_COORDS = {
  // Kigali City
  gasabo:    { lat: -1.9179, lng: 30.0985 },
  kicukiro:  { lat: -1.9988, lng: 30.0929 },
  nyarugenge:{ lat: -1.9536, lng: 30.0606 },

  // Northern Province
  musanze:   { lat: -1.4988, lng: 29.6344 },
  burera:    { lat: -1.3597, lng: 29.8437 },
  gicumbi:   { lat: -1.5524, lng: 30.0997 },
  rulindo:   { lat: -1.7332, lng: 29.9993 },
  gakenke:   { lat: -1.6982, lng: 29.7780 },

  // Southern Province
  huye:      { lat: -2.5953, lng: 29.7373 },
  nyanza:    { lat: -2.3511, lng: 29.7458 },
  muhanga:   { lat: -2.0854, lng: 29.7578 },
  kamonyi:   { lat: -2.0699, lng: 30.0063 },
  ruhango:   { lat: -2.2083, lng: 29.7803 },
  nyaruguru: { lat: -2.6658, lng: 29.5353 },
  nyamagabe: { lat: -2.4343, lng: 29.4910 },
  gisagara:  { lat: -2.5810, lng: 29.8253 },

  // Eastern Province
  rwamagana: { lat: -1.9498, lng: 30.4337 },
  kayonza:   { lat: -1.8800, lng: 30.6521 },
  kirehe:    { lat: -2.1390, lng: 30.6878 },
  ngoma:     { lat: -2.1553, lng: 30.5000 },
  nyagatare: { lat: -1.2972, lng: 30.3263 },
  gatsibo:   { lat: -1.5702, lng: 30.4504 },
  bugesera:  { lat: -2.1940, lng: 30.2640 },

  // Western Province
  rubavu:    { lat: -1.6983, lng: 29.2607 },
  rusizi:    { lat: -2.4828, lng: 28.9059 },
  karongi:   { lat: -2.1070, lng: 29.3868 },
  ngororero: { lat: -1.8553, lng: 29.5905 },
  rutsiro:   { lat: -1.8717, lng: 29.3861 },
  nyabihu:   { lat: -1.6470, lng: 29.4986 },
  nyamasheke:{ lat: -2.3370, lng: 29.1378 },
};

/**
 * Returns { lat, lng } for a district key, with a small jitter so
 * multiple listings in the same district don't overlap exactly.
 */
export function getDistrictCoords(districtKey, jitter = true) {
  const base = DISTRICT_COORDS[districtKey];
  if (!base) return null;
  if (!jitter) return base;
  return {
    lat: base.lat + (Math.random() - 0.5) * 0.025,
    lng: base.lng + (Math.random() - 0.5) * 0.025,
  };
}

export default DISTRICT_COORDS;
