/**
 * kumeza/public.js — the customer's side of Ku Meza (no account needed).
 * Each phone sends a random device id (X-Device-Id) it keeps in the browser.
 *   POST /kumeza/code                     typed table code → the table's token
 *   GET  /kumeza/t/:token                 table, place, menu (+ the tab if this phone joined)
 *   GET  /kumeza/t/:token/tab             the table's running tab (polled)
 *   POST /kumeza/t/:token/orders          send an order
 *   POST /kumeza/t/:token/orders/:id/cancel   until the kitchen starts it
 *   POST /kumeza/t/:token/requests        call the waiter / ask for the bill
 *
 * Honesty rules (spec §7): unguessable token or code; place must be open;
 * rate limits per phone and per table; a phone clearly far away is refused;
 * only menu dishes at menu prices; a phone's first order at a table waits
 * for a waiter to confirm someone is there before the kitchen sees it.
 */
const express = require('express');
const { query, getClient } = require('../../db');
const { tableByToken, openSessionOf, menuFor, tabOf } = require('../../kumeza/store');
const { cleanCode, limited, distanceM, FAR_M, isOpenNow, stationOf, validDevice } = require('../../kumeza/rules');
const { publish } = require('../../kumeza/realtime');

const router = express.Router();
const placeKey = (t) => `${t.place_type}:${t.place_id}`;
const deviceOf = (req) => req.get('X-Device-Id');

// Loads the table for :token, or answers 404.
async function withTable(req, res) {
  const found = await tableByToken(req.params.token);
  if (!found) { res.status(404).json({ error: 'This table code is no longer valid. Please ask a waiter.', code: 'BAD_TABLE' }); return null; }
  return found;
}

router.post('/code', async (req, res) => {
  if (limited('code', req.ip)) return res.status(429).json({ error: 'Too many tries. Wait a few minutes or scan the QR code.' });
  const code = cleanCode(req.body?.code);
  const { rows: [t] } = code ? await query('select qr_token from place_tables where short_code = $1 and active', [code]) : { rows: [] };
  if (!t) return res.status(404).json({ error: 'No table has this code. Check the card on your table.' });
  res.json({ token: t.qr_token });
});

router.get('/t/:token', async (req, res) => {
  const found = await withTable(req, res);
  if (!found) return;
  const { table, place } = found;
  const session = await openSessionOf(table.id);
  res.json({
    table: { label: table.label },
    place: { name: place.name, type: table.place_type, open: isOpenNow(place) },
    menu: await menuFor(table.place_type, table.place_id),
    tab: session && validDevice(deviceOf(req)) ? await tabOf(session, deviceOf(req)) : null,
  });
});

router.get('/t/:token/tab', async (req, res) => {
  const found = await withTable(req, res);
  if (!found) return;
  const session = await openSessionOf(found.table.id);
  res.json({ tab: session && validDevice(deviceOf(req)) ? await tabOf(session, deviceOf(req)) : null });
});

