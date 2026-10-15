/**
 * clients/kumezaService.js — Ku Meza during service.
 *   GET  /clients/kumeza/board                 waiter board (owner, manager, waiter, cashier)
 *   GET  /clients/kumeza/kitchen               kitchen/bar queue (owner, manager, kitchen)
 *   POST /clients/kumeza/orders/:id/<action>   confirm | reject | accept | preparing | served | cancel
 *   POST /clients/kumeza/orders/:id/ready      { station } kitchen or bar marks its part ready
 *   POST /clients/kumeza/requests/:id/handle   waiter answered a call / bill request
 *   POST /clients/kumeza/sessions/:id/close    "Paid & close table" { paymentMethod }
 *   POST /clients/kumeza/stream-ticket         a 2-minute ticket for…
 *   GET  /clients/kumeza/stream?ticket=…       live alerts (Server-Sent Events)
 * Every action is scoped to the signed-in place and recorded with who did it.
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const { query, getClient } = require('../../db');
const { requireClient } = require('../../middleware/clientAuth');
const { boardOf, kitchenOf } = require('../../kumeza/store');
const { publish, openStream } = require('../../kumeza/realtime');

const router = express.Router();
const FLOOR = ['owner', 'manager', 'waiter', 'cashier'];
const KITCHEN = ['owner', 'manager', 'kitchen'];
const key = (req) => `${req.client.placeType}:${req.client.placeId}`;

router.get('/board', requireClient(...FLOOR), async (req, res) => res.json(await boardOf(req.client.placeType, req.client.placeId)));
router.get('/kitchen', requireClient(...KITCHEN), async (req, res) => res.json(await kitchenOf(req.client.placeType, req.client.placeId)));

// Each action: who may do it, which statuses it moves from, where to.
const ACTIONS = {
  confirm: { roles: FLOOR, from: ['needs_confirm'], to: 'accepted', stamp: 'accepted', confirmDevice: 'confirmed' },
  reject: { roles: FLOOR, from: ['needs_confirm'], to: 'rejected', confirmDevice: 'blocked' },
  accept: { roles: FLOOR, from: ['placed'], to: 'accepted', stamp: 'accepted' },
  preparing: { roles: KITCHEN, from: ['placed', 'accepted'], to: 'preparing', stamp: 'preparing' },
  served: { roles: FLOOR, from: ['accepted', 'preparing', 'ready'], to: 'served', stamp: 'served' },
  cancel: { roles: FLOOR, from: ['needs_confirm', 'placed', 'accepted', 'preparing', 'ready'], to: 'cancelled' },
};
// (A guest's own cancel is 'cancelled' and alerts the board; a waiter's isn't.)
const EVENT = { confirm: 'confirmed', reject: 'rejected', accept: 'accepted', preparing: 'preparing', served: 'served', cancel: 'staff_cancelled' };

Object.entries(ACTIONS).forEach(([name, a]) => {
  router.post(`/orders/:id/${name}`, requireClient(...a.roles), async (req, res) => {
    const by = a.stamp === 'accepted' ? ', accepted_by = $5' : a.stamp === 'served' ? ', served_by = $5' : '';
    const at = a.stamp ? `, ${a.stamp}_at = now()` : '';
    const params = [a.to, req.params.id, req.client.placeType, req.client.placeId];
    if (by) params.push(req.client.actor);
    const { rows: [o] } = await query(
      `update table_orders set status = $1${at}${by}
       where id = $2 and place_type = $3 and place_id = $4 and status = any($${params.length + 1}) returning *`,
      [...params, a.from]);
    if (!o) return res.status(409).json({ error: 'This order has already moved on. The board will refresh.' });
    if (a.confirmDevice && o.device_id) {
      await query('update table_devices set status = $1, confirmed_by = $2 where session_id = $3 and device_id = $4',
        [a.confirmDevice, req.client.actor, o.session_id, o.device_id]);
    }
    const { rows: [t] } = await query('select label from place_tables where id = $1', [o.table_id]);
    publish(key(req), { type: EVENT[name], table: t?.label });
    res.json({ ok: true, status: o.status });
  });
});

// Ready, per station: an order with food and drinks is ready to collect once
// both the kitchen and the bar pressed Ready; each press alerts the waiter
// ("drinks ready"). Without a station, the whole order is ready.
router.post('/orders/:id/ready', requireClient(...KITCHEN), async (req, res) => {
  const station = ['kitchen', 'bar'].includes(req.body?.station) ? req.body.station : null;
  const db = await getClient();
  let o; let done; let all;
  try {
    await db.query('begin');
    ({ rows: [o] } = await db.query(
      `select * from table_orders where id = $1 and place_type = $2 and place_id = $3
       and status in ('placed', 'accepted', 'preparing') for update`, [req.params.id, req.client.placeType, req.client.placeId]));
    if (!o) { await db.query('rollback'); return res.status(409).json({ error: 'This order has already moved on. The screen will refresh.' }); }
    const { rows: stations } = await db.query('select distinct station from table_order_items where order_id = $1', [o.id]);
    const needed = stations.map((r) => r.station);
    done = station ? [...new Set([...o.ready_stations, station])] : needed;
    all = needed.every((st) => done.includes(st));
    await db.query(
      `update table_orders set ready_stations = $1, status = case when $2 then 'ready' else status end,
         ready_at = case when $2 then now() else ready_at end where id = $3`, [done, all, o.id]);
    await db.query('commit');
  } catch (e) {
    await db.query('rollback').catch(() => {});
    throw e;
  } finally { db.release(); }
  const { rows: [t] } = await query('select label from place_tables where id = $1', [o.table_id]);
  publish(key(req), { type: all ? 'ready' : 'station_ready', station, table: t?.label });
  res.json({ ok: true, status: all ? 'ready' : o.status, readyStations: done });
});

router.post('/requests/:id/handle', requireClient(...FLOOR), async (req, res) => {
  await query('update service_requests set handled_at = now(), handled_by = $1 where id = $2 and place_type = $3 and place_id = $4 and handled_at is null',
    [req.client.actor, req.params.id, req.client.placeType, req.client.placeId]);
  publish(key(req), { type: 'handled' });
  res.json({ ok: true });
});

router.post('/sessions/:id/close', requireClient(...FLOOR), async (req, res) => {
  const method = ['cash', 'momo', 'card'].includes(req.body?.paymentMethod) ? req.body.paymentMethod : 'cash';
  const { rows: [s] } = await query(
    `update table_sessions s set status = 'closed', closed_at = now(), closed_by = $1, payment_method = $2,
       total = coalesce((select sum(o.total) from table_orders o where o.session_id = s.id and o.status in ('placed', 'accepted', 'preparing', 'ready', 'served')), 0)
     where s.id = $3 and s.place_type = $4 and s.place_id = $5 and s.status = 'open' returning s.*`,
    [req.client.actor, method, req.params.id, req.client.placeType, req.client.placeId]);
  if (!s) return res.status(409).json({ error: 'This table is already closed.' });
  await query("update service_requests set handled_at = now(), handled_by = $1 where session_id = $2 and handled_at is null", [req.client.actor, s.id]);
  await query("update table_orders set status = 'cancelled', closed_note = 'closed unconfirmed' where session_id = $1 and status = 'needs_confirm'", [s.id]);
  publish(key(req), { type: 'closed' });
  res.json({ ok: true, total: s.total, paymentMethod: s.payment_method });
});

// EventSource can't send headers, so the screen first asks for a short ticket.
router.post('/stream-ticket', requireClient(...FLOOR, 'kitchen'), (req, res) => {
  const ticket = jwt.sign({ aud: 'kumeza-stream', place: key(req) }, process.env.JWT_SECRET, { expiresIn: '2m' });
  res.json({ ticket });
});

router.get('/stream', (req, res) => {
  let t;
  try { t = jwt.verify(String(req.query.ticket || ''), process.env.JWT_SECRET, { audience: 'kumeza-stream' }); } catch {
    return res.status(401).json({ error: 'Expired. Reconnecting…' });
  }
  openStream(req, res, t.place);
});

module.exports = router;
