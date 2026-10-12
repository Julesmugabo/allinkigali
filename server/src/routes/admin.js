/**
 * admin.js (routes) — director-only ops utilities. Currently just a way to
 * apply pending migrations on the deployed environment (Vercel can't run
 * `npm run migrate` directly against Neon, and the DB URL is marked
 * sensitive so it can't be pulled locally either) — reuses migrate.js's
 * same tracked, idempotent apply logic against the live pool.
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const { pool, query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();
const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function adminToJson(row) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    createdAt: row.created_at,
  };
}

router.post('/migrate', requireAuth, requireRole('director'), async (_req, res) => {
  await pool.query(`
    create table if not exists _migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const { rows: applied } = await pool.query('select name from _migrations');
  const appliedNames = new Set(applied.map((r) => r.name));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const result = [];
  for (const file of files) {
    if (appliedNames.has(file)) {
      result.push({ file, status: 'skipped' });
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await pool.query(sql);
    await pool.query('insert into _migrations (name) values ($1)', [file]);
    result.push({ file, status: 'applied' });
  }

  res.json({ result });
});

// Director-only: grant or revoke News/Sellers admin access by email. Can
// only ever assign 'news' or 'sellers' (or null to revoke) — never
// 'director' through this endpoint, so a second director account can't be
// created by accident through the UI; that still only happens via
// createAdmin.js directly, same deliberate boundary as before.
router.get('/admins', requireAuth, requireRole('director'), async (_req, res) => {
  const { rows } = await query(
    "select id, email, first_name, last_name, role, created_at from users where role is not null order by role, email"
  );
  res.json(rows.map(adminToJson));
});

router.post('/assign-role', requireAuth, requireRole('director'), async (req, res) => {
  const { email, role } = req.body || {};
  if (!email || !email.trim()) return res.status(400).json({ error: 'email is required.' });
  const ASSIGNABLE = ['news', 'sellers', 'restaurant', 'coffeeshop', 'ibibanza', 'inzuzamacye', 'salehouse', 'allingadget', 'uruhurwiza', 'finance'];
  if (role !== null && !ASSIGNABLE.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${ASSIGNABLE.join(', ')}, or null to revoke.` });
  }

  const { rows } = await query(
    `update users set role = $1 where email = $2
     returning id, email, first_name, last_name, role, created_at`,
    [role, email.trim().toLowerCase()]
  );
  if (!rows[0]) {
    return res.status(404).json({ error: 'No account found for that email — they need to create an account first.' });
  }
  res.json(adminToJson(rows[0]));
});

// Link a restaurant_id or coffee_shop_id to a user account
router.post('/link-restaurant', requireAuth, requireRole('director'), async (req, res) => {
  const { email, restaurantId, coffeeShopId } = req.body || {};
  if (!email || !email.trim()) return res.status(400).json({ error: 'email is required.' });
  let sql, params;
  if (coffeeShopId) {
    sql = `UPDATE users SET coffee_shop_id=$1, restaurant_id=NULL, role='coffeeshop' WHERE email=$2
           RETURNING id, email, first_name, last_name, role, restaurant_id, coffee_shop_id, created_at`;
    params = [coffeeShopId, email.trim().toLowerCase()];
  } else {
    sql = `UPDATE users SET restaurant_id=$1, coffee_shop_id=NULL, role='restaurant' WHERE email=$2
           RETURNING id, email, first_name, last_name, role, restaurant_id, coffee_shop_id, created_at`;
    params = [restaurantId || null, email.trim().toLowerCase()];
  }
  const { rows } = await query(sql, params);
  if (!rows[0]) return res.status(404).json({ error: 'No account found for that email.' });
  res.json({ ...adminToJson(rows[0]), restaurantId: rows[0].restaurant_id, coffeeShopId: rows[0].coffee_shop_id });
});

// List all restaurants and coffee shops (for the link picker and admin dashboard)
router.get('/restaurants-list', requireAuth, requireRole('director', 'sellers'), async (_req, res) => {
  const { rows: restos } = await query(
    `SELECT id, name, location, phone, open_status, delivery_enabled, delivery_fee, estimated_time, 'restaurant' as type FROM restaurants ORDER BY name`
  );
  const { rows: cafes } = await query(
    `SELECT id, name, location, phone, open_status, NULL::boolean as delivery_enabled, NULL::numeric as delivery_fee, NULL as estimated_time, 'coffeeshop' as type FROM coffee_shops ORDER BY name`
  );
  res.json([...restos, ...cafes]);
});

// PATCH a restaurant's admin-editable fields (open_status, delivery_enabled, delivery_fee, estimated_time)
router.patch('/restaurants/:id', requireAuth, requireRole('director', 'sellers'), async (req, res) => {
  const allowed = ['open_status', 'delivery_enabled', 'delivery_fee', 'estimated_time', 'name', 'location', 'phone'];
  const sets = [];
  const params = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      params.push(req.body[key]);
      sets.push(`${key}=$${params.length}`);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'No fields to update.' });
  params.push(req.params.id);
  const { rows } = await query(
    `UPDATE restaurants SET ${sets.join(', ')}, updated_at=NOW() WHERE id=$${params.length} RETURNING *`,
    params
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json(rows[0]);
});

// PATCH a coffee shop's admin-editable fields
router.patch('/coffee-shops/:id', requireAuth, requireRole('director', 'sellers'), async (req, res) => {
  const allowed = ['open_status', 'name', 'location', 'phone'];
  const sets = [];
  const params = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      params.push(req.body[key]);
      sets.push(`${key}=$${params.length}`);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'No fields to update.' });
  params.push(req.params.id);
  const { rows } = await query(
    `UPDATE coffee_shops SET ${sets.join(', ')}, updated_at=NOW() WHERE id=$${params.length} RETURNING *`,
    params
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json(rows[0]);
});

module.exports = router;
