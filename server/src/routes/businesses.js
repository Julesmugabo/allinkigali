/**
 * businesses.js (routes) — replaces BusinessContext's in-memory state.
 * Verified is a trust badge, not a search gate (established product
 * decision) — every business is publicly readable regardless of status,
 * unlike News where an unpublished article is genuinely hidden.
 *
 * Registering and editing need a login: a seller can create a shop (it is
 * theirs) and edit only their own; the Sales Partners admin and director can
 * edit any. Only staff may set the trust fields (verified, owner, rating,
 * review count). Previously none of this needed a login — anyone could
 * change any shop's phone number or mark it verified.
 */
const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

function businessToJson(row) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    category: row.category,
    name: row.name,
    verified: row.verified,
    rating: row.rating === null ? null : Number(row.rating),
    reviewCount: row.review_count,
    phone: row.phone,
    openLabel: row.open_label,
    hours: row.hours,
    services: row.services || [],
    priceFrom: row.price_from === null ? null : Number(row.price_from),
    priceUnit: row.price_unit,
    currency: row.currency,
    location: row.location,
    highlights: row.highlights || [],
    description: row.description,
    icon: row.icon,
    image: row.image_url ? { uri: row.image_url } : null,
    keywords: row.keywords || [],
    items: row.items,
    isAvailableNow: row.is_available_now,
    views: row.views,
  };
}

// Only ever includes columns actually present in `data`, so a partial
// patch (e.g. { isAvailableNow: false }) can't null out every other column.
function businessFields(data) {
  const map = {
    ownerId: 'owner_id',
    category: 'category',
    name: 'name',
    verified: 'verified',
    rating: 'rating',
    reviewCount: 'review_count',
    phone: 'phone',
    openLabel: 'open_label',
    hours: 'hours',
    services: 'services',
    priceFrom: 'price_from',
    priceUnit: 'price_unit',
    currency: 'currency',
    location: 'location',
    highlights: 'highlights',
    description: 'description',
    icon: 'icon',
    keywords: 'keywords',
    items: 'items',
    isAvailableNow: 'is_available_now',
  };
  const columns = [];
  const values = [];
  Object.entries(map).forEach(([jsKey, column]) => {
    if (jsKey in data) {
      columns.push(column);
      values.push(data[jsKey]);
    }
  });
  // `image` is the one field with a shape conversion ({uri} <-> a plain
  // column) rather than a 1:1 rename, so it's handled separately here.
  if ('image' in data) {
    columns.push('image_url');
    values.push(data.image?.uri || null);
  }
  return { columns, values };
}

router.get('/', async (_req, res) => {
  const { rows } = await query('select * from businesses order by created_at desc');
  res.json(rows.map(businessToJson));
});

const isStaff = (user) => user && (user.role === 'sellers' || user.role === 'director');
const STAFF_ONLY = ['verified', 'ownerId', 'rating', 'reviewCount'];
const withoutStaffFields = (body) => Object.fromEntries(Object.entries(body).filter(([k]) => !STAFF_ONLY.includes(k)));

router.post('/', requireAuth, async (req, res) => {
  const staff = isStaff(req.user);
  const body = staff ? { ...req.body } : { ...withoutStaffFields(req.body || {}), ownerId: req.user.sub };
  const { columns, values } = businessFields(body);
  if (!columns.length) return res.status(400).json({ error: 'No fields provided.' });
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await query(
    `insert into businesses (${columns.join(', ')}) values (${placeholders}) returning *`,
    values
  );
  res.status(201).json(businessToJson(rows[0]));
});

router.patch('/:id', requireAuth, async (req, res) => {
  const staff = isStaff(req.user);
  if (!staff) {
    const { rows: own } = await query('select owner_id from businesses where id = $1', [req.params.id]);
    if (!own[0]) return res.status(404).json({ error: 'Business not found.' });
    if (String(own[0].owner_id) !== String(req.user.sub)) return res.status(403).json({ error: 'You can only edit your own shop.' });
  }
  const { columns, values } = businessFields(staff ? req.body || {} : withoutStaffFields(req.body || {}));
  if (!columns.length) return res.status(400).json({ error: 'No fields provided.' });
  const setClause = columns.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const { rows } = await query(
    `update businesses set ${setClause} where id = $${columns.length + 1} returning *`,
    [...values, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Business not found.' });
  res.json(businessToJson(rows[0]));
});

router.delete('/:id', requireAuth, requireRole('sellers', 'director'), async (req, res) => {
  const { rowCount } = await query('delete from businesses where id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Business not found.' });
  res.status(204).end();
});

router.post('/:id/approve', requireAuth, requireRole('sellers', 'director'), async (req, res) => {
  const { rows } = await query(
    'update businesses set verified = true where id = $1 returning *',
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Business not found.' });
  res.json(businessToJson(rows[0]));
});

router.post('/:id/view', async (req, res) => {
  await query('update businesses set views = views + 1 where id = $1', [req.params.id]);
  res.status(204).end();
});

module.exports = router;
