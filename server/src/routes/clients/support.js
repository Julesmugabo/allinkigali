/**
 * clients/support.js — the allinkigali team looking inside a client's
 * dashboard, with nothing shared but a one-minute code.
 *   POST /clients/support/start     (Staff Portal: director, Sales Partners, Finance)
 *                                   → a code the client dashboard exchanges
 *   POST /clients/support/exchange  code → a 2-hour, read-only support sign-in
 *   POST /clients/support/elevate   "Make changes" (not for Finance)
 *   GET  /clients/support/activity  the client's view of what the team did
 * Every view, every "Make changes" and every change is logged.
 */
const express = require('express');
const { query } = require('../../db');
const { requireAuth } = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');
const { requireClient } = require('../../middleware/clientAuth');
const { sign, signSupportCode, readSupportCode } = require('../../clients/tokens');
const { isPlaceType, placeInfo } = require('../../clients/places');
const { logSupport } = require('../../clients/supportLog');

const router = express.Router();
const STAFF_ROLES = ['director', 'sellers', 'finance'];

router.post('/start', requireAuth, requireRole('sellers', 'finance'), async (req, res) => {
  const { placeType, placeId } = req.body || {};
  if (!isPlaceType(placeType)) return res.status(400).json({ error: 'Unknown kind of place.' });
  const place = await placeInfo(placeType, placeId);
  if (!place) return res.status(404).json({ error: 'Place not found.' });
  res.json({ code: signSupportCode({ by: req.user.sub, placeType, placeId: String(place.id) }) });
});

router.post('/exchange', async (req, res) => {
  let data;
  try { data = readSupportCode(String(req.body?.code || '')); } catch {
    return res.status(401).json({ error: 'This link has expired. Open the client again from the Staff Portal.' });
  }
  const { rows: [staff] } = await query('select id, role, first_name, last_name, email from users where id = $1', [data.by]);
  if (!staff || !STAFF_ROLES.includes(staff.role)) return res.status(403).json({ error: 'Not allowed.' });
  const place = await placeInfo(data.placeType, data.placeId);
  if (!place) return res.status(404).json({ error: 'Place not found.' });
  const name = [staff.first_name, staff.last_name].filter(Boolean).join(' ') || staff.email;
  const support = { by: staff.id, name, staffRole: staff.role, readOnly: true };
  const token = sign({ sub: staff.id, kind: 'support', mrole: 'owner', name, support, place: { type: data.placeType, id: place.id, name: place.name } });
  await logSupport({ place: { type: data.placeType, id: place.id }, support }, 'view');
  res.json({ token });
});

router.post('/elevate', requireClient(), async (req, res) => {
  const u = req.user;
  if (u.kind !== 'support') return res.status(400).json({ error: 'Only for the allinkigali support view.' });
  if (u.support.staffRole === 'finance') return res.status(403).json({ error: 'Finance can view, not change.' });
  const support = { ...u.support, readOnly: false };
  const token = sign({ sub: u.sub, kind: 'support', mrole: 'owner', name: u.name, support, place: u.place });
  await logSupport({ ...u, support }, 'enable_changes');
  res.json({ token });
});

router.get('/activity', requireClient('owner', 'manager'), async (req, res) => {
  const { rows } = await query(
    `select staff_name, staff_role, action, detail, created_at from support_access_log
     where place_type = $1 and place_id = $2 order by created_at desc limit 100`,
    [req.client.placeType, req.client.placeId]);
  res.json(rows.map((r) => ({ who: r.staff_name, role: r.staff_role, action: r.action, detail: r.detail, at: r.created_at })));
});

module.exports = router;
