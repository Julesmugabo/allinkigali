/**
 * land.js (routes) — Ibibanza: land plots for sale.
 *
 * Public:
 *   GET  /land               list (filters: province, district, sector, type, sold)
 *   GET  /land/:id           single listing
 *
 * Admin (role: ibibanza OR director):
 *   POST   /land             create listing
 *   PUT    /land/:id         update listing
 *   DELETE /land/:id         remove listing
 *   PATCH  /land/:id/pin     toggle pinned
 *   PATCH  /land/:id/sold    toggle sold
 */
const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

function toJson(row) {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description,
    type:        row.type,
    sizeSqm:     row.size_sqm,
    price:       Number(row.price),
    province:    row.province,
    district:    row.district,
    sector:      row.sector,
    titled:      row.titled,
    phone:       row.phone,
    pinned:      row.pinned,
    sold:        row.sold,
    photos:      row.photos || [],
    createdAt:   row.created_at,
  };
}

// ── List ──────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { province, district, sector, type, sold } = req.query;
  const conditions = [];
  const values = [];

  if (province) { values.push(province); conditions.push(`province = $${values.length}`); }
  if (district) { values.push(district); conditions.push(`district = $${values.length}`); }
  if (sector)   { values.push(sector);   conditions.push(`sector   = $${values.length}`); }
  if (type)     { values.push(type);     conditions.push(`type     = $${values.length}`); }
  if (sold !== undefined) {
    values.push(sold === 'true');
    conditions.push(`sold = $${values.length}`);
  }

  const where = conditions.length ? 'where ' + conditions.join(' and ') : '';
  const { rows } = await query(
    `select * from land_listings ${where} order by pinned desc, created_at desc`,
    values
  );
  res.json(rows.map(toJson));
});

// ── Single ────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { rows } = await query('select * from land_listings where id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json(toJson(rows[0]));
});

// ── Create ────────────────────────────────────────────────────────────────────
router.post('/', requireAuth, requireRole('ibibanza', 'director'), async (req, res) => {
  const { title, description, type, sizeSqm, price, province, district, sector, titled, phone } = req.body;
  if (!title || !sizeSqm || !price || !province || !district || !sector) {
    return res.status(400).json({ error: 'title, sizeSqm, price, province, district, sector are required.' });
  }
  const { rows } = await query(
    `insert into land_listings
       (title, description, type, size_sqm, price, province, district, sector, titled, phone)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     returning *`,
    [title, description || null, type || 'residential', sizeSqm, price, province, district, sector, !!titled, phone || null]
  );
  res.status(201).json(toJson(rows[0]));
});

// ── Update ────────────────────────────────────────────────────────────────────
router.put('/:id', requireAuth, requireRole('ibibanza', 'director'), async (req, res) => {
  const { title, description, type, sizeSqm, price, province, district, sector, titled, phone } = req.body;
  const { rows } = await query(
    `update land_listings set
       title=$1, description=$2, type=$3, size_sqm=$4, price=$5,
       province=$6, district=$7, sector=$8, titled=$9, phone=$10,
       updated_at=now()
     where id=$11 returning *`,
    [title, description || null, type, sizeSqm, price, province, district, sector, !!titled, phone || null, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json(toJson(rows[0]));
});

// ── Toggle pinned ─────────────────────────────────────────────────────────────
router.patch('/:id/pin', requireAuth, requireRole('ibibanza', 'director'), async (req, res) => {
  const { rows } = await query(
    `update land_listings set pinned = not pinned, updated_at=now() where id=$1 returning *`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json(toJson(rows[0]));
});

// ── Toggle sold ───────────────────────────────────────────────────────────────
router.patch('/:id/sold', requireAuth, requireRole('ibibanza', 'director'), async (req, res) => {
  const { rows } = await query(
    `update land_listings set sold = not sold, updated_at=now() where id=$1 returning *`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json(toJson(rows[0]));
});

// ── Replace photos array ──────────────────────────────────────────────────────
router.patch('/:id/photos', requireAuth, requireRole('ibibanza', 'director'), async (req, res) => {
  const photos = Array.isArray(req.body.photos) ? req.body.photos : [];
  const { rows } = await query(
    `update land_listings set photos=$1::jsonb, updated_at=now() where id=$2 returning *`,
    [JSON.stringify(photos), req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json(toJson(rows[0]));
});

// ── Delete ────────────────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, requireRole('ibibanza', 'director'), async (req, res) => {
  const { rowCount } = await query('delete from land_listings where id=$1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Not found.' });
  res.json({ ok: true });
});

module.exports = router;
