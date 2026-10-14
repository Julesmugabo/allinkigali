/**
 * tokens.js — sign-in tokens for the client dashboard. All carry
 * aud: 'clients' and the place they act on. Kinds:
 *   member  — owner/manager (email login) or waiter/kitchen/cashier (PIN)
 *   device  — a connected kitchen/bar tablet
 *   support — the allinkigali team viewing a client (read-only until they
 *             choose "Make changes")
 * Owners, managers and support views also carry the old owner claims
 * (role 'restaurant' + restaurantId, …) so the existing owner routes
 * (/my-restaurant) serve them unchanged. Waiters, kitchen and cashiers get
 * role 'place_staff', which those owner routes refuse.
 */
const jwt = require('jsonwebtoken');
const { PLACE } = require('./places');

const TTL = { owner: '7d', manager: '7d', waiter: '14h', kitchen: '14h', cashier: '14h', device: '180d', support: '2h' };
const FULL_ACCESS = ['owner', 'manager'];

function sign({ sub, kind, mrole, place, memberId, deviceId, support, name }) {
  const p = PLACE[place.type];
  const full = FULL_ACCESS.includes(mrole) || kind === 'support';
  const payload = {
    sub: String(sub), aud: 'clients', kind, mrole, name: name || '',
    place: { type: place.type, id: String(place.id), name: place.name },
    memberId, deviceId, support,
    role: full ? p.legacyRole : 'place_staff',
    ...(full ? { [p.idClaim]: String(place.id) } : {}),
  };
  const ttl = kind === 'device' ? TTL.device : kind === 'support' ? TTL.support : TTL[mrole] || '12h';
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ttl });
}

// A one-minute code the Staff Portal hands to the client dashboard to open
// a support view without sharing any password.
const signSupportCode = (data) => jwt.sign({ ...data, aud: 'support-code' }, process.env.JWT_SECRET, { expiresIn: '90s' });
const readSupportCode = (code) => jwt.verify(code, process.env.JWT_SECRET, { audience: 'support-code' });

module.exports = { sign, signSupportCode, readSupportCode, FULL_ACCESS };
