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
const bcrypt = require('bcryptjs');
const { pool, query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { linkOwner, unlinkAccount } = require('../clients/placeOwners');

const router = express.Router();
const OWNER_ROLES = ['restaurant', 'coffeeshop'];
const STAFF_DASHBOARDS = ['news', 'sellers', 'finance'];
const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function adminToJson(row) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    roles: [...new Set([row.role, ...(row.staff_roles || [])].filter(Boolean))],
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
  // Owners also show the place they're linked to.
  const { rows } = await query(
    `select u.id, u.email, u.first_name, u.last_name, u.role, u.staff_roles, u.created_at,
            u.restaurant_id, u.coffee_shop_id, coalesce(r.name, c.name) as place_name
     from users u
     left join restaurants r on r.id = u.restaurant_id
     left join coffee_shops c on c.id = u.coffee_shop_id
     where u.role is not null order by u.role, u.email`
  );
  res.json(rows.map((r) => ({ ...adminToJson(r), restaurantId: r.restaurant_id, coffeeShopId: r.coffee_shop_id, placeName: r.place_name })));
});

router.post('/assign-role', requireAuth, requireRole('director'), async (req, res) => {
  const { email, password, firstName, lastName } = req.body || {};
  if (!email || !email.trim()) return res.status(400).json({ error: 'email is required.' });
  const ASSIGNABLE = ['news', 'sellers', 'restaurant', 'coffeeshop', 'ibibanza', 'inzuzamacye', 'salehouse', 'allingadget', 'uruhurwiza', 'finance'];
  // `roles` (several Staff Portal dashboards for one person) or the older single `role`; empty/null revokes.
  const roles = [...new Set(Array.isArray(req.body?.roles) ? req.body.roles : (req.body?.role ? [req.body.role] : []))];
  if (roles.some((r) => !ASSIGNABLE.includes(r))) {
    return res.status(400).json({ error: `roles must be from: ${ASSIGNABLE.join(', ')} (never director).` });
  }
  if (roles.length > 1 && roles.some((r) => !STAFF_DASHBOARDS.includes(r))) {
    return res.status(400).json({ error: 'Only News, Sales Partners and Finance can be combined. An owner has one role.' });
  }
  const role = roles[0] || null;
  const staffRoles = roles.slice(1);

  const normalizedEmail = email.trim().toLowerCase();

  // Check if account exists first.
  const { rows: existing } = await query('select id from users where email = $1', [normalizedEmail]);

  if (!existing[0]) {
    // No account yet — if the director provided a password, create the account now.
    if (!password || !password.trim()) {
      return res.status(404).json({
        code: 'ACCOUNT_NOT_FOUND',
        error: 'No account found for that email. Provide a temporary password to create one.',
      });
    }
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ error: 'First name is required when creating a new account.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows: created } = await query(
      `insert into users (email, password_hash, first_name, last_name, role, staff_roles)
       values ($1, $2, $3, $4, $5, $6)
       returning id, email, first_name, last_name, role, staff_roles, created_at`,
      [normalizedEmail, passwordHash, firstName.trim(), (lastName || '').trim(), role, staffRoles]
    );
    return res.status(201).json({ ...adminToJson(created[0]), created: true });
  }

  // Account exists — just update the role.
  const { rows } = await query(
    `update users set role = $1, staff_roles = $2 where email = $3
     returning id, email, first_name, last_name, role, staff_roles, created_at`,
    [role, staffRoles, normalizedEmail]
  );
  // No longer a restaurant / coffee-shop owner (access removed, or now staff):
  // their client-dashboard sign-in and the old place link go too.
  if (!OWNER_ROLES.includes(role)) {
    await query('update users set restaurant_id = null, coffee_shop_id = null where id = $1', [rows[0].id]);
    await unlinkAccount(rows[0].id);
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
  // The owner signs in at the client dashboard (business.allinkigali.rw) with this account.
  const placeId = coffeeShopId || restaurantId;
  if (placeId) await linkOwner(coffeeShopId ? 'coffeeshop' : 'restaurant', placeId, rows[0].id, 'allinkigali · director');
  res.json({ ...adminToJson(rows[0]), restaurantId: rows[0].restaurant_id, coffeeShopId: rows[0].coffee_shop_id });
});

// List all restaurants and coffee shops (for the link picker and admin dashboard)
// Every listing (active or not) for the Sales Partners admin and director.
const LIST_COLS = `id, name, location, district, phone, rating, open_status, is_active,
  delivery_enabled, delivery_fee, min_order, estimated_time, created_at`;

router.get('/restaurants-list', requireAuth, requireRole('director', 'sellers'), async (_req, res) => {
  const { rows: restos } = await query(`SELECT ${LIST_COLS}, 'restaurant' as type FROM restaurants ORDER BY name`);
  const { rows: cafes } = await query(`SELECT ${LIST_COLS}, 'coffeeshop' as type FROM coffee_shops ORDER BY name`);
  res.json([...restos, ...cafes]);
});

// Quick admin edits from the places list. Coffee shops have the same
// delivery columns as restaurants (they couldn't be switched on before).
const QUICK_FIELDS = ['open_status', 'is_active', 'delivery_enabled', 'delivery_fee', 'min_order', 'estimated_time', 'name', 'location', 'phone'];

function quickPatch(table) {
  return async (req, res) => {
    const sets = [];
    const params = [];
    for (const key of QUICK_FIELDS) {
      if (req.body[key] !== undefined) { params.push(req.body[key]); sets.push(`${key}=$${params.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update.' });
    params.push(req.params.id);
    const { rows } = await query(`UPDATE ${table} SET ${sets.join(', ')}, updated_at=NOW() WHERE id=$${params.length} RETURNING *`, params);
    if (!rows.length) return res.status(404).json({ error: 'Not found.' });
    res.json(rows[0]);
  };
}

router.patch('/restaurants/:id', requireAuth, requireRole('director', 'sellers'), quickPatch('restaurants'));
router.patch('/coffee-shops/:id', requireAuth, requireRole('director', 'sellers'), quickPatch('coffee_shops'));

module.exports = router;
