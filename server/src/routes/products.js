/**
 * products.js (routes) — Allingadget + Uruhu Rwiza product catalogs.
 * store = 'allingadget' | 'uruhu-rwiza'
 *
 * Public:
 *   GET  /products              list (filters: store, category, available)
 *   GET  /products/:id          single product
 *
 * Admin (role: allingadget|uruhurwiza|director):
 *   POST   /products            create product
 *   PUT    /products/:id        update product (price, badge, etc.)
 *   DELETE /products/:id        remove product
 *   PATCH  /products/:id/badge  set badge
 */
const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

const VALID_STORES = ['allingadget', 'uruhu-rwiza'];
const VALID_BADGES = ['best_seller', 'new', 'hot', 'luxury'];

// Role guard: allingadget admin can only touch allingadget store, etc.
// Director can touch everything.
function requireStoreRole(req, res, next) {
  const role = req.user?.role;
  if (!role) return res.status(401).json({ error: 'Not authenticated.' });
  if (role === 'director') return next();
  const store = req.body?.store || req.query?.store;
  if (role === 'allingadget' && store === 'allingadget') return next();
  if (role === 'uruhurwiza'  && store === 'uruhu-rwiza') return next();
  return res.status(403).json({ error: 'Forbidden: wrong store for your role.' });
}

function toJson(row) {
  return {
    id:          row.id,
    store:       row.store,
    category:    row.category,
    brand:       row.brand,
    name:        row.name,
    description: row.description,
    price:       Number(row.price),
    badge:       row.badge,
    icon:        row.icon,
    available:   row.available,
    createdAt:   row.created_at,
  };
}

// ── List ──────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { store, category, available } = req.query;
  const conditions = [];
  const values = [];

  if (store)    { values.push(store);    conditions.push(`store    = $${values.length}`); }
  if (category) { values.push(category); conditions.push(`category = $${values.length}`); }
  if (available !== undefined) {
    values.push(available !== 'false');
    conditions.push(`available = $${values.length}`);
  }

  const where = conditions.length ? 'where ' + conditions.join(' and ') : '';
  const { rows } = await query(
    `select * from products ${where} order by created_at asc`,
    values
  );
  res.json(rows.map(toJson));
});

// ── Single ────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { rows } = await query('select * from products where id=$1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json(toJson(rows[0]));
});

// ── Create ────────────────────────────────────────────────────────────────────
router.post('/', requireAuth, requireStoreRole, async (req, res) => {
  const { store, category, brand, name, description, price, badge, icon } = req.body;
  if (!store || !category || !name || !price) {
    return res.status(400).json({ error: 'store, category, name, price are required.' });
  }
  if (!VALID_STORES.includes(store)) {
    return res.status(400).json({ error: `store must be one of: ${VALID_STORES.join(', ')}.` });
  }
  if (badge && !VALID_BADGES.includes(badge)) {
    return res.status(400).json({ error: `badge must be one of: ${VALID_BADGES.join(', ')}.` });
  }
  const { rows } = await query(
    `insert into products (store, category, brand, name, description, price, badge, icon)
     values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
    [store, category, brand || '', name, description || null, price, badge || null, icon || 'package-variant-closed']
  );
  res.status(201).json(toJson(rows[0]));
});

// ── Update ────────────────────────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  // Fetch first to know the store, then check role
  const existing = await query('select store from products where id=$1', [req.params.id]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Not found.' });

  const role = req.user?.role;
  if (role !== 'director') {
    if (role === 'allingadget' && existing.rows[0].store !== 'allingadget')
      return res.status(403).json({ error: 'Forbidden.' });
    if (role === 'uruhurwiza' && existing.rows[0].store !== 'uruhu-rwiza')
      return res.status(403).json({ error: 'Forbidden.' });
    if (role !== 'allingadget' && role !== 'uruhurwiza')
      return res.status(403).json({ error: 'Forbidden.' });
  }

  const { category, brand, name, description, price, badge, icon, available } = req.body;
  if (badge && !VALID_BADGES.includes(badge)) {
    return res.status(400).json({ error: `badge must be one of: ${VALID_BADGES.join(', ')}.` });
  }
  const { rows } = await query(
    `update products set
       category=$1, brand=$2, name=$3, description=$4, price=$5,
       badge=$6, icon=$7, available=$8, updated_at=now()
     where id=$9 returning *`,
    [category, brand || '', name, description || null, price, badge || null, icon, available !== false, req.params.id]
  );
  res.json(toJson(rows[0]));
});

// ── Set badge only ────────────────────────────────────────────────────────────
router.patch('/:id/badge', requireAuth, async (req, res) => {
  const existing = await query('select store from products where id=$1', [req.params.id]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Not found.' });

  const role = req.user?.role;
  if (role !== 'director') {
    if (role === 'allingadget' && existing.rows[0].store !== 'allingadget')
      return res.status(403).json({ error: 'Forbidden.' });
    if (role === 'uruhurwiza' && existing.rows[0].store !== 'uruhu-rwiza')
      return res.status(403).json({ error: 'Forbidden.' });
    if (role !== 'allingadget' && role !== 'uruhurwiza')
      return res.status(403).json({ error: 'Forbidden.' });
  }

  const { badge } = req.body;
  if (badge !== null && badge !== undefined && !VALID_BADGES.includes(badge)) {
    return res.status(400).json({ error: `badge must be one of: ${VALID_BADGES.join(', ')}, or null.` });
  }
  const { rows } = await query(
    `update products set badge=$1, updated_at=now() where id=$2 returning *`,
    [badge || null, req.params.id]
  );
  res.json(toJson(rows[0]));
});

// ── Delete ────────────────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  const existing = await query('select store from products where id=$1', [req.params.id]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Not found.' });

  const role = req.user?.role;
  if (role !== 'director') {
    if (role === 'allingadget' && existing.rows[0].store !== 'allingadget')
      return res.status(403).json({ error: 'Forbidden.' });
    if (role === 'uruhurwiza' && existing.rows[0].store !== 'uruhu-rwiza')
      return res.status(403).json({ error: 'Forbidden.' });
    if (role !== 'allingadget' && role !== 'uruhurwiza')
      return res.status(403).json({ error: 'Forbidden.' });
  }

  await query('delete from products where id=$1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
