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

  if (!firstName || !firstName.trim()) return res.status(400).json({ error: 'Andika izina ryawe rya mbere.' });
  if (!lastName || !lastName.trim()) return res.status(400).json({ error: 'Andika izina ryawe rya nyuma.' });
  if (!email || !email.trim()) return res.status(400).json({ error: 'Andika imeyili yawe.' });
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Ijambo ry'ibanga rigomba kuba nibura inyuguti 6." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { rows: existing } = await query('select id from users where email = $1', [normalizedEmail]);
  if (existing[0]) {
    return res.status(409).json({ error: 'Iyi email isanzwe ifite konti.' });
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
    return res.status(400).json({ error: "Andika email n'ijambo ry'ibanga." });
  }

  const { rows } = await query('select * from users where email = $1', [email.trim().toLowerCase()]);
  const user = rows[0];

  if (!user) {
    // Same message whether the email doesn't exist or the password is
    // wrong — never reveal which one, that's a real enumeration risk.
    return res.status(401).json({ error: "Email cyangwa ijambo ry'ibanga sibyo." });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Email cyangwa ijambo ry'ibanga sibyo." });
  }

  res.json({ token: signToken(user), role: user.role, user: userToJson(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await query('select * from users where id = $1', [req.user.sub]);
  if (!rows[0]) return res.status(404).json({ error: 'Account not found.' });
  res.json({ user: userToJson(rows[0]) });
});

module.exports = router;
