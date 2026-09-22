/**
 * db.js — the one Postgres connection pool every route goes through.
 * Mirrors the app-side discipline (every screen only ever calls a
 * Context) — routes only ever call query() here, never construct their
 * own client.
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
