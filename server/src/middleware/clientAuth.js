/**
 * clientAuth.js — guards for the client dashboard.
 *
 * requireClient(...roles)  sign-in must be a client-dashboard token for a
 *   place, with one of these member roles (support views count as owner).
 *   Members and tablets are re-checked against the database (cached 20s),
 *   so switching off a waiter or a tablet locks them out almost at once.
 *   Sets req.client = { placeType, placeId, placeName, mrole, memberId, deviceId, support, actor }.
 *
 * supportGuard  (app-wide) a support view is read-only until "Make changes";
 *   once switched on, every change it makes is logged for the client to see.
 *
 * revokedGuard  (app-wide) a client sign-in that was switched off (owner
 *   removed, waiter switched off, tablet disconnected) stops working on
 *   every route within seconds — not only on /clients.
 *
 * clientOwnersOnly  owner routes (/my-restaurant, booking and order admin)
 *   act for a place only with a client-dashboard sign-in; an old app sign-in
 *   that still says "restaurant" no longer opens them.
 */
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { requireAuth } = require('./auth');
const { logSupport } = require('../clients/supportLog');

const cache = new Map(); // "member:<id>" | "device:<id>" → { ok, at }
const TTL_MS = 20_000;

async function stillActive(u) {
  if (u.kind === 'support') return true;
  const key = u.kind === 'device' ? `device:${u.deviceId}` : `member:${u.memberId}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.ok;
  const { rows } = u.kind === 'device'
    ? await query('update place_devices set last_seen_at = now() where id = $1 returning active, place_id', [u.deviceId])
    : await query('select active, place_id from place_members where id = $1', [u.memberId]);
  const ok = !!rows[0]?.active && String(rows[0].place_id) === String(u.place.id);
  cache.set(key, { ok, at: Date.now() });
  return ok;
}
const forget = (kind, id) => cache.delete(`${kind}:${id}`);

function requireClient(...roles) {
  return [requireAuth, async (req, res, next) => {
    const u = req.user;
    if (u.aud !== 'clients' || !u.place) return res.status(403).json({ error: 'Sign in to the client dashboard first.' });
    const mrole = u.kind === 'support' ? 'owner' : u.mrole;
    if (roles.length && !roles.includes(mrole)) return res.status(403).json({ error: 'Your role cannot do this.' });
    try {
      if (!(await stillActive(u))) return res.status(401).json({ error: 'This sign-in was switched off. Ask the owner.', code: 'REVOKED' });
    } catch (e) { return next(e); }
    req.client = {
      placeType: u.place.type, placeId: u.place.id, placeName: u.place.name,
      mrole, memberId: u.memberId || null, deviceId: u.deviceId || null, support: u.support || null,
      actor: u.kind === 'support' ? `allinkigali · ${u.support?.name || 'support'}` : u.name || u.mrole,
    };
    next();
  }];
}

const READS = ['GET', 'HEAD', 'OPTIONS'];
function supportGuard(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token || READS.includes(req.method)) return next();
  let p;
  try { p = jwt.verify(token, process.env.JWT_SECRET); } catch { return next(); }
  if (p.aud !== 'clients' || p.kind !== 'support' || req.path === '/clients/support/elevate') return next();
  if (p.support?.readOnly) {
    return res.status(403).json({ error: 'This is a read-only view. Press "Make changes" first.', code: 'READ_ONLY' });
  }
  res.on('finish', () => { if (res.statusCode < 400) logSupport(p, 'change', `${req.method} ${req.path}`); });
  next();
}

async function revokedGuard(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return next();
  let p;
  try { p = jwt.verify(token, process.env.JWT_SECRET); } catch { return next(); }
  if (p.aud !== 'clients' || !p.place) return next();
  try {
    if (!(await stillActive(p))) return res.status(401).json({ error: 'This sign-in was switched off. Ask the owner.', code: 'REVOKED' });
  } catch (e) { return next(e); }
  next();
}

const OWNER_ROLES = ['restaurant', 'coffeeshop', 'wedding'];
function clientOwnersOnly(req, res, next) {
  const u = req.user;
  if (u && OWNER_ROLES.includes(u.role) && u.aud !== 'clients') {
    return res.status(403).json({ error: 'Restaurants, cafés and venues sign in at allinclients.allinkigali.rw.', code: 'USE_CLIENT_DASHBOARD' });
  }
  next();
}

module.exports = { requireClient, supportGuard, revokedGuard, clientOwnersOnly, forget };
