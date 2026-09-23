/**
 * orders.js (routes) — replaces OrdersContext's in-memory state.
 * Same posture as bookings.js: no requireAuth/requireRole anywhere here.
 * Real customer accounts don't exist yet (UserContext still generates fake
 * local ids), so there's no real customer identity to lock an order to —
 * matching the in-memory version, which had no access control either.
 */
const express = require('express');
const { query } = require('../db');

const router = express.Router();

function orderToJson(row) {
  return {
    id: row.id,
    ref: row.ref,
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

router.get('/', async (_req, res) => {
  const { rows } = await query('select * from orders order by created_at desc');
  res.json(rows.map(orderToJson));
});

router.get('/:id', async (req, res) => {
  const { rows } = await query('select * from orders where id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Order not found.' });
  res.json(orderToJson(rows[0]));
});

router.post('/', async (req, res) => {
  const { ref, items, subtotal, deliveryFee, total, deliveryAddress, phone, note } = req.body || {};

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'items is required.' });
  }

  const now = new Date().toISOString();
  const history = [{ status: 'pending', at: now }];

  const { rows } = await query(
    `insert into orders
      (ref, status, delivery_address, phone, note, payment_method, items, subtotal, delivery_fee, total, history)
     values ($1, 'pending', $2, $3, $4, null, $5, $6, $7, $8, $9)
     returning *`,
    [
      ref, deliveryAddress || '', phone || '', note || '',
      JSON.stringify(items), subtotal || 0, deliveryFee || 0, total || 0, JSON.stringify(history),
    ]
  );
  res.status(201).json(orderToJson(rows[0]));
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body || {};
  if (!['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const { rows: existing } = await query('select * from orders where id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Order not found.' });

  const history = [...existing[0].history, { status, at: new Date().toISOString() }];

  const { rows } = await query(
    'update orders set status = $1, history = $2 where id = $3 returning *',
    [status, JSON.stringify(history), req.params.id]
  );
  res.json(orderToJson(rows[0]));
});

module.exports = router;
