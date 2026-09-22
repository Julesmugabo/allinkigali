/**
 * auth.js (routes) — sign-in for the three admin dashboards. There's no
 * self-serve sign-up here on purpose: admin accounts are created directly
 * against the database (see server/README.md), same deliberate boundary
 * as before — nobody can grant themselves an admin role through the app.
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Andika email n'ijambo ry'ibanga." });
  }

  const { rows } = await query('select id, email, password_hash, role from users where email = $1', [
    email.trim().toLowerCase(),
  ]);
  const user = rows[0];

  if (!user || !user.role) {
    // Same message whether the email doesn't exist or the password is
    // wrong — never reveal which one, that's a real enumeration risk.
    return res.status(401).json({ error: "Email cyangwa ijambo ry'ibanga sibyo." });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Email cyangwa ijambo ry'ibanga sibyo." });
  }

  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.json({ token, role: user.role });
});

module.exports = router;
