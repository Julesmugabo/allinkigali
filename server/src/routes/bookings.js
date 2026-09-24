/**
 * bookings.js (routes) — replaces BookingContext's in-memory state.
 *
 * Anyone can still send a request (signed in or not), but who can READ or
 * UPDATE requests is now limited, since they contain customers' names of
 * services, dates and notes:
 *   - a sellers/director admin sees and updates every request;
 *   - a signed-in person sees requests they sent, plus requests sent to a
 *     business they own (owner_id is stored as text, hence the cast);
 *   - a signed-out visitor sees none.
 */
const express = require('express');
const { query } = require('../db');
const { attachUserIfPresent, requireAuth } = require('../middleware/auth');

const router = express.Router();

const isBookingAdmin = (user) => Boolean(user && (user.role === 'sellers' || user.role === 'director'));

function bookingToJson(row) {
  return {
    id: row.id,
    ref: row.ref,
    businessId: row.business_id,
    businessName: row.business_name,
    customerId: row.customer_id,
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

router.get('/', attachUserIfPresent, async (req, res) => {
  const user = req.user;
  if (!user) return res.json([]);

  const { rows } = isBookingAdmin(user)
    ? await query('select * from bookings order by created_at desc')
    : await query(
        `select bk.* from bookings bk
         left join businesses b on b.id = bk.business_id
         where bk.customer_id = $1 or b.owner_id = $1::text
         order by bk.created_at desc`,
        [user.sub]
      );
  res.json(rows.map(bookingToJson));
});

router.post('/', attachUserIfPresent, async (req, res) => {
  const {
    ref, businessId, businessName, itemLabel, priceFrom, priceUnit, currency, quantity, date, note,
  } = req.body || {};

  if (!businessId || !businessName) {
    return res.status(400).json({ error: 'businessId and businessName are required.' });
  }

  const { rows } = await query(
    `insert into bookings
      (ref, business_id, business_name, customer_id, item_label, price_from, price_unit, currency, quantity, date, note, payment_method, status)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, null, 'new')
     returning *`,
    [
      ref, businessId, businessName, req.user ? req.user.sub : null, itemLabel || null,
      priceFrom ?? null, priceUnit || null, currency || null, quantity || 1, date || null, note || '',
    ]
  );
  res.status(201).json(bookingToJson(rows[0]));
});

// Only the business that received the request (or an admin) may mark it
// handled / no response.
router.patch('/:id', requireAuth, async (req, res) => {
  const { status } = req.body || {};
  if (!['new', 'handled', 'no_response'].includes(status)) {
    return res.status(400).json({ error: 'status must be new, handled, or no_response.' });
  }

  if (!isBookingAdmin(req.user)) {
    const { rows: allowed } = await query(
      `select 1 from bookings bk join businesses b on b.id = bk.business_id
       where bk.id = $1 and b.owner_id = $2::text`,
      [req.params.id, req.user.sub]
    );
    if (!allowed[0]) return res.status(403).json({ error: 'Not allowed.' });
  }

  const { rows } = await query(
    'update bookings set status = $1, responded_at = now() where id = $2 returning *',
    [status, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Booking not found.' });
  res.json(bookingToJson(rows[0]));
});

module.exports = router;
