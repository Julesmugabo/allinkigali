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
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();
const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

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

module.exports = router;
