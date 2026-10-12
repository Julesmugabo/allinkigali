/**
 * pendingListings.js — Restaurant/coffee shop owner self-registration.
 * Anyone with an account can submit a short application. Director approves/declines.
 */
const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// POST /pending-listings — submit an application (requires account)
router.post('/', requireAuth, async (req, res) => {
  const { type, businessName, location, district, phone, email, notes } = req.body || {};
  if (!type || !businessName || !location || !phone || !email) {
    return res.status(400).json({ error: 'type, businessName, location, phone and email are required.' });
  }
  if (!['restaurant', 'coffeeshop'].includes(type)) {
    return res.status(400).json({ error: 'type must be restaurant or coffeeshop.' });
  }
  // Check not already pending
  const { rows: existing } = await query(
    `SELECT id FROM pending_listings WHERE user_id=$1 AND status='pending'`,
    [req.user.sub]
  );
  if (existing.length) {
    return res.status(409).json({ error: 'You already have a pending application. We will contact you soon.' });
  }
  const { rows } = await query(
    `INSERT INTO pending_listings (type, business_name, location, district, phone, email, notes, user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [type, businessName.trim(), location.trim(), district?.trim() || '', phone.trim(), email.trim().toLowerCase(), notes?.trim() || '', req.user.sub]
  );
  res.status(201).json(rows[0]);
});

// GET /pending-listings/mine — applicant checks their own status
router.get('/mine', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM pending_listings WHERE user_id=$1 ORDER BY created_at DESC`,
    [req.user.sub]
  );
  res.json(rows);
});

// Director routes
const directorGuard = [requireAuth, requireRole('director')];

// GET /pending-listings — all applications
router.get('/', ...directorGuard, async (_req, res) => {
  const { rows } = await query(
    `SELECT pl.*, u.email as user_email, u.first_name, u.last_name
     FROM pending_listings pl
     LEFT JOIN users u ON pl.user_id = u.id
     ORDER BY pl.created_at DESC`
  );
  res.json(rows);
});

// POST /pending-listings/:id/approve — approve and create the listing
router.post('/:id/approve', ...directorGuard, async (req, res) => {
  const { rows: pending } = await query('SELECT * FROM pending_listings WHERE id=$1', [req.params.id]);
  if (!pending[0]) return res.status(404).json({ error: 'Application not found.' });
  const p = pending[0];
  if (p.status !== 'pending') return res.status(400).json({ error: 'Already processed.' });

  let listingId;
  if (p.type === 'restaurant') {
    const { rows } = await query(
      `INSERT INTO restaurants (name, location, district, phone, open_status, cuisines, foods, occasion, atmosphere, dietary, seating, features, photos, rating)
       VALUES ($1,$2,$3,$4,'Open now','{}','{}','{}','{}','{}','{}','{}','{}',4.0) RETURNING id`,
      [p.business_name, p.location, p.district, p.phone]
    );
    listingId = rows[0].id;
  } else {
    const { rows } = await query(
      `INSERT INTO coffee_shops (name, location, district, phone, open_status, specialties, features, atmosphere, photos, rating)
       VALUES ($1,$2,$3,$4,'Open now','{}','{}','{}','{}',4.0) RETURNING id`,
      [p.business_name, p.location, p.district, p.phone]
    );
    listingId = rows[0].id;
  }

  // Link the owner's account
  const roleCol = p.type === 'restaurant' ? 'restaurant_id' : 'coffee_shop_id';
  const role = p.type === 'restaurant' ? 'restaurant' : 'coffeeshop';
  await query(
    `UPDATE users SET role=$1, ${roleCol}=$2 WHERE id=$3`,
    [role, listingId, p.user_id]
  );

  // Mark application approved
  await query(
    `UPDATE pending_listings SET status='approved', created_listing_id=$1, updated_at=NOW() WHERE id=$2`,
    [listingId, p.id]
  );

  // Notify the owner
  await query(
    `INSERT INTO notifications (user_id, title, body, type)
     VALUES ($1,$2,$3,'listing_approved')`,
    [p.user_id,
     '🎉 Your listing has been approved!',
     `${p.business_name} is now live on allinkigali. Log in to set up your dashboard — add photos, menu and more.`]
  );

  res.json({ ok: true, listingId });
});

// POST /pending-listings/:id/decline
router.post('/:id/decline', ...directorGuard, async (req, res) => {
  const { reason } = req.body || {};
  const { rows: pending } = await query('SELECT * FROM pending_listings WHERE id=$1', [req.params.id]);
  if (!pending[0]) return res.status(404).json({ error: 'Not found.' });
  const p = pending[0];
  if (p.status !== 'pending') return res.status(400).json({ error: 'Already processed.' });

  await query(
    `UPDATE pending_listings SET status='declined', decline_reason=$1, updated_at=NOW() WHERE id=$2`,
    [reason || '', p.id]
  );

  await query(
    `INSERT INTO notifications (user_id, title, body, type)
     VALUES ($1,$2,$3,'listing_declined')`,
    [p.user_id,
     'Your listing application was not approved',
     reason || 'Thank you for applying. Unfortunately we could not approve your listing at this time. Please contact us for more information.']
  );

  res.json({ ok: true });
});

module.exports = router;
