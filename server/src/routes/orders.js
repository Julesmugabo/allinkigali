/**
 * orders.js (routes) — replaces OrdersContext's in-memory state.
 *
 * Orders belong to the account that placed them (customer_id): a signed-in
 * person sees and cancels only their own orders; a sellers/director admin
 * sees all of them; a signed-out visitor sees none. Placing an order still
 * works signed out (it just isn't attached to anyone).
 */
const express = require('express');
const { query } = require('../db');
const { attachUserIfPresent, requireAuth } = require('../middleware/auth');

const router = express.Router();

const isOrderAdmin = (user) => Boolean(user && (user.role === 'sellers' || user.role === 'director'));

function orderToJson(row) {
  return {
    id: row.id,
    ref: row.ref,
    customerId: row.customer_id,
    status: row.status,
    deliveryAddress: row.delivery_address,
    phone: row.phone,
    note: row.note,
    paymentMethod: row.payment_method,
    items: row.items,
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    history: row.history,
    createdAt: row.created_at,
  };
}

router.get('/', attachUserIfPresent, async (req, res) => {
  const user = req.user;
  if (!user) return res.json([]);
  const { rows } = isOrderAdmin(user)
    ? await query('select * from orders order by created_at desc')
    : await query('select * from orders where customer_id = $1 order by created_at desc', [user.sub]);
  res.json(rows.map(orderToJson));
});

router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await query('select * from orders where id = $1', [req.params.id]);
  const row = rows[0];
  if (!row || (!isOrderAdmin(req.user) && row.customer_id !== req.user.sub)) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  res.json(orderToJson(row));
});

router.post('/', attachUserIfPresent, async (req, res) => {
  const { ref, items, subtotal, deliveryFee, total, deliveryAddress, phone, note } = req.body || {};

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'items is required.' });
  }

  const now = new Date().toISOString();
  const history = [{ status: 'pending', at: now }];

  const { rows } = await query(
    `insert into orders
      (ref, status, customer_id, delivery_address, phone, note, payment_method, items, subtotal, delivery_fee, total, history)
     values ($1, 'pending', $2, $3, $4, $5, null, $6, $7, $8, $9, $10)
     returning *`,
    [
      ref, req.user ? req.user.sub : null, deliveryAddress || '', phone || '', note || '',
      JSON.stringify(items), subtotal || 0, deliveryFee || 0, total || 0, JSON.stringify(history),
    ]
  );
  res.status(201).json(orderToJson(rows[0]));
});

router.patch('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body || {};
  if (!['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const { rows: existing } = await query('select * from orders where id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Order not found.' });
  if (!isOrderAdmin(req.user) && existing[0].customer_id !== req.user.sub) {
    return res.status(403).json({ error: 'Not allowed.' });
  }

  const history = [...existing[0].history, { status, at: new Date().toISOString() }];

  const { rows } = await query(
    'update orders set status = $1, history = $2 where id = $3 returning *',
    [status, JSON.stringify(history), req.params.id]
  );
  res.json(orderToJson(rows[0]));
});

module.exports = router;
