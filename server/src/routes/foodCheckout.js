/**
 * foodCheckout.js — the website's Order Food flow.
 *
 *   GET  /food-orders/catalog        every available dish of every place that
 *                                    delivers, with how often it was ordered
 *   POST /food-orders/checkout       one checkout → one order per place
 *   GET  /food-orders/checkout/:id   the orders of one checkout (status page)
 *
 * Checkout never trusts prices from the browser: it reloads each dish, checks
 * the place delivers, is open and the minimum is reached, and creates all the
 * orders together (or none). If prices changed since the cart was filled it
 * answers 409 with the current prices so the customer can confirm.
 */
const express = require('express');
const { query, getClient } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireVerified = require('../middleware/requireVerified');
const { notifyUser } = require('../pushNotifications');
const { placeOwnerIds } = require('../clients/placeOwners');

const router = express.Router();

const PLACES = {
  restaurant: { table: 'restaurants', menu: 'restaurant_menu_items', fk: 'restaurant_id' },
  coffeeshop: { table: 'coffee_shops', menu: 'coffee_shop_menu_items', fk: 'coffee_shop_id' },
};

router.get('/catalog', async (_req, res) => {
  const [resto, cafe, popular] = await Promise.all([
    query(`SELECT m.id::text, m.restaurant_id AS place_id, 'restaurant' AS place_type, m.category, m.name,
                  m.description, m.price, m.photo_url, m.sort_order
           FROM restaurant_menu_items m JOIN restaurants r ON r.id = m.restaurant_id
           WHERE m.available AND r.delivery_enabled`),
    query(`SELECT m.id::text, m.coffee_shop_id AS place_id, 'coffeeshop' AS place_type, m.category, m.name,
                  m.description, m.price, m.photo_url, m.sort_order
           FROM coffee_shop_menu_items m JOIN coffee_shops c ON c.id = m.coffee_shop_id
           WHERE m.available AND c.delivery_enabled`),
    query(`SELECT o.place_id, i->>'id' AS item_id, SUM(COALESCE((i->>'qty')::int, 1)) AS n
           FROM food_orders o, jsonb_array_elements(o.items) i
           WHERE o.status <> 'cancelled' AND o.created_at > NOW() - INTERVAL '90 days'
           GROUP BY 1, 2`),
  ]);
  const ordered = new Map(popular.rows.map((r) => [`${r.place_id}:${r.item_id}`, Number(r.n)]));
  res.json([...resto.rows, ...cafe.rows].map((m) => ({
    id: m.id, placeId: m.place_id, placeType: m.place_type, category: m.category || 'Menu',
    name: m.name, description: m.description || '', price: Number(m.price), photoUrl: m.photo_url || null,
    sortOrder: m.sort_order || 0, orders: ordered.get(`${m.place_id}:${m.id}`) || 0,
  })));
});

// Rebuilds one place's part of the order from the database.
async function priceGroup(group) {
  const kind = PLACES[group.placeType];
  if (!kind) throw Object.assign(new Error('Unknown place type.'), { status: 400 });
  const { rows: [place] } = await query(
    `SELECT id, name, delivery_enabled, delivery_fee, min_order, open_status FROM ${kind.table} WHERE id=$1`, [group.placeId]);
  if (!place || !place.delivery_enabled) throw Object.assign(new Error(`${place?.name || 'This place'} isn't delivering right now.`), { status: 409 });
  if (!/^open/i.test(place.open_status || 'Open now')) throw Object.assign(new Error(`${place.name} is closed right now.`), { status: 409 });

  const wanted = (group.items || []).filter((i) => i.id && Number(i.qty) > 0);
  if (!wanted.length) throw Object.assign(new Error(`Nothing to order from ${place.name}.`), { status: 400 });
  const { rows: menu } = await query(
    `SELECT id::text, name, price, available FROM ${kind.menu} WHERE ${kind.fk}=$1 AND id::text = ANY($2)`,
    [place.id, wanted.map((i) => String(i.id))]);
  const byId = new Map(menu.map((m) => [m.id, m]));
  const gone = wanted.filter((i) => !byId.get(String(i.id))?.available);
  if (gone.length) throw Object.assign(new Error(`Some dishes at ${place.name} are sold out. Remove them and try again.`), { status: 409, soldOut: gone.map((i) => i.id) });

  const items = wanted.map((i) => {
    const m = byId.get(String(i.id));
    return { id: m.id, name: m.name, price: Number(m.price), qty: Math.min(Number(i.qty), 99), note: String(i.note || '').slice(0, 200) };
  });
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  if (subtotal < Number(place.min_order || 0)) {
    throw Object.assign(new Error(`${place.name} needs a minimum order of ${place.min_order} RWF.`), { status: 409 });
  }
  const deliveryFee = Number(place.delivery_fee || 0);
  return { place, placeType: group.placeType, items, subtotal, deliveryFee, total: subtotal + deliveryFee, expected: group.expectedSubtotal };
}

