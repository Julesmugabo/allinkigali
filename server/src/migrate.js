/**
 * migrate.js — applies every .sql file in migrations/, in filename order,
 * tracking what's already run in a `_migrations` table so re-running this
 * is always safe (already-applied files are skipped).
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function run() {
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

  for (const file of files) {
    if (appliedNames.has(file)) {
      console.log(`skip  ${file} (already applied)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`apply ${file}`);
    await pool.query(sql);
    await pool.query('insert into _migrations (name) values ($1)', [file]);
  }

  console.log('done');
  await pool.end();
}

run().catch((err) => {
  console.error('MIGRATION FAILED:', err.message);
  process.exit(1);
});
