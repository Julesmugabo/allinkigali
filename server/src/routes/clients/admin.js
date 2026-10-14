/**
 * clients/admin.js — the Staff Portal's view of clients (Director and Sales
 * Partners).
 *   GET  /clients/admin/places                   every restaurant, coffee shop and venue: owners, team, activity
 *   POST /clients/admin/onboard                  give a place its owner login (new account or an existing one)
 *   POST /clients/admin/members/:id/reset-password   a new temporary password for an owner/manager
 *   GET  /clients/admin/activity                 recent support activity across all clients
 * A temporary password is shown once; the owner changes it after signing in.
 */
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query } = require('../../db');
const { requireAuth } = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');
const { PLACE, isPlaceType, placeInfo, normalizePhone } = require('../../clients/places');

const router = express.Router();
const staff = [requireAuth, requireRole('sellers')]; // the director always passes
const tempPassword = () => `Ak-${crypto.randomBytes(5).toString('base64url')}`;

router.get('/places', staff, async (req, res) => {
  const places = [];
  for (const type of Object.keys(PLACE)) {
    const { rows } = await query(`select id, name, district from ${PLACE[type].table} order by name`);
    rows.forEach((r) => places.push({ type, id: String(r.id), name: r.name, district: r.district }));
  }
  const { rows: members } = await query(
    `select m.id, m.place_type, m.place_id, m.role, m.name, m.active, m.last_login_at, u.email
     from place_members m left join users u on u.id = m.user_id`);
  const { rows: tables } = await query(
    `select place_type, place_id, count(*)::int as tables,
       (select count(*)::int from table_sessions s where s.place_type = t.place_type and s.place_id = t.place_id and s.status = 'open') as open_tables
     from place_tables t where active group by place_type, place_id`);
  res.json(places.map((p) => {
    const mine = members.filter((m) => m.place_type === p.type && String(m.place_id) === p.id && m.active);
    const t = tables.find((x) => x.place_type === p.type && String(x.place_id) === p.id);
    const logins = mine.map((m) => m.last_login_at).filter(Boolean).sort();
    return {
      ...p,
      owners: mine.filter((m) => m.role === 'owner' || m.role === 'manager').map((m) => ({ id: m.id, name: m.name, email: m.email, role: m.role })),
      team: mine.length, lastLogin: logins[logins.length - 1] || null,
      tables: t?.tables || 0, openTables: t?.open_tables || 0,
    };
  }));
});

router.post('/onboard', staff, async (req, res) => {
  const { placeType, placeId, firstName, lastName } = req.body || {};
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!isPlaceType(placeType) || !(await placeInfo(placeType, placeId))) return res.status(404).json({ error: 'Choose the place.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Enter the owner\'s email.' });
  let { rows: [user] } = await query('select id, first_name, last_name from users where lower(email) = $1', [email]);
  let password = null;
  if (!user) {
    if (!String(firstName || '').trim()) return res.status(400).json({ error: 'Enter the owner\'s name.' });
    password = tempPassword();
    ({ rows: [user] } = await query(
      `insert into users (email, password_hash, first_name, last_name, phone) values ($1, $2, $3, $4, $5)
       returning id, first_name, last_name`,
      [email, await bcrypt.hash(password, 10), String(firstName).trim(), String(lastName || '').trim(), normalizePhone(req.body?.phone) ? `0${normalizePhone(req.body.phone)}` : null]));
  }
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
  await query(
    `insert into place_members (place_type, place_id, user_id, role, name, created_by)
     values ($1, $2, $3, 'owner', $4, $5) on conflict do nothing`,
    [placeType, String(placeId), user.id, name, `allinkigali · ${req.user.email || req.user.sub}`]);
  res.status(201).json({ email, name, temporaryPassword: password, existingAccount: !password });
});

router.post('/members/:id/reset-password', staff, async (req, res) => {
  const { rows: [m] } = await query("select user_id from place_members where id = $1 and role in ('owner', 'manager') and user_id is not null", [req.params.id]);
  if (!m) return res.status(404).json({ error: 'Owner not found.' });
  const password = tempPassword();
  await query('update users set password_hash = $1 where id = $2', [await bcrypt.hash(password, 10), m.user_id]);
  res.json({ temporaryPassword: password });
});

router.get('/activity', staff, async (req, res) => {
  const { rows } = await query('select * from support_access_log order by created_at desc limit 200');
  const names = new Map();
  for (const type of Object.keys(PLACE)) {
    const ids = [...new Set(rows.filter((r) => r.place_type === type).map((r) => r.place_id))];
    if (!ids.length) continue;
    (await query(`select id, name from ${PLACE[type].table} where id = any($1)`, [ids])).rows.forEach((p) => names.set(`${type}:${p.id}`, p.name));
  }
  res.json(rows.map((r) => ({ place: names.get(`${r.place_type}:${r.place_id}`) || r.place_id, placeType: r.place_type, who: r.staff_name, role: r.staff_role, action: r.action, detail: r.detail, at: r.created_at })));
});

module.exports = router;
