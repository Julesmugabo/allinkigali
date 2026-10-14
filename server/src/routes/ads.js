/**
 * ads.js (routes) — app and web ads.
 *
 * Readers get only what should run now (GET /ads?channel=app|web: switched
 * on and inside its dates). The News dashboard manages everything through
 * GET /ads/manage. Views and clicks are simple counters on the ad, bumped
 * by the reader's device, so an advertiser report is one row read.
 */
const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();
const editors = [requireAuth, requireRole('news', 'director')];
const CHANNELS = ['app', 'web'];

const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);
function adToJson(row) {
  return {
    id: row.id,
    channel: row.channel,
    title: row.title || '',
    type: row.type,
    mediaUri: row.media_uri,
    linkUrl: row.link_url || '',
    startsOn: day(row.starts_on),
    endsOn: day(row.ends_on),
    isActive: row.is_active,
    views: row.views,
    clicks: row.clicks,
    createdAt: row.created_at,
  };
}

// Readers: ads running right now, oldest first so rotation order is stable.
router.get('/', async (req, res) => {
  const params = [];
  let sql = `select * from ads where is_active and media_uri is not null
             and (starts_on is null or starts_on <= current_date)
             and (ends_on is null or ends_on >= current_date)`;
  if (CHANNELS.includes(req.query.channel)) { params.push(req.query.channel); sql += ` and channel = $1`; }
  const { rows } = await query(`${sql} order by created_at`, params);
  res.json(rows.map(adToJson));
});

// Dashboard: every ad, with counters.
router.get('/manage', ...editors, async (_req, res) => {
  const { rows } = await query('select * from ads order by created_at desc');
  res.json(rows.map(adToJson));
});

const FIELDS = {
  channel: ['channel', (v) => (CHANNELS.includes(v) ? v : 'app')],
  title: ['title', (v) => String(v || '').trim().slice(0, 120)],
  type: ['type', (v) => (v === 'video' ? 'video' : 'photo')],
  mediaUri: ['media_uri', (v) => v || null],
  linkUrl: ['link_url', (v) => String(v || '').trim() || null],
  startsOn: ['starts_on', (v) => v || null],
  endsOn: ['ends_on', (v) => v || null],
  isActive: ['is_active', (v) => v !== false],
};
const pick = (body) => Object.entries(FIELDS)
  .filter(([k]) => body[k] !== undefined)
  .map(([k, [col, clean]]) => [col, clean(body[k])]);

router.post('/', ...editors, async (req, res) => {
  const body = req.body || {};
  if (!body.mediaUri) return res.status(400).json({ error: 'Upload the photo or video first.' });
  const cols = pick({ channel: 'app', isActive: true, ...body });
  const { rows } = await query(
    `insert into ads (${cols.map(([c]) => c).join(', ')}) values (${cols.map((_, i) => `$${i + 1}`).join(', ')}) returning *`,
    cols.map(([, v]) => v),
  );
  res.status(201).json(adToJson(rows[0]));
});

router.patch('/:id', ...editors, async (req, res) => {
  const cols = pick(req.body || {});
  if (!cols.length) return res.status(400).json({ error: 'No fields provided.' });
  const { rows } = await query(
    `update ads set ${cols.map(([c], i) => `${c} = $${i + 1}`).join(', ')} where id = $${cols.length + 1} returning *`,
    [...cols.map(([, v]) => v), req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Ad not found.' });
  res.json(adToJson(rows[0]));
});

router.delete('/:id', ...editors, async (req, res) => {
  const { rowCount } = await query('delete from ads where id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Ad not found.' });
  res.status(204).end();
});

// Readers' devices report a view (once per reading session) or a click.
router.post('/:id/view', async (req, res) => {
  await query('update ads set views = views + 1 where id = $1', [req.params.id]).catch(() => {});
  res.status(204).end();
});
router.post('/:id/click', async (req, res) => {
  await query('update ads set clicks = clicks + 1 where id = $1', [req.params.id]).catch(() => {});
  res.status(204).end();
});

module.exports = router;
