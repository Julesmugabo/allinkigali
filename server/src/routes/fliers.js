/**
 * fliers.js (routes) — replaces FliersContext's in-memory state. Same
 * access shape as businesses: anyone can read (the Shop tab marquee needs
 * them), only a signed-in sellers/director admin can write.
 */
const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

function flierToJson(row) {
  return {
    id: row.id,
    imageUri: row.image_uri,
    businessId: row.business_id,
    createdAt: row.created_at,
  };
}

router.get('/', async (_req, res) => {
  const { rows } = await query('select * from fliers order by created_at desc');
  res.json(rows.map(flierToJson));
});

router.post('/', requireAuth, requireRole('sellers', 'director'), async (req, res) => {
  const { imageUri, businessId } = req.body || {};
  if (!imageUri || !businessId) {
    return res.status(400).json({ error: 'imageUri and businessId are required.' });
  }
  const { rows } = await query(
    'insert into fliers (image_uri, business_id) values ($1, $2) returning *',
    [imageUri, businessId]
  );
  res.status(201).json(flierToJson(rows[0]));
});

router.patch('/:id', requireAuth, requireRole('sellers', 'director'), async (req, res) => {
  const { imageUri, businessId } = req.body || {};
  const columns = [];
  const values = [];
  if (imageUri !== undefined) { columns.push('image_uri'); values.push(imageUri); }
  if (businessId !== undefined) { columns.push('business_id'); values.push(businessId); }
  if (!columns.length) return res.status(400).json({ error: 'No fields provided.' });

  const setClause = columns.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const { rows } = await query(
    `update fliers set ${setClause} where id = $${columns.length + 1} returning *`,
    [...values, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Flier not found.' });
  res.json(flierToJson(rows[0]));
});

router.delete('/:id', requireAuth, requireRole('sellers', 'director'), async (req, res) => {
  const { rowCount } = await query('delete from fliers where id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Flier not found.' });
  res.status(204).end();
});

module.exports = router;
