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

const { notifyAll } = require('../pushNotifications');

const router = express.Router();

// Labels the news admin can put on an article besides Breaking/Trending.
const ALLOWED_LABELS = ['exclusive', 'opinion', 'sponsored', 'pick'];

// Keep only known labels, each once — nothing else can end up in the column.
function cleanLabels(labels) {
  return Array.isArray(labels) ? ALLOWED_LABELS.filter((l) => labels.includes(l)) : [];
}

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
    labels: row.labels || [],
    authorId: row.author_id,
    publishAt: row.publish_at,
    slug: row.slug,
    metaDescription: row.meta_description,
    ogImage: row.og_image,
    breakingExpiresAt: row.breaking_expires_at,
    isSponsored: row.is_sponsored,
    readTimeMin: row.read_time_min,
    shares: row.shares,
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
    labels: 'labels',
    authorId: 'author_id',
    publishAt: 'publish_at',
    slug: 'slug',
    metaDescription: 'meta_description',
    ogImage: 'og_image',
    breakingExpiresAt: 'breaking_expires_at',
    isSponsored: 'is_sponsored',
    readTimeMin: 'read_time_min',
    shares: 'shares',
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
  const body = req.body || {};
  if ('labels' in body) body.labels = cleanLabels(body.labels);
  const { columns, values } = articleFields(body);
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
  const body = req.body || {};
  if ('labels' in body) body.labels = cleanLabels(body.labels);
  const { columns, values } = articleFields(body);
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
  const article = articleToJson(rows[0]);
  res.json(article);

  // Fire-and-forget push notifications
  if (article.status === 'published' && req.body?.status === 'published') {
    const pushTitle = article.isBreaking ? `⚡ ${article.title}` : article.title;
    notifyAll({ title: pushTitle, body: article.source || 'AllInKigali', data: { type: 'article', articleId: article.id } }).catch(() => {});
  } else if (article.isBreaking && req.body?.isBreaking) {
    notifyAll({ title: `⚡ ${article.title}`, body: 'Breaking News', data: { type: 'breaking', articleId: article.id } }).catch(() => {});
  }
});

router.delete('/articles/:id', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { rowCount } = await query('delete from news_articles where id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Article not found.' });
  res.status(204).end();
});

router.get('/settings', async (_req, res) => {
  const { rows } = await query('select show_view_counts from news_settings where id');
  res.json({ showViewCounts: rows[0] ? rows[0].show_view_counts : true });
});

router.patch('/settings', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { showViewCounts } = req.body || {};
  if (typeof showViewCounts !== 'boolean') {
    return res.status(400).json({ error: 'showViewCounts must be true or false.' });
  }
  const { rows } = await query(
    `insert into news_settings (id, show_view_counts) values (true, $1)
     on conflict (id) do update set show_view_counts = excluded.show_view_counts
     returning show_view_counts`,
    [showViewCounts]
  );
  res.json({ showViewCounts: rows[0].show_view_counts });
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

// ── Authors ──────────────────────────────────────────────────────────────────
router.get('/authors', async (_req, res) => {
  const { rows } = await query('select * from news_authors order by name');
  res.json(rows);
});

router.post('/authors', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { name, bio, avatarUrl, email, role } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await query(
    `insert into news_authors (name, bio, avatar_url, email, role)
     values ($1, $2, $3, $4, $5) returning *`,
    [name, bio || null, avatarUrl || null, email || null, role || 'reporter']
  );
  res.status(201).json(rows[0]);
});

router.patch('/authors/:id', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const map = { name: 'name', bio: 'bio', avatarUrl: 'avatar_url', email: 'email', role: 'role', isActive: 'is_active' };
  const cols = [], vals = [];
  Object.entries(map).forEach(([k, col]) => { if (k in req.body) { cols.push(col); vals.push(req.body[k]); } });
  if (!cols.length) return res.status(400).json({ error: 'No fields provided.' });
  const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const { rows } = await query(`update news_authors set ${setClause} where id = $${cols.length + 1} returning *`, [...vals, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Author not found.' });
  res.json(rows[0]);
});

router.delete('/authors/:id', requireAuth, requireRole('news', 'director'), async (req, res) => {
  await query('update news_authors set is_active = false where id = $1', [req.params.id]);
  res.status(204).end();
});

// ── Scheduled publishing — publish articles whose publish_at <= now ───────────
router.post('/articles/publish-scheduled', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { rows } = await query(
    `update news_articles set status = 'published', published_at = now()
     where status = 'draft' and publish_at is not null and publish_at <= now()
     returning id, title`
  );
  res.json({ published: rows });
});

// ── Breaking flag auto-expiry ─────────────────────────────────────────────────
router.post('/articles/expire-breaking', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { rows } = await query(
    `update news_articles set is_breaking = false
     where is_breaking and breaking_expires_at is not null and breaking_expires_at <= now()
     returning id, title`
  );
  res.json({ expired: rows });
});

// ── Advertisers ───────────────────────────────────────────────────────────────
router.get('/advertisers', requireAuth, requireRole('news', 'director'), async (_req, res) => {
  const { rows } = await query('select * from news_advertisers order by name');
  res.json(rows);
});

router.post('/advertisers', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { name, contact, email, phone, logoUrl, notes } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await query(
    `insert into news_advertisers (name, contact, email, phone, logo_url, notes)
     values ($1, $2, $3, $4, $5, $6) returning *`,
    [name, contact || null, email || null, phone || null, logoUrl || null, notes || null]
  );
  res.status(201).json(rows[0]);
});

