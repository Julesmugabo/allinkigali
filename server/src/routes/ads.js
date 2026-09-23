/**
 * ads.js (routes) — replaces AdsContext's in-memory state. Same access
 * shape as News: anyone can read (the public feed needs to know which ad
 * follows which article), only a signed-in news/director admin can write.
 * A unique index on after_article_id enforces "at most one ad per anchor
 * article" at the database level, matching the in-memory version's
 * assumption that getAdAfter() always resolves to a single ad.
 */
const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

function adToJson(row) {
  return {
    id: row.id,
    type: row.type,
    mediaUri: row.media_uri,
    afterArticleId: row.after_article_id,
    createdAt: row.created_at,
  };
}

router.get('/', async (_req, res) => {
  const { rows } = await query('select * from ads order by created_at desc');
  res.json(rows.map(adToJson));
});

router.post('/', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { type, mediaUri, afterArticleId } = req.body || {};
  if (!mediaUri || !afterArticleId) {
    return res.status(400).json({ error: 'mediaUri and afterArticleId are required.' });
  }

  try {
    const { rows } = await query(
      `insert into ads (type, media_uri, after_article_id)
       values ($1, $2, $3)
       returning *`,
      [type === 'video' ? 'video' : 'photo', mediaUri, afterArticleId]
    );
    res.status(201).json(adToJson(rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'That article already has an ad.' });
    throw err;
  }
});

router.patch('/:id', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { type, mediaUri, afterArticleId } = req.body || {};
  const columns = [];
  const values = [];
  if (type !== undefined) { columns.push('type'); values.push(type === 'video' ? 'video' : 'photo'); }
  if (mediaUri !== undefined) { columns.push('media_uri'); values.push(mediaUri); }
  if (afterArticleId !== undefined) { columns.push('after_article_id'); values.push(afterArticleId); }
  if (!columns.length) return res.status(400).json({ error: 'No fields provided.' });

  const setClause = columns.map((c, i) => `${c} = $${i + 1}`).join(', ');

  try {
    const { rows } = await query(
      `update ads set ${setClause} where id = $${columns.length + 1} returning *`,
      [...values, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Ad not found.' });
    res.json(adToJson(rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'That article already has an ad.' });
    throw err;
  }
});

router.delete('/:id', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { rowCount } = await query('delete from ads where id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Ad not found.' });
  res.status(204).end();
});

module.exports = router;
