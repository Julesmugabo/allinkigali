/**
 * store.js — reading Ku Meza's state: a place's menu, a table from its QR
 * token, a table's running tab, the waiter board and the kitchen queue.
 */
const { query } = require('../db');
const { placeInfo } = require('../clients/places');

const MENU = {
  restaurant: { table: 'restaurant_menu_items', fk: 'restaurant_id' },
  coffeeshop: { table: 'coffee_shop_menu_items', fk: 'coffee_shop_id' },
};
const LIVE_STATUSES = ['needs_confirm', 'placed', 'accepted', 'preparing', 'ready', 'served'];

async function menuFor(placeType, placeId) {
  const m = MENU[placeType];
  if (!m) return [];
  const { rows } = await query(
    `select id::text, category, name, description, price, photo_url, sort_order from ${m.table}
     where ${m.fk} = $1 and available order by sort_order, category, name`, [placeId]);
  return rows.map((r) => ({ id: r.id, category: r.category || 'Menu', name: r.name, description: r.description || '', price: Number(r.price), photoUrl: r.photo_url || null }));
}

async function tableByToken(token) {
  const { rows: [t] } = await query('select * from place_tables where qr_token = $1 and active', [String(token || '')]);
  if (!t) return null;
  const place = await placeInfo(t.place_type, t.place_id);
  return place ? { table: t, place } : null;
}

const openSessionOf = async (tableId) => (await query("select * from table_sessions where table_id = $1 and status = 'open'", [tableId])).rows[0] || null;

async function ordersOf(sessionIds) {
  if (!sessionIds.length) return [];
  const { rows: orders } = await query(
    'select * from table_orders where session_id = any($1) order by placed_at', [sessionIds]);
  if (!orders.length) return [];
  const { rows: items } = await query('select * from table_order_items where order_id = any($1)', [orders.map((o) => o.id)]);
  return orders.map((o) => ({
    id: o.id, sessionId: o.session_id, tableId: o.table_id, deviceId: o.device_id, status: o.status, total: o.total,
    placedAt: o.placed_at, acceptedAt: o.accepted_at, readyAt: o.ready_at, servedAt: o.served_at, acceptedBy: o.accepted_by,
    readyStations: o.ready_stations || [],
    items: items.filter((i) => i.order_id === o.id).map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, notes: i.notes, station: i.station })),
  }));
}

const openRequests = async (sessionIds) => (sessionIds.length
  ? (await query('select * from service_requests where session_id = any($1) and handled_at is null order by created_at', [sessionIds])).rows
  : []);

// What the customer sees: the table's running tab (every phone's orders).
async function tabOf(session, deviceId) {
  if (!session) return null;
  const orders = await ordersOf([session.id]);
  const requests = await openRequests([session.id]);
  const { rows: [me] } = await query('select status from table_devices where session_id = $1 and device_id = $2', [session.id, deviceId]);
  const counted = orders.filter((o) => LIVE_STATUSES.includes(o.status) && o.status !== 'needs_confirm');
  return {
    sessionId: session.id, openedAt: session.opened_at, billRequested: !!session.bill_requested_at,
    myStatus: me?.status || null,
    orders: orders.map((o) => ({ ...o, mine: o.deviceId === deviceId, deviceId: undefined })),
    total: counted.reduce((s, o) => s + o.total, 0),
    waiterCalled: requests.some((r) => r.type === 'call_waiter'),
  };
}

// The waiter board: every active table, with its open session if any.
async function boardOf(placeType, placeId) {
  const { rows: tables } = await query(
    `select t.id, t.label, t.section_id, s.name as section from place_tables t left join place_sections s on s.id = t.section_id
     where t.place_type = $1 and t.place_id = $2 and t.active order by s.sort_order nulls last, t.label`, [placeType, placeId]);
  const { rows: sessions } = await query(
    "select * from table_sessions where place_type = $1 and place_id = $2 and status = 'open'", [placeType, placeId]);
  const ids = sessions.map((s) => s.id);
  const [orders, requests] = await Promise.all([ordersOf(ids), openRequests(ids)]);
  return tables.map((t) => {
    const s = sessions.find((x) => x.table_id === t.id);
    const mine = s ? orders.filter((o) => o.sessionId === s.id) : [];
    const counted = mine.filter((o) => LIVE_STATUSES.includes(o.status) && o.status !== 'needs_confirm');
    return {
      id: t.id, label: t.label, sectionId: t.section_id, section: t.section,
      session: s ? {
        id: s.id, openedAt: s.opened_at, billRequested: !!s.bill_requested_at,
        orders: mine, total: counted.reduce((n, o) => n + o.total, 0),
        requests: requests.filter((r) => r.session_id === s.id).map((r) => ({ id: r.id, type: r.type, at: r.created_at })),
      } : null,
    };
  });
}

// The kitchen/bar queue: tickets in arrival order, each once — only from
// tables still seated (a paid and closed table leaves the screen).
async function kitchenOf(placeType, placeId) {
  const { rows } = await query(
    `select o.id from table_orders o join table_sessions s on s.id = o.session_id and s.status = 'open'
     where o.place_type = $1 and o.place_id = $2
       and (o.status in ('placed', 'accepted', 'preparing') or (o.status = 'ready' and o.ready_at > now() - interval '20 minutes'))
     order by o.placed_at`, [placeType, placeId]);
  if (!rows.length) return [];
  const { rows: meta } = await query(
    'select o.id, o.session_id, t.label from table_orders o join place_tables t on t.id = o.table_id where o.id = any($1)', [rows.map((r) => r.id)]);
  const orders = await ordersOf([...new Set(meta.map((m) => m.session_id))]);
  const wanted = new Set(rows.map((r) => r.id));
  return orders.filter((o) => wanted.has(o.id)).map((o) => ({ ...o, table: meta.find((m) => m.id === o.id)?.label }));
}

module.exports = { menuFor, tableByToken, openSessionOf, tabOf, boardOf, kitchenOf, ordersOf, LIVE_STATUSES };
