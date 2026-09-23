/**
 * news.js (routes) — replaces the Supabase table + RLS policies for
 * News. Same access shape as before, just enforced in code instead of at
 * the database: anyone can read published/non-archived articles and all
 * categories; a signed-in 'news' or 'director' admin can read and manage
 * everything.
 */
const express = require('express');
const { query } = require('../db');
const { attachUserIfPresent, requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

function isNewsAdmin(user) {
  return user && (user.role === 'news' || user.role === 'director');
}

function articleToJson(row) {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    source: row.source,
    sourceUrl: row.source_url,
    body: row.body,
    imageUrl: row.image_url,
    icon: row.icon,
    isBreaking: row.is_breaking,
    status: row.status,
    isFeatured: row.is_featured,
    isTrending: row.is_trending,
    isArchived: row.is_archived,
    views: row.views,
    publishedAt: row.published_at,
    storyId: row.story_id,
  };
}

function storyToJson(row) {
  return {
    id: row.id,
    title: row.title,
    isLive: row.is_live,
    createdAt: row.created_at,
  };
}

// Only ever includes columns actually present in `data`, so a partial
// patch like { isArchived: true } can't accidentally null out every other
// column in a plain UPDATE ... SET.
function articleFields(data) {
  const map = {
    category: 'category',
    title: 'title',
    source: 'source',
    sourceUrl: 'source_url',
    body: 'body',
    imageUrl: 'image_url',
    icon: 'icon',
    isBreaking: 'is_breaking',
    status: 'status',
    isFeatured: 'is_featured',
    isTrending: 'is_trending',
    isArchived: 'is_archived',
    publishedAt: 'published_at',
    storyId: 'story_id',
  };
  const columns = [];
  const values = [];
  Object.entries(map).forEach(([jsKey, column]) => {
    if (jsKey in data) {
      columns.push(column);
      values.push(data[jsKey]);
    }
  });
  return { columns, values };
}

router.get('/categories', async (_req, res) => {
  const { rows } = await query('select key, label from news_categories order by label');
  res.json(rows);
});

router.post('/categories', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { key, label } = req.body || {};
  if (!key || !label) return res.status(400).json({ error: 'key and label are required.' });
  const { rows } = await query(
    'insert into news_categories (key, label) values ($1, $2) on conflict (key) do nothing returning key, label',
    [key, label]
  );
  if (!rows[0]) {
    const existing = await query('select key, label from news_categories where key = $1', [key]);
    return res.json(existing.rows[0]);
  }
  res.status(201).json(rows[0]);
});

router.patch('/categories/:key', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { label } = req.body || {};
  const { rows } = await query(
    'update news_categories set label = $1 where key = $2 returning key, label',
    [label, req.params.key]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Category not found.' });
  res.json(rows[0]);
});

router.delete('/categories/:key', requireAuth, requireRole('news', 'director'), async (req, res) => {
  try {
    const { rowCount } = await query('delete from news_categories where key = $1', [req.params.key]);
    if (!rowCount) return res.status(404).json({ error: 'Category not found.' });
    res.status(204).end();
  } catch (err) {
    // foreign_key_violation — the FK "on delete restrict" caught a category
    // still in use, same guarantee the old RLS-backed version had.
    if (err.code === '23503') return res.status(409).json({ error: 'Category is still in use.' });
    throw err;
  }
});

router.get('/articles', attachUserIfPresent, async (req, res) => {
  const sql = isNewsAdmin(req.user)
    ? 'select * from news_articles order by published_at desc'
    : "select * from news_articles where status = 'published' and not is_archived order by published_at desc";
  const { rows } = await query(sql);
  res.json(rows.map(articleToJson));
});

router.post('/articles', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { columns, values } = articleFields(req.body || {});
  if (!columns.length) return res.status(400).json({ error: 'No fields provided.' });
  // The admin explicitly picks the one hero article — enforce that at
  // write time rather than trusting the client, same reasoning as the
  // unique-ad-per-article index: only one row should ever be featured.
  if (req.body?.isFeatured) {
    await query('update news_articles set is_featured = false where is_featured');
  }
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await query(
    `insert into news_articles (${columns.join(', ')}) values (${placeholders}) returning *`,
    values
  );
  res.status(201).json(articleToJson(rows[0]));
});

router.patch('/articles/:id', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { columns, values } = articleFields(req.body || {});
  if (!columns.length) return res.status(400).json({ error: 'No fields provided.' });
  if (req.body?.isFeatured) {
    await query('update news_articles set is_featured = false where is_featured and id != $1', [req.params.id]);
  }
  const setClause = columns.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const { rows } = await query(
    `update news_articles set ${setClause} where id = $${columns.length + 1} returning *`,
    [...values, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Article not found.' });
  res.json(articleToJson(rows[0]));
});

router.delete('/articles/:id', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { rowCount } = await query('delete from news_articles where id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Article not found.' });
  res.status(204).end();
});

router.get('/stories', async (_req, res) => {
  const { rows } = await query('select * from news_stories order by created_at desc');
  res.json(rows.map(storyToJson));
});

router.post('/stories', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { title } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: 'title is required.' });
  const { rows } = await query(
    'insert into news_stories (title) values ($1) returning *',
    [title.trim()]
  );
  res.status(201).json(storyToJson(rows[0]));
});

router.patch('/stories/:id', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { title, isLive } = req.body || {};
  const columns = [];
  const values = [];
  if (title !== undefined) { columns.push('title'); values.push(title); }
  if (isLive !== undefined) { columns.push('is_live'); values.push(isLive); }
  if (!columns.length) return res.status(400).json({ error: 'No fields provided.' });

  const setClause = columns.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const { rows } = await query(
    `update news_stories set ${setClause} where id = $${columns.length + 1} returning *`,
    [...values, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Story not found.' });
  res.json(storyToJson(rows[0]));
});

router.delete('/stories/:id', requireAuth, requireRole('news', 'director'), async (req, res) => {
  // Articles keep existing (story_id just goes back to null, per the FK's
  // "on delete set null") — deleting a story never deletes coverage.
  const { rowCount } = await query('delete from news_stories where id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Story not found.' });
  res.status(204).end();
});

router.post('/articles/:id/view', async (req, res) => {
  // Narrow on purpose — the same guarantee increment_article_view had as a
  // security-definer RPC: a reader can only ever bump the view count of an
  // article they could actually see, nothing else about the row.
  await query(
    "update news_articles set views = views + 1 where id = $1 and status = 'published' and not is_archived",
    [req.params.id]
  );
  res.status(204).end();
});

module.exports = router;
