/**
 * reviews.js — public reviews for restaurants, coffee shops and wedding
 * venues. Anyone can read them; a signed-in guest can leave one review per
 * place (posting again updates it). Owners reply from /my-restaurant.
 */
const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const PLACE_TYPES = ['restaurant', 'coffee_shop', 'wedding'];

// GET /reviews?placeType=restaurant&placeId=r1 — newest first, plus a summary.
router.get('/', async (req, res) => {
  const { placeType, placeId } = req.query;
  if (!PLACE_TYPES.includes(placeType) || !placeId) {
    return res.status(400).json({ error: 'placeType and placeId are required.' });
  }
  const { rows } = await query(
    `SELECT r.id, r.rating, r.text, r.owner_reply, r.created_at,
            COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), 'Guest') AS guest_name
     FROM reviews r LEFT JOIN users u ON u.id::text = r.user_id
     WHERE r.place_type = $1 AND r.place_id = $2
     ORDER BY r.created_at DESC`,
    [placeType, String(placeId)]
  );
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of rows) { counts[Math.round(Number(r.rating))] += 1; sum += Number(r.rating); }
  res.json({
    count: rows.length,
    average: rows.length ? Math.round((sum / rows.length) * 10) / 10 : null,
    counts,
    reviews: rows.map((r) => ({
      id: r.id, rating: Number(r.rating), text: r.text, guestName: r.guest_name,
      ownerReply: r.owner_reply, date: r.created_at,
    })),
  });
});

// POST /reviews — { placeType, placeId, rating 1-5, text }
router.post('/', requireAuth, async (req, res) => {
  const { placeType, placeId, text } = req.body || {};
  const rating = Number(req.body?.rating);
  if (!PLACE_TYPES.includes(placeType) || !placeId) {
    return res.status(400).json({ error: 'placeType and placeId are required.' });
  }
  if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ error: 'Rating must be 1 to 5.' });
  const userId = String(req.user.sub);
  const existing = await query(
    'SELECT id FROM reviews WHERE place_type=$1 AND place_id=$2 AND user_id=$3',
    [placeType, String(placeId), userId]
  );
  if (existing.rows.length) {
    await query('UPDATE reviews SET rating=$1, text=$2, created_at=NOW() WHERE id=$3',
      [Math.round(rating), (text || '').trim(), existing.rows[0].id]);
  } else {
    await query('INSERT INTO reviews (place_type, place_id, user_id, rating, text) VALUES ($1,$2,$3,$4,$5)',
      [placeType, String(placeId), userId, Math.round(rating), (text || '').trim()]);
  }
  res.status(existing.rows.length ? 200 : 201).json({ ok: true, updated: !!existing.rows.length });
});

module.exports = router;
