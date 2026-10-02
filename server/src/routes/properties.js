/**
 * properties.js (routes) — Inzu Zamacye (rent) + House for Sale (sale).
 * listing_type = 'rent' | 'sale' distinguishes them.
 *
 * Public:
 *   GET  /properties              list (filters: listing_type, province, district, sector, min_beds)
 *   GET  /properties/:id          single listing
 *
 * Authenticated (any logged-in user):
 *   POST /properties              create (owner lists their house)
 *
 * Admin (role: inzuzamacye|salehouse|director):
 *   PUT    /properties/:id        full update
 *   DELETE /properties/:id        remove
 *   PATCH  /properties/:id/pin    toggle pinned
 *   PATCH  /properties/:id/status toggle rented_sold
 */
const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

function toJson(row) {
  return {
    id:          row.id,
    listingType: row.listing_type,
    title:       row.title,
    description: row.description,
    bedrooms:    row.bedrooms,
    bathrooms:   row.bathrooms,
    sizeSqm:     row.size_sqm,
    price:       Number(row.price),
    province:    row.province,
    district:    row.district,
    sector:      row.sector,
    phone:       row.phone,
    pinned:      row.pinned,
    rentedSold:  row.rented_sold,
    photos:      row.photos || [],
    createdAt:   row.created_at,
  };
}

// ── List ──────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { listing_type, province, district, sector, min_beds } = req.query;
  const conditions = [];
  const values = [];

  if (listing_type) { values.push(listing_type);         conditions.push(`listing_type = $${values.length}`); }
  if (province)     { values.push(province);             conditions.push(`province     = $${values.length}`); }
  if (district)     { values.push(district);             conditions.push(`district     = $${values.length}`); }
  if (sector)       { values.push(sector);               conditions.push(`sector       = $${values.length}`); }
  if (min_beds)     { values.push(parseInt(min_beds,10)); conditions.push(`bedrooms    >= $${values.length}`); }

  const where = conditions.length ? 'where ' + conditions.join(' and ') : '';
  const { rows } = await query(
    `select * from property_listings ${where} order by pinned desc, created_at desc`,
    values
  );
  res.json(rows.map(toJson));
});

// ── Single ────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { rows } = await query('select * from property_listings where id=$1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json(toJson(rows[0]));
});

// ── Create (any logged-in user — owner self-lists) ────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const { listingType, title, description, bedrooms, bathrooms, sizeSqm, price, province, district, sector, phone } = req.body;
  if (!listingType || !title || !price || !province || !district || !sector) {
    return res.status(400).json({ error: 'listingType, title, price, province, district, sector are required.' });
  }
  if (!['rent', 'sale'].includes(listingType)) {
    return res.status(400).json({ error: "listingType must be 'rent' or 'sale'." });
  }
  const { rows } = await query(
    `insert into property_listings
       (listing_type, title, description, bedrooms, bathrooms, size_sqm, price, province, district, sector, phone)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     returning *`,
    [listingType, title, description || null, bedrooms || 1, bathrooms || 1, sizeSqm || 0, price, province, district, sector, phone || null]
  );
  res.status(201).json(toJson(rows[0]));
});

// ── Update ────────────────────────────────────────────────────────────────────
router.put('/:id', requireAuth, requireRole('inzuzamacye', 'salehouse', 'director'), async (req, res) => {
  const { title, description, bedrooms, bathrooms, sizeSqm, price, province, district, sector, phone } = req.body;
  const { rows } = await query(
    `update property_listings set
       title=$1, description=$2, bedrooms=$3, bathrooms=$4, size_sqm=$5,
       price=$6, province=$7, district=$8, sector=$9, phone=$10, updated_at=now()
     where id=$11 returning *`,
    [title, description || null, bedrooms, bathrooms, sizeSqm, price, province, district, sector, phone || null, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json(toJson(rows[0]));
});

// ── Toggle pinned ─────────────────────────────────────────────────────────────
router.patch('/:id/pin', requireAuth, requireRole('inzuzamacye', 'salehouse', 'director'), async (req, res) => {
  const { rows } = await query(
    `update property_listings set pinned = not pinned, updated_at=now() where id=$1 returning *`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json(toJson(rows[0]));
});

// ── Toggle rented/sold status ─────────────────────────────────────────────────
router.patch('/:id/status', requireAuth, requireRole('inzuzamacye', 'salehouse', 'director'), async (req, res) => {
  const { rows } = await query(
    `update property_listings set rented_sold = not rented_sold, updated_at=now() where id=$1 returning *`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json(toJson(rows[0]));
});

// ── Replace photos array ──────────────────────────────────────────────────────
router.patch('/:id/photos', requireAuth, requireRole('inzuzamacye', 'salehouse', 'director'), async (req, res) => {
  const photos = Array.isArray(req.body.photos) ? req.body.photos : [];
  const { rows } = await query(
    `update property_listings set photos=$1::jsonb, updated_at=now() where id=$2 returning *`,
    [JSON.stringify(photos), req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json(toJson(rows[0]));
});

// ── Delete ────────────────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, requireRole('inzuzamacye', 'salehouse', 'director'), async (req, res) => {
  const { rowCount } = await query('delete from property_listings where id=$1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Not found.' });
  res.json({ ok: true });
});

module.exports = router;