router.patch('/advertisers/:id', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const map = { name: 'name', contact: 'contact', email: 'email', phone: 'phone', logoUrl: 'logo_url', notes: 'notes', isActive: 'is_active' };
  const cols = [], vals = [];
  Object.entries(map).forEach(([k, col]) => { if (k in req.body) { cols.push(col); vals.push(req.body[k]); } });
  if (!cols.length) return res.status(400).json({ error: 'No fields provided.' });
  const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const { rows } = await query(`update news_advertisers set ${setClause} where id = $${cols.length + 1} returning *`, [...vals, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Advertiser not found.' });
  res.json(rows[0]);
});

router.delete('/advertisers/:id', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { rowCount } = await query('delete from news_advertisers where id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Advertiser not found.' });
  res.status(204).end();
});

// ── Campaigns ─────────────────────────────────────────────────────────────────
router.get('/campaigns', requireAuth, requireRole('news', 'director'), async (_req, res) => {
  const { rows } = await query(
    `select c.*, a.name as advertiser_name
     from news_campaigns c join news_advertisers a on a.id = c.advertiser_id
     order by c.created_at desc`
  );
  res.json(rows);
});

router.post('/campaigns', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { advertiserId, name, budget, startsAt, endsAt, notes } = req.body || {};
  if (!advertiserId || !name) return res.status(400).json({ error: 'advertiserId and name are required.' });
  const { rows } = await query(
    `insert into news_campaigns (advertiser_id, name, budget, starts_at, ends_at, notes)
     values ($1, $2, $3, $4, $5, $6) returning *`,
    [advertiserId, name, budget || null, startsAt || null, endsAt || null, notes || null]
  );
  res.status(201).json(rows[0]);
});

router.patch('/campaigns/:id', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const map = { name: 'name', budget: 'budget', startsAt: 'starts_at', endsAt: 'ends_at', status: 'status', notes: 'notes' };
  const cols = [], vals = [];
  Object.entries(map).forEach(([k, col]) => { if (k in req.body) { cols.push(col); vals.push(req.body[k]); } });
  if (!cols.length) return res.status(400).json({ error: 'No fields provided.' });
  const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const { rows } = await query(`update news_campaigns set ${setClause} where id = $${cols.length + 1} returning *`, [...vals, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Campaign not found.' });
  res.json(rows[0]);
});

router.delete('/campaigns/:id', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const { rowCount } = await query('delete from news_campaigns where id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Campaign not found.' });
  res.status(204).end();
});

// ── Ad placement impressions + clicks ────────────────────────────────────────
router.post('/ads/:id/impression', async (req, res) => {
  await query(
    `insert into news_ad_events (placement_id, event_type, article_id)
     select id, 'impression', $2 from news_ad_placements where ad_id = $1`,
    [req.params.id, req.body?.articleId || null]
  );
  res.status(204).end();
});

router.post('/ads/:id/click', async (req, res) => {
  await query(
    `insert into news_ad_events (placement_id, event_type, article_id)
     select id, 'click', $2 from news_ad_placements where ad_id = $1`,
    [req.params.id, req.body?.articleId || null]
  );
  res.status(204).end();
});

// ── Analytics endpoints ──────────────────────────────────────────────────────
router.get('/analytics/reads-over-time', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const { rows } = await query(
    `select date_trunc('day', published_at)::date as day, sum(views) as views
     from news_articles
     where published_at >= now() - ($1 || ' days')::interval
       and status = 'published'
     group by 1 order by 1`,
    [days]
  );
  res.json(rows);
});

router.get('/analytics/top-articles', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const { rows } = await query(
    `select id, title, category, views, shares, published_at
     from news_articles where status = 'published'
     order by views desc limit $1`,
    [limit]
  );
  res.json(rows);
});

router.get('/analytics/by-category', requireAuth, requireRole('news', 'director'), async (_req, res) => {
  const { rows } = await query(
    `select category, count(*) as articles, sum(views) as total_views
     from news_articles where status = 'published'
     group by category order by total_views desc`
  );
  res.json(rows);
});

router.get('/analytics/by-author', requireAuth, requireRole('news', 'director'), async (_req, res) => {
  const { rows } = await query(
    `select a.id, a.name, count(ar.id) as articles, sum(ar.views) as total_views
     from news_authors a
     left join news_articles ar on ar.author_id = a.id and ar.status = 'published'
     group by a.id, a.name order by total_views desc`
  );
  res.json(rows);
});

// ── Workflow settings ────────────────────────────────────────────────────────
router.get('/workflow-settings', requireAuth, requireRole('news', 'director'), async (_req, res) => {
  const { rows } = await query('select * from news_workflow_settings where id = 1');
  res.json(rows[0] || {});
});

router.patch('/workflow-settings', requireAuth, requireRole('news', 'director'), async (req, res) => {
  const map = {
    breakingExpiryHours: 'breaking_expiry_hours',
    scheduledCheckInterval: 'scheduled_check_interval',
    requireEditorApproval: 'require_editor_approval',
    defaultPublishStatus: 'default_publish_status',
    adFrequencyEveryN: 'ad_frequency_every_n',
  };
  const cols = [], vals = [];
  Object.entries(map).forEach(([k, col]) => { if (k in req.body) { cols.push(col); vals.push(req.body[k]); } });
  if (!cols.length) return res.status(400).json({ error: 'No fields provided.' });
  const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const { rows } = await query(
    `update news_workflow_settings set ${setClause}, updated_at = now() where id = 1 returning *`,
    vals
  );
  res.json(rows[0]);
});

module.exports = router;
