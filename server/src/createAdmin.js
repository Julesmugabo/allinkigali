/**
 * createAdmin.js — one-off script to create/update an admin account.
 * Usage: node src/createAdmin.js <email> <password> <role>
 * role is one of: news | sellers | director
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function run() {
  const [email, password, role] = process.argv.slice(2);
  if (!email || !password || !role) {
    console.error('Usage: node src/createAdmin.js <email> <password> <role>');
    process.exit(1);
  }
  if (!['news', 'sellers', 'director'].includes(role)) {
    console.error('role must be one of: news, sellers, director');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    `insert into users (email, password_hash, role)
     values ($1, $2, $3)
     on conflict (email) do update set password_hash = excluded.password_hash, role = excluded.role`,
    [email.trim().toLowerCase(), passwordHash, role]
  );

  console.log(`Admin account ready: ${email} (${role})`);
  await pool.end();
}

run().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
