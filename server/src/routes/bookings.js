/**
 * bookings.js (routes) — replaces BookingContext's in-memory state.
 * Every route stays open (no requireAuth/requireRole anywhere in this
 * file) — bookings don't identify a customer at all (no real customer
 * accounts exist yet) and nothing here carries the kind of trust weight
 * businesses.verified does, so there's nothing to genuinely lock down,
 * same as the in-memory version had no access control either.
 */
const express = require('express');
const { query } = require('../db');

const router = express.Router();

function bookingToJson(row) {
  return {
    id: row.id,
    ref: row.ref,
    businessId: row.business_id,
    businessName: row.business_name,
    itemLabel: row.item_label,
    priceFrom: row.price_from === null ? null : Number(row.price_from),
    priceUnit: row.price_unit,
    currency: row.currency,
    quantity: row.quantity,
    date: row.date,
    note: row.note,
    paymentMethod: row.payment_method,
    status: row.status,
    respondedAt: row.responded_at,
    createdAt: row.created_at,
  };
}

router.get('/', async (_req, res) => {
  const { rows } = await query('select * from bookings order by created_at desc');
  res.json(rows.map(bookingToJson));
});

router.post('/', async (req, res) => {
  const {
    ref, businessId, businessName, itemLabel, priceFrom, priceUnit, currency, quantity, date, note,
  } = req.body || {};

  if (!businessId || !businessName) {
    return res.status(400).json({ error: 'businessId and businessName are required.' });
  }

  const { rows } = await query(
    `insert into bookings
      (ref, business_id, business_name, item_label, price_from, price_unit, currency, quantity, date, note, payment_method, status)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, null, 'new')
     returning *`,
    [ref, businessId, businessName, itemLabel || null, priceFrom ?? null, priceUnit || null, currency || null, quantity || 1, date || null, note || '']
  );
  res.status(201).json(bookingToJson(rows[0]));
});

router.patch('/:id', async (req, res) => {
  const { status } = req.body || {};
  if (!['new', 'handled', 'no_response'].includes(status)) {
    return res.status(400).json({ error: 'status must be new, handled, or no_response.' });
  }
  const { rows } = await query(
    'update bookings set status = $1, responded_at = now() where id = $2 returning *',
    [status, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Booking not found.' });
  res.json(bookingToJson(rows[0]));
});

module.exports = router;
