/**
 * clients/team.js — the owner's staff and tablets.
 *   GET/POST   /clients/team/members        list / add (name, phone, role, PIN, section)
 *   PATCH      /clients/team/members/:id    edit, switch off/on, new PIN
 *   GET/POST   /clients/team/devices        list / add a tablet (returns a 6-digit code, 10 minutes)
 *   POST       /clients/team/devices/:id/code   a fresh code for a tablet
 *   DELETE     /clients/team/devices/:id    disconnect a tablet
 * Owners manage everyone except other owners; managers manage waiters,
 * kitchen and cashiers.
 */
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query } = require('../../db');
const { requireClient, forget } = require('../../middleware/clientAuth');
const { normalizePhone } = require('../../clients/places');

const router = express.Router();
const guard = requireClient('owner', 'manager');
const STAFF_ROLES = ['manager', 'waiter', 'kitchen', 'cashier'];
const mayManage = (actorRole, targetRole) => targetRole !== 'owner' && (actorRole === 'owner' || targetRole !== 'manager');
const memberJson = (m) => ({
  id: m.id, name: m.name, phone: m.phone, role: m.role, sectionId: m.section_id, active: m.active,
  hasAccount: !!m.user_id, hasPin: !!m.pin_hash, locked: !!(m.locked_until && new Date(m.locked_until) > new Date()), lastLoginAt: m.last_login_at,
});
const validPin = (pin) => /^\d{4,6}$/.test(String(pin || ''));

router.get('/members', guard, async (req, res) => {
  const { rows } = await query('select * from place_members where place_type = $1 and place_id = $2 order by active desc, role, name',
    [req.client.placeType, req.client.placeId]);
  res.json(rows.map(memberJson));
});

router.post('/members', guard, async (req, res) => {
  const { name, role, pin, sectionId } = req.body || {};
  const phone = normalizePhone(req.body?.phone);
  if (!String(name || '').trim()) return res.status(400).json({ error: 'Add the person\'s name.' });
  if (!STAFF_ROLES.includes(role) || !mayManage(req.client.mrole, role)) return res.status(403).json({ error: 'You can\'t add this role.' });
  if (!phone) return res.status(400).json({ error: 'Add a valid phone number — it\'s how they sign in.' });
  if (!validPin(pin)) return res.status(400).json({ error: 'The PIN must be 4 to 6 digits.' });
  try {
    const { rows: [m] } = await query(
      `insert into place_members (place_type, place_id, role, name, phone, pin_hash, section_id, created_by)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
      [req.client.placeType, req.client.placeId, role, String(name).trim(), phone, await bcrypt.hash(String(pin), 10), sectionId || null, req.client.actor]);
    res.status(201).json(memberJson(m));
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Someone at this place already uses that phone number.' });
    throw e;
  }
});

router.patch('/members/:id', guard, async (req, res) => {
  const { rows: [m] } = await query('select * from place_members where id = $1 and place_type = $2 and place_id = $3',
    [req.params.id, req.client.placeType, req.client.placeId]);
  if (!m) return res.status(404).json({ error: 'Not found.' });
  if (!mayManage(req.client.mrole, m.role)) return res.status(403).json({ error: 'You can\'t change this person.' });
  const b = req.body || {};
  const sets = []; const vals = [];
  const put = (col, v) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };
  if (b.name !== undefined) put('name', String(b.name).trim());
  if (b.role !== undefined) {
    if (!STAFF_ROLES.includes(b.role) || !mayManage(req.client.mrole, b.role)) return res.status(403).json({ error: 'You can\'t give this role.' });
    put('role', b.role);
  }
  if (b.sectionId !== undefined) put('section_id', b.sectionId || null);
  if (b.active !== undefined) put('active', !!b.active);
  if (b.pin !== undefined) {
    if (!validPin(b.pin)) return res.status(400).json({ error: 'The PIN must be 4 to 6 digits.' });
    put('pin_hash', await bcrypt.hash(String(b.pin), 10)); put('failed_pins', 0); put('locked_until', null);
  }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to change.' });
  vals.push(m.id);
  const { rows: [out] } = await query(`update place_members set ${sets.join(', ')} where id = $${vals.length} returning *`, vals);
  forget('member', m.id); // a switched-off person is locked out at once
  res.json(memberJson(out));
});

const newPairCode = () => {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  return { code, hash: crypto.createHash('sha256').update(code).digest('hex') };
};

router.get('/devices', guard, async (req, res) => {
  const { rows } = await query(
    'select id, label, role, active, created_at, last_seen_at from place_devices where place_type = $1 and place_id = $2 and active order by created_at',
    [req.client.placeType, req.client.placeId]);
  res.json(rows);
});

router.post('/devices', guard, async (req, res) => {
  const label = String(req.body?.label || 'Kitchen').trim().slice(0, 40);
  const role = req.body?.role === 'waiter' ? 'waiter' : 'kitchen';
  const { code, hash } = newPairCode();
  const { rows: [d] } = await query(
    `insert into place_devices (place_type, place_id, label, role, pair_code_hash, pair_expires_at, created_by)
     values ($1, $2, $3, $4, $5, now() + interval '10 minutes', $6) returning id, label, role`,
    [req.client.placeType, req.client.placeId, label, role, hash, req.client.actor]);
  res.status(201).json({ ...d, code });
});

router.post('/devices/:id/code', guard, async (req, res) => {
  const { code, hash } = newPairCode();
  const { rowCount } = await query(
    `update place_devices set pair_code_hash = $1, pair_expires_at = now() + interval '10 minutes'
     where id = $2 and place_type = $3 and place_id = $4 and active`, [hash, req.params.id, req.client.placeType, req.client.placeId]);
  if (!rowCount) return res.status(404).json({ error: 'Not found.' });
  res.json({ code });
});

router.delete('/devices/:id', guard, async (req, res) => {
  await query('update place_devices set active = false where id = $1 and place_type = $2 and place_id = $3',
    [req.params.id, req.client.placeType, req.client.placeId]);
  forget('device', req.params.id);
  res.status(204).end();
});

module.exports = router;
