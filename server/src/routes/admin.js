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
  const ASSIGNABLE = ['news', 'sellers', 'ibibanza', 'inzuzamacye', 'salehouse', 'allingadget', 'uruhurwiza'];
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

module.exports = router;
