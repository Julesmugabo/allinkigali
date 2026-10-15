/**
 * clients/auth.js — signing in to the client dashboard.
 *   POST /clients/auth/login        owners & managers: email + password
 *   POST /clients/auth/staff-login  waiters, kitchen, cashiers (and managers): phone + PIN
 *   POST /clients/auth/device       a kitchen/bar tablet: the one-time code the owner shows
 *   POST /clients/auth/switch       an owner with several places picks another one
 *   GET  /clients/auth/me           who is signed in, and their places
 * The allinkigali team never signs in here directly — they open a client
 * from the Staff Portal (see support.js).
 */
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query } = require('../../db');
const { requireAuth } = require('../../middleware/auth');
const { requireClient } = require('../../middleware/clientAuth');
const { sign } = require('../../clients/tokens');
const { placeNames, normalizePhone } = require('../../clients/places');

const router = express.Router();
const MAX_PIN_TRIES = 5;
const fullName = (u) => [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email;

// An account's owner/manager places, with names, for the place switcher.
async function memberPlaces(userId) {
  const { rows } = await query(
    `select id, place_type, place_id, role from place_members
     where user_id = $1 and active and role in ('owner', 'manager') order by created_at`, [userId]);
  const names = await placeNames(rows.map((r) => ({ type: r.place_type, id: r.place_id })));
  return rows.map((r) => ({ memberId: r.id, type: r.place_type, id: r.place_id, role: r.role, name: names.get(`${r.place_type}:${r.place_id}`) || 'Unnamed place' }));
}

const userToken = (user, p) => sign({ sub: user.id, kind: 'member', mrole: p.role, memberId: p.memberId, name: fullName(user), place: { type: p.type, id: p.id, name: p.name } });

router.post('/login', async (req, res) => {
  const { email, password, memberId } = req.body || {};
  const { rows: [user] } = await query('select id, email, password_hash, first_name, last_name from users where lower(email) = lower($1)', [String(email || '').trim()]);
  if (!user || !(await bcrypt.compare(String(password || ''), user.password_hash || ''))) {
    return res.status(401).json({ error: 'Wrong email or password.' });
  }
  const places = await memberPlaces(user.id);
  if (!places.length) {
    return res.status(403).json({ error: 'This sign-in is for business clients. allinkigali staff: open a client from the Staff Portal.', code: 'NOT_A_CLIENT' });
  }
  const pick = places.find((p) => p.memberId === memberId) || places[0];
  await query('update place_members set last_login_at = now() where id = $1', [pick.memberId]);
  res.json({ token: userToken(user, pick), places });
});

router.post('/staff-login', async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  const pin = String(req.body?.pin || '');
  if (!phone || !/^\d{4,6}$/.test(pin)) return res.status(400).json({ error: 'Enter your phone number and your 4–6 digit PIN.' });
  const { rows } = await query(
    `select m.*, (m.locked_until is not null and m.locked_until > now()) as locked
     from place_members m where m.phone = $1 and m.active and m.pin_hash is not null`, [phone]);
  const open = rows.filter((r) => !r.locked);
  if (rows.length && !open.length) return res.status(429).json({ error: 'Too many wrong PINs. Wait 15 minutes or ask the owner to reset your PIN.' });
  const matches = [];
  for (const r of open) if (await bcrypt.compare(pin, r.pin_hash)) matches.push(r);
  if (!matches.length) {
    if (open.length) {
      await query(`update place_members set failed_pins = failed_pins + 1,
        locked_until = case when failed_pins + 1 >= $2 then now() + interval '15 minutes' else locked_until end
        where id = any($1)`, [open.map((r) => r.id), MAX_PIN_TRIES]);
    }
    return res.status(401).json({ error: 'Wrong phone number or PIN.' });
  }
  const names = await placeNames(matches.map((r) => ({ type: r.place_type, id: r.place_id })));
  const choices = matches.map((r) => ({ memberId: r.id, role: r.role, placeName: names.get(`${r.place_type}:${r.place_id}`) || 'Unnamed place' }));
  const pick = matches.find((r) => r.id === req.body?.memberId) || (matches.length === 1 ? matches[0] : null);
  if (!pick) return res.json({ choose: choices }); // works at several places with the same PIN
  await query('update place_members set failed_pins = 0, locked_until = null, last_login_at = now() where id = $1', [pick.id]);
  const token = sign({
    sub: `member:${pick.id}`, kind: 'member', mrole: pick.role, memberId: pick.id, name: pick.name,
    place: { type: pick.place_type, id: pick.place_id, name: names.get(`${pick.place_type}:${pick.place_id}`) },
  });
  res.json({ token });
});

router.post('/device', async (req, res) => {
  const code = String(req.body?.code || '').replace(/\D/g, '');
  if (code.length !== 6) return res.status(400).json({ error: 'Type the 6-digit code shown on the owner\'s screen.' });
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  const { rows: [d] } = await query(
    `update place_devices set pair_code_hash = null, pair_expires_at = null, last_seen_at = now()
     where pair_code_hash = $1 and pair_expires_at > now() and active returning *`, [hash]);
  if (!d) return res.status(401).json({ error: 'That code is wrong or has expired. Ask for a new one.' });
  const names = await placeNames([{ type: d.place_type, id: d.place_id }]);
  const token = sign({ sub: `device:${d.id}`, kind: 'device', mrole: d.role, deviceId: d.id, name: d.label, place: { type: d.place_type, id: d.place_id, name: names.get(`${d.place_type}:${d.place_id}`) } });
  res.json({ token });
});

router.post('/switch', requireAuth, async (req, res) => {
  if (req.user.aud !== 'clients' || req.user.kind !== 'member' || String(req.user.sub).includes(':')) {
    return res.status(403).json({ error: 'Only owners and managers with an account can switch places.' });
  }
  const { rows: [user] } = await query('select id, email, first_name, last_name from users where id = $1', [req.user.sub]);
  const places = await memberPlaces(req.user.sub);
  const pick = places.find((p) => p.memberId === req.body?.memberId);
  if (!user || !pick) return res.status(404).json({ error: 'Place not found.' });
  res.json({ token: userToken(user, pick), places });
});

router.get('/me', requireClient(), async (req, res) => {
  const u = req.user;
  const accountUser = u.kind === 'member' && !String(u.sub).includes(':');
  // A waiter's section, so the board can open on "my section".
  const { rows: [m] } = req.client.memberId ? await query('select section_id from place_members where id = $1', [req.client.memberId]) : { rows: [] };
  res.json({
    name: u.name, role: req.client.mrole, kind: u.kind, support: req.client.support, sectionId: m?.section_id || null,
    place: { type: req.client.placeType, id: req.client.placeId, name: req.client.placeName },
    places: accountUser ? await memberPlaces(u.sub) : [],
  });
});

module.exports = router;
