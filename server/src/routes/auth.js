/**
 * auth.js (routes) — sign-in for the three admin dashboards AND, now,
 * self-serve sign-up/sign-in for ordinary customer/seller accounts.
 *
 * The one boundary that never moves: /signup can only ever create an
 * account with role = null (an ordinary customer/seller). There is still
 * no way to self-grant an admin role through the app — those are only
 * ever created directly against the database (see server/README.md).
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function userToJson(row) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    role: row.role,
    createdAt: row.created_at,
  };
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body || {};

  if (!firstName || !firstName.trim()) return res.status(400).json({ error: 'Enter your first name.' });
  if (!lastName || !lastName.trim()) return res.status(400).json({ error: 'Enter your last name.' });
  if (!email || !email.trim()) return res.status(400).json({ error: 'Enter your email.' });
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { rows: existing } = await query('select id from users where email = $1', [normalizedEmail]);
  if (existing[0]) {
    return res.status(409).json({ error: 'This email already has an account.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `insert into users (email, password_hash, first_name, last_name, phone, role)
     values ($1, $2, $3, $4, $5, null)
     returning *`,
    [normalizedEmail, passwordHash, firstName.trim(), lastName.trim(), (phone || '').trim()]
  );
  const user = rows[0];
  res.status(201).json({ token: signToken(user), user: userToJson(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Enter your email and password.' });
  }

  const { rows } = await query('select * from users where email = $1', [email.trim().toLowerCase()]);
  const user = rows[0];

  if (!user) {
    // Same message whether the email doesn't exist or the password is
    // wrong — never reveal which one, that's a real enumeration risk.
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  res.json({ token: signToken(user), role: user.role, user: userToJson(user) });
});

router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const { rows } = await query('select password_hash from users where id = $1', [req.user.sub]);
  if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
    return res.status(401).json({ error: 'Your current password is incorrect.' });
  }

  await query('update users set password_hash = $1 where id = $2', [
    await bcrypt.hash(newPassword, 10),
    req.user.sub,
  ]);
  res.status(204).end();
});

router.patch('/me', requireAuth, async (req, res) => {
  const { firstName, lastName, phone } = req.body || {};
  if (!firstName || !firstName.trim()) return res.status(400).json({ error: 'Enter your first name.' });
  if (!lastName || !lastName.trim()) return res.status(400).json({ error: 'Enter your last name.' });

  // Email and role are deliberately not editable here — role in particular
  // must never be changeable by the account holder.
  const { rows } = await query(
    'update users set first_name = $1, last_name = $2, phone = $3 where id = $4 returning *',
    [firstName.trim(), lastName.trim(), (phone || '').trim(), req.user.sub]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Account not found.' });
  res.json({ user: userToJson(rows[0]) });
});

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await query('select * from users where id = $1', [req.user.sub]);
  if (!rows[0]) return res.status(404).json({ error: 'Account not found.' });
  res.json({ user: userToJson(rows[0]) });
});

module.exports = router;