router.post('/t/:token/orders', async (req, res) => {
  const deviceId = deviceOf(req);
  if (!validDevice(deviceId)) return res.status(400).json({ error: 'Please reload the page and try again.' });
  const found = await withTable(req, res);
  if (!found) return;
  const { table, place } = found;
  if (!isOpenNow(place)) return res.status(409).json({ error: `${place.name} is closed right now.` });
  if (limited('orderPerDevice', deviceId) || limited('orderPerTable', table.id)) {
    return res.status(429).json({ error: 'Too many orders at once. Wait a moment or call your waiter.' });
  }
  const { lat, lng } = req.body || {};
  let distance = null;
  if (Number.isFinite(lat) && Number.isFinite(lng) && place.lat != null && place.lng != null) {
    distance = distanceM({ lat, lng }, { lat: Number(place.lat), lng: Number(place.lng) });
    if (distance > FAR_M) return res.status(403).json({ error: `You seem to be far from ${place.name}. Ku Meza orders are only for people at the table.` });
  }

  const menu = new Map((await menuFor(table.place_type, table.place_id)).map((d) => [d.id, d]));
  const lines = (req.body?.items || []).slice(0, 30).map((i) => ({ dish: menu.get(String(i.menuItemId)), qty: Math.min(Math.max(parseInt(i.qty, 10) || 0, 0), 20), notes: String(i.notes || '').slice(0, 200) }));
  if (!lines.length || lines.some((l) => !l.qty)) return res.status(400).json({ error: 'Your order is empty.' });
  if (lines.some((l) => !l.dish)) return res.status(409).json({ error: 'Some dishes are not available any more. Please check your order.' });
  const total = lines.reduce((s, l) => s + l.dish.price * l.qty, 0);

  const db = await getClient();
  let status;
  try {
    await db.query('begin');
    // One open session per table: the first order opens it, later ones join it.
    let { rows: [session] } = await db.query("select * from table_sessions where table_id = $1 and status = 'open' for update", [table.id]);
    if (!session) {
      ({ rows: [session] } = await db.query(
        `insert into table_sessions (table_id, place_type, place_id) values ($1, $2, $3)
         on conflict do nothing returning *`, [table.id, table.place_type, table.place_id]));
      if (!session) ({ rows: [session] } = await db.query("select * from table_sessions where table_id = $1 and status = 'open'", [table.id]));
    }
    await db.query('insert into table_devices (session_id, device_id, distance_m) values ($1, $2, $3) on conflict do nothing', [session.id, deviceId, distance]);
    const { rows: [dev] } = await db.query('select status from table_devices where session_id = $1 and device_id = $2', [session.id, deviceId]);
    if (dev.status === 'blocked') { await db.query('rollback'); return res.status(403).json({ error: 'The waiter could not confirm you at this table. Please call a waiter.' }); }
    status = dev.status === 'confirmed' ? 'placed' : 'needs_confirm';
    const { rows: [order] } = await db.query(
      `insert into table_orders (session_id, table_id, place_type, place_id, device_id, status, total)
       values ($1, $2, $3, $4, $5, $6, $7) returning id`,
      [session.id, table.id, table.place_type, table.place_id, deviceId, status, total]);
    for (const l of lines) {
      await db.query(
        'insert into table_order_items (order_id, menu_item_id, name, price, qty, notes, station) values ($1, $2, $3, $4, $5, $6, $7)',
        [order.id, l.dish.id, l.dish.name, l.dish.price, l.qty, l.notes || null, stationOf(l.dish)]);
    }
    await db.query('commit');
  } catch (e) {
    await db.query('rollback').catch(() => {});
    throw e;
  } finally { db.release(); }

  publish(placeKey(table), { type: status === 'needs_confirm' ? 'needs_confirm' : 'new_order', table: table.label });
  res.status(201).json({ tab: await tabOf(await openSessionOf(table.id), deviceId) });
});

router.post('/t/:token/orders/:id/cancel', async (req, res) => {
  const found = await withTable(req, res);
  if (!found) return;
  // The change window: only until the kitchen starts it (spec §7.4).
  const { rowCount } = await query(
    `update table_orders set status = 'cancelled' where id = $1 and table_id = $2 and device_id = $3
     and status in ('needs_confirm', 'placed', 'accepted')`, [req.params.id, found.table.id, deviceOf(req)]);
  if (!rowCount) return res.status(409).json({ error: 'The kitchen has already started this order. Please ask your waiter.' });
  publish(placeKey(found.table), { type: 'cancelled', table: found.table.label });
  res.json({ tab: await tabOf(await openSessionOf(found.table.id), deviceOf(req)) });
});

router.post('/t/:token/requests', async (req, res) => {
  const type = req.body?.type === 'bill' ? 'bill' : 'call_waiter';
  const deviceId = deviceOf(req);
  const found = await withTable(req, res);
  if (!found) return;
  const session = await openSessionOf(found.table.id);
  const { rows: [dev] } = session ? await query('select status from table_devices where session_id = $1 and device_id = $2', [session.id, deviceId]) : { rows: [] };
  if (dev?.status !== 'confirmed') return res.status(403).json({ error: 'Your waiter will be with you as soon as your first order is confirmed.' });
  if (limited('requestPerDevice', deviceId)) return res.status(429).json({ error: 'Your waiter has already been called.' });
  const { rows: [open] } = await query('select id from service_requests where session_id = $1 and type = $2 and handled_at is null', [session.id, type]);
  if (!open) {
    await query('insert into service_requests (session_id, table_id, place_type, place_id, type) values ($1, $2, $3, $4, $5)',
      [session.id, found.table.id, found.table.place_type, found.table.place_id, type]);
  }
  if (type === 'bill') await query('update table_sessions set bill_requested_at = coalesce(bill_requested_at, now()) where id = $1', [session.id]);
  publish(placeKey(found.table), { type, table: found.table.label });
  res.json({ tab: await tabOf(await openSessionOf(found.table.id), deviceId) });
});

module.exports = router;