router.post('/checkout', requireAuth, requireVerified, async (req, res) => {
  const { groups, address, landmark, phone, notes } = req.body || {};
  if (!Array.isArray(groups) || !groups.length) return res.status(400).json({ error: 'Your order is empty.' });
  if (!String(address || '').trim() || !String(phone || '').trim()) return res.status(400).json({ error: 'Add your delivery address and phone.' });

  let priced;
  try { priced = await Promise.all(groups.map(priceGroup)); } catch (e) {
    return res.status(e.status || 500).json({ error: e.message, soldOut: e.soldOut });
  }
  // Prices moved since the cart was filled: show the customer the new amounts first.
  if (priced.some((g) => g.expected != null && Number(g.expected) !== g.subtotal)) {
    return res.status(409).json({ error: 'Some prices changed. Please check your order.', quote: priced.map((g) => ({ placeId: g.place.id, items: g.items, subtotal: g.subtotal })) });
  }

  const client = await getClient();
  let orders;
  try {
    await client.query('BEGIN');
    const { rows: [{ id: checkoutId }] } = await client.query('SELECT gen_random_uuid()::text AS id');
    orders = [];
    for (const g of priced) {
      const { rows: [o] } = await client.query(
        `INSERT INTO food_orders (user_id, place_id, place_name, place_type, items, subtotal, delivery_fee, total,
           delivery_address, delivery_phone, notes, payment_method, checkout_id, landmark)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'cash',$12,$13) RETURNING *`,
        [req.user.sub, g.place.id, g.place.name, g.placeType, JSON.stringify(g.items), g.subtotal, g.deliveryFee, g.total,
         String(address).trim(), String(phone).trim(), [String(landmark || '').trim() && `Landmark: ${String(landmark).trim()}`, String(notes || '').trim()].filter(Boolean).join(' · '),
         checkoutId, String(landmark || '').trim() || null]);
      orders.push(o);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }

  // Each place's owners and managers hear about their own order only.
  for (const o of orders) {
    for (const ownerId of await placeOwnerIds(o.place_type, o.place_id)) {
      notifyUser(ownerId, {
        title: 'New delivery order!',
        body: `Order #${o.id.slice(-6).toUpperCase()} — ${o.items.length} item(s) to ${o.delivery_address}`,
        data: { type: 'new_order', orderId: o.id },
      }).catch(() => {});
    }
  }
  res.status(201).json({ checkoutId: orders[0].checkout_id, orders: orders.map(toJson) });
});

router.get('/checkout/:id', requireAuth, async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM food_orders WHERE checkout_id=$1 AND user_id=$2 ORDER BY created_at', [req.params.id, req.user.sub]);
  if (!rows.length) return res.status(404).json({ error: 'Order not found.' });
  res.json(rows.map(toJson));
});

function toJson(o) {
  return {
    id: o.id, code: o.id.slice(-6).toUpperCase(), checkoutId: o.checkout_id, placeId: o.place_id, placeName: o.place_name,
    placeType: o.place_type, status: o.status, items: o.items, subtotal: o.subtotal, deliveryFee: o.delivery_fee,
    total: o.total, address: o.delivery_address, landmark: o.landmark, createdAt: o.created_at, updatedAt: o.updated_at,
  };
}

module.exports = router;
