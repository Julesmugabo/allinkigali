const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const { notifyUser } = require('../pushNotifications');

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function pushNotification(userId, title, body, type, data = {}) {
  if (!userId) return;
  notifyUser(userId, { title, body, data: { ...data, type } }).catch(() => {});
}

// Find the user_id of any admin who has the given role assigned to them.
// Used to notify the restaurant/coffee-shop admin of a new booking.
async function getAdminWithRole(role) {
  const { rows } = await query(
    'SELECT id FROM users WHERE role = $1 LIMIT 1',
    [role]
  );
  return rows[0]?.id || null;
}

function toJson(row) {
  return {
    id: row.id,
    type: row.type,
    placeId: row.place_id,
    placeName: row.place_name,
    userId: row.user_id,
    guestName: row.guest_name,
    guestPhone: row.guest_phone,
    date: row.date,
    time: row.time,
    partySize: row.party_size,
    notes: row.notes,
    status: row.status,
    noshowCount: row.noshow_count,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
  };
}

// ── Customer routes ───────────────────────────────────────────────────────────

// POST /resto-bookings — any logged-in user can book
router.post('/', requireAuth, async (req, res) => {
  const { type, placeId, placeName, guestName, guestPhone, date, time, partySize, notes } = req.body;
  if (!type || !placeId || !placeName || !guestName || !guestPhone || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const { rows } = await query(
    `INSERT INTO resto_bookings
      (type, place_id, place_name, user_id, guest_name, guest_phone, date, time, party_size, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [type, placeId, placeName, req.user.sub, guestName, guestPhone, date, time, partySize || 2, notes || '']
  );
  const booking = rows[0];

  // Notify the relevant admin
  const adminRole = type === 'restaurant' ? 'restaurant' : 'coffeeshop';
  // Also notify the owner linked by restaurant_id / coffee_shop_id
  const adminId = await getAdminWithRole(adminRole);
  await pushNotification(
    adminId,
    `New booking — ${placeName}`,
    `${guestName} · ${partySize || 2} people · ${date} at ${time}`,
    'new_booking',
    { bookingId: booking.id, placeId, type }
  );

  res.status(201).json(toJson(booking));
});

// GET /resto-bookings/mine — customer sees their own bookings
router.get('/mine', requireAuth, async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM resto_bookings WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.sub]
  );
  res.json(rows.map(toJson));
});

// DELETE /resto-bookings/:id — customer cancels their own booking
router.delete('/:id', requireAuth, async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM resto_bookings WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.sub]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  const booking = rows[0];
  if (['confirmed','pending'].includes(booking.status)) {
    await query('UPDATE resto_bookings SET status=$1, updated_at=NOW() WHERE id=$2', ['cancelled', booking.id]);
    // Notify restaurant owner
    const adminRole = booking.type === 'restaurant' ? 'restaurant' : 'coffeeshop';
    const adminId = await getAdminWithRole(adminRole);
    await pushNotification(
      adminId,
      `Booking cancelled — ${booking.place_name}`,
      `${booking.guest_name} cancelled their reservation for ${booking.date} at ${booking.time}.`,
      'booking_cancelled',
      { bookingId: booking.id }
    );
  }
  res.json({ ok: true });
});

// ── Admin routes ──────────────────────────────────────────────────────────────

// GET /resto-bookings/admin?type=restaurant&placeId=r1
router.get('/admin', requireAuth, async (req, res) => {
  const { type, placeId } = req.query;
  // Check the caller has the right role
  const role = req.user.role;
  const allowed = (type === 'restaurant' && role === 'restaurant')
               || (type === 'coffee_shop' && role === 'coffeeshop')
               || role === 'director';
  if (!allowed) return res.status(403).json({ error: 'Forbidden.' });

  let sql = 'SELECT * FROM resto_bookings WHERE 1=1';
  const params = [];
  if (type) { params.push(type); sql += ` AND type=$${params.length}`; }
  if (placeId) { params.push(placeId); sql += ` AND place_id=$${params.length}`; }
  sql += ' ORDER BY created_at DESC';

  const { rows } = await query(sql, params);
  res.json(rows.map(toJson));
});

// PUT /resto-bookings/:id/status — admin confirms / rejects / marks noshow
router.put('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  const allowed = ['confirmed','rejected','completed','noshow'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  const { rows } = await query('SELECT * FROM resto_bookings WHERE id=$1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  const booking = rows[0];

  // Role check
  const role = req.user.role;
  const ok = (booking.type === 'restaurant' && role === 'restaurant')
           || (booking.type === 'coffee_shop' && role === 'coffeeshop')
           || role === 'director';
  if (!ok) return res.status(403).json({ error: 'Forbidden.' });

  const updates = ['status=$1', 'updated_at=NOW()'];
  const params = [status];
  if (status === 'confirmed') { updates.push('confirmed_at=NOW()'); }
  if (status === 'noshow') { updates.push('noshow_count=noshow_count+1'); }

  const { rows: updated } = await query(
    `UPDATE resto_bookings SET ${updates.join(',')} WHERE id=$${params.length + 1} RETURNING *`,
    [...params, booking.id]
  );

  // Notify the customer
  if (booking.user_id) {
    if (status === 'confirmed') {
      await pushNotification(
        booking.user_id,
        `Booking confirmed — ${booking.place_name}`,
        `${booking.date} at ${booking.time} · ${booking.party_size} people. See you there!`,
        'booking_confirmed',
        { bookingId: booking.id }
      );
    } else if (status === 'rejected') {
      await pushNotification(
        booking.user_id,
        `Booking declined — ${booking.place_name}`,
        `Your reservation for ${booking.date} at ${booking.time} could not be accommodated.`,
        'booking_rejected',
        { bookingId: booking.id }
      );
    }
  }

  res.json(toJson(updated[0]));
});

module.exports = router;
