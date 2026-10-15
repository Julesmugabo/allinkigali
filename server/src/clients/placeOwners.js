/**
 * placeOwners.js — a place's owners in the client dashboard (place_members).
 *   placeOwnerIds  who to notify about a place's bookings and orders: its
 *                  owners and managers, falling back to the old one-owner
 *                  link on the users table.
 *   linkOwner      gives an account the owner's sign-in for a place — every
 *                  way a place gets an owner goes through here (Sales
 *                  Partners onboarding, an approved application, the
 *                  director's "Give access", a venue's owner). Never for an
 *                  allinkigali staff account.
 *   unlinkAccount  switches off all of an account's places (access removed).
 */
const { query } = require('../db');
const { forget } = require('../middleware/clientAuth');

const STAFF_ROLES = ['director', 'news', 'sellers', 'finance'];

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

async function linkOwner(placeType, placeId, userId, by) {
  const { rows: [u] } = await query('select first_name, last_name, email, role, staff_roles from users where id = $1', [userId]);
  if (!u || STAFF_ROLES.includes(u.role) || (u.staff_roles || []).length) return false;
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email;
  const { rows: [m] } = await query(
    `insert into place_members (place_type, place_id, user_id, role, name, created_by)
     values ($1, $2, $3, 'owner', $4, $5)
     on conflict (place_type, place_id, user_id) where user_id is not null
     do update set active = true, role = 'owner'
     returning id`,
    [toMemberType(placeType), String(placeId), userId, name, by || null]);
  forget('member', m.id); // switched back on at once
  return true;
}

async function unlinkAccount(userId) {
  const { rows } = await query('update place_members set active = false where user_id = $1 and active returning id', [userId]);
  rows.forEach((r) => forget('member', r.id)); // signed out within seconds
  return rows.length;
}

module.exports = { placeOwnerIds, linkOwner, unlinkAccount, STAFF_ROLES };
