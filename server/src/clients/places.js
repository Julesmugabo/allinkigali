/**
 * places.js — the three kinds of client place and how to read them.
 * Client-side names: 'restaurant' | 'coffeeshop' | 'wedding'. Other parts of
 * the system spell them differently (bookings and reviews use 'coffee_shop'),
 * so the conversions live here.
 */
const { query } = require('../db');

const PLACE = {
  restaurant: { table: 'restaurants', bookingType: 'restaurant', reviewType: 'restaurant', legacyRole: 'restaurant', idClaim: 'restaurantId' },
  coffeeshop: { table: 'coffee_shops', bookingType: 'coffee_shop', reviewType: 'coffee_shop', legacyRole: 'coffeeshop', idClaim: 'coffeeShopId' },
  wedding: { table: 'wedding_venues', bookingType: 'wedding', reviewType: 'wedding', legacyRole: 'wedding', idClaim: 'weddingVenueId' },
};
const isPlaceType = (t) => Object.prototype.hasOwnProperty.call(PLACE, t);

async function placeInfo(type, id) {
  if (!isPlaceType(type)) return null;
  const { rows } = await query(
    `select id, name, ${type === 'wedding' ? 'null::numeric as lat, null::numeric as lng' : 'lat, lng'}, open_status
     from ${PLACE[type].table} where id = $1`, [String(id)]);
  return rows[0] || null;
}

// Names for many places at once: [{type, id}] → Map("type:id" → name).
async function placeNames(list) {
  const out = new Map();
  for (const type of Object.keys(PLACE)) {
    const ids = list.filter((p) => p.type === type).map((p) => String(p.id));
    if (!ids.length) continue;
    const { rows } = await query(`select id, name from ${PLACE[type].table} where id = any($1)`, [ids]);
    rows.forEach((r) => out.set(`${type}:${r.id}`, r.name));
  }
  return out;
}

// Phones are stored as their last 9 digits, so 0788…, +250788… and 788… match.
function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : null;
}

module.exports = { PLACE, isPlaceType, placeInfo, placeNames, normalizePhone };
