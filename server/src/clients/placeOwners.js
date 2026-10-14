/**
 * placeOwners.js — who to notify about a place's bookings and orders: its
 * owners and managers in the client dashboard (place_members), falling back
 * to the old one-owner link on the users table.
 */
const { query } = require('../db');

// Bookings and orders spell coffee shops 'coffee_shop' or 'coffeeshop'.
const toMemberType = (t) => (t === 'coffee_shop' ? 'coffeeshop' : t);

async function placeOwnerIds(placeType, placeId) {
  const { rows } = await query(
    `select user_id as id from place_members
     where place_id = $1 and ($2::text is null or place_type = $2) and active and user_id is not null and role in ('owner', 'manager')
     union
     select id from users where restaurant_id = $1 or coffee_shop_id = $1`,
    [String(placeId), placeType ? toMemberType(placeType) : null]);
  return rows.map((r) => r.id);
}

module.exports = { placeOwnerIds };
