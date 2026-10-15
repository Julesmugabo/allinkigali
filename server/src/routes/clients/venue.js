/**
 * clients/venue.js — a wedding venue's own dashboard.
 *   GET /clients/venue            the venue's profile
 *   PUT /clients/venue            change it (only the fields sent)
 *   GET /clients/venue/reviews    reviews with guest names
 *   POST /clients/venue/reviews/:id/reply
 * Visit requests use the shared booking routes (/resto-bookings/admin and
 * /resto-bookings/:id/status), which scope a venue owner to their venue.
 */
const express = require('express');
const { query } = require('../../db');
const { requireClient } = require('../../middleware/clientAuth');

const router = express.Router();
const owner = requireClient('owner', 'manager');
const onlyVenues = (req, res, next) => (req.client.placeType === 'wedding' ? next() : res.status(404).json({ error: 'Not a wedding venue.' }));

const FIELDS = {
  name: 'name', description: 'description', location: 'location', district: 'district', phone: 'phone',
  capacity: 'capacity', price: 'price', facilities: 'facilities', views: 'views', privacy: 'privacy',
  photography: 'photography', photos: 'photos', // open_status stays with allinkigali (Sales Partners)
};
const toJson = (v) => ({
  id: v.id, name: v.name, description: v.description, location: v.location, district: v.district, phone: v.phone,
  capacity: v.capacity, price: v.price, rating: Number(v.rating), facilities: v.facilities, views: v.views,
  privacy: v.privacy, photography: v.photography, photos: v.photos, openStatus: v.open_status,
});

router.get('/', owner, onlyVenues, async (req, res) => {
  const { rows: [v] } = await query('select * from wedding_venues where id = $1', [req.client.placeId]);
  if (!v) return res.status(404).json({ error: 'Venue not found.' });
  res.json(toJson(v));
});

router.put('/', owner, onlyVenues, async (req, res) => {
  const cols = []; const vals = [];
  Object.entries(FIELDS).forEach(([key, col]) => {
    if (req.body?.[key] === undefined) return;
    vals.push(col === 'photos' ? JSON.stringify(req.body[key] || []) : req.body[key]);
    cols.push(`${col} = $${vals.length}`);
  });
  if (!cols.length) return res.status(400).json({ error: 'Nothing to change.' });
  vals.push(req.client.placeId);
  const { rows: [v] } = await query(`update wedding_venues set ${cols.join(', ')}, updated_at = now() where id = $${vals.length} returning *`, vals);
  res.json(toJson(v));
});

router.get('/reviews', owner, onlyVenues, async (req, res) => {
  const { rows } = await query(
    `select r.*, coalesce(nullif(trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')), ''), 'Guest') as guest
     from reviews r left join users u on u.id::text = r.user_id
     where r.place_type = 'wedding' and r.place_id = $1 order by r.created_at desc`, [req.client.placeId]);
  res.json(rows.map((r) => ({ id: r.id, rating: Number(r.rating), text: r.text, guestName: r.guest, date: r.created_at, ownerReply: r.owner_reply })));
});

router.post('/reviews/:id/reply', owner, onlyVenues, async (req, res) => {
  const reply = String(req.body?.reply || '').trim();
  if (!reply) return res.status(400).json({ error: 'Write a reply first.' });
  const { rowCount } = await query(
    `update reviews set owner_reply = $1, reply_at = now() where id = $2 and place_type = 'wedding' and place_id = $3`,
    [reply, req.params.id, req.client.placeId]);
  if (!rowCount) return res.status(404).json({ error: 'Review not found.' });
  res.json({ ok: true });
});

module.exports = router;
