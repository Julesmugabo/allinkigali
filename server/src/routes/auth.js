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
const { sendCode, checkCode } = require('../services/emailCodes');
const { mailerReady } = require('../services/mailer');
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
    roles: allRoles(row),
    emailVerified: !!row.email_verified,
    restaurantId: row.restaurant_id || null,
    coffeeShopId: row.coffee_shop_id || null,
    createdAt: row.created_at,
  };
}

// The main role first, then any extra Staff Portal dashboards.
function allRoles(row) {
  return [...new Set([row.role, ...(row.staff_roles || [])].filter(Boolean))];
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, roles: allRoles(user), restaurantId: user.restaurant_id || null, coffeeShopId: user.coffee_shop_id || null },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
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
  // A 6-digit code to confirm the email (sending problems don't block the sign-up;
  // "Send a new code" is on the confirm screen).
  try { await sendCode(user, 'verify'); } catch (e) { console.error('[signup] code not sent:', e.message); }
  res.status(201).json({ token: signToken(user), user: userToJson(user), verificationRequired: mailerReady() });
});

// POST /auth/verify-email — { code } from the email
router.post('/verify-email', requireAuth, async (req, res) => {
  const result = await checkCode(req.user.sub, 'verify', req.body?.code);
  if (!result.ok) {
    return res.status(400).json({ error: result.reason === 'wrong' ? 'That code is not right. Check the email and try again.' : 'This code has expired. Ask for a new one.', code: result.reason === 'wrong' ? 'WRONG_CODE' : 'CODE_EXPIRED' });
  }
  const { rows: [user] } = await query('update users set email_verified = true where id = $1 returning *', [req.user.sub]);
  res.json({ user: userToJson(user) });
});

// POST /auth/resend-verification — a fresh code (at most one a minute)
router.post('/resend-verification', requireAuth, async (req, res) => {
  const { rows: [user] } = await query('select * from users where id = $1', [req.user.sub]);
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  if (user.email_verified) return res.json({ ok: true, alreadyVerified: true });
  try { await sendCode(user, 'verify'); } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  res.json({ ok: true });
});

// POST /auth/forgot-password — { email }; always the same answer, so it can't
// be used to find out which emails have accounts.
router.post('/forgot-password', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const { rows: [user] } = email ? await query('select * from users where email = $1', [email]) : { rows: [] };
  if (user) { try { await sendCode(user, 'reset'); } catch (e) { if (e.status !== 429) console.error('[forgot] code not sent:', e.message); } }
  res.json({ ok: true, message: 'If this email has an account, we sent it a 6-digit code.' });
});

// POST /auth/reset-password — { email, code, newPassword }; signs them in.
router.post('/reset-password', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const { newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  const { rows: [user] } = email ? await query('select * from users where email = $1', [email]) : { rows: [] };
  const result = user ? await checkCode(user.id, 'reset', req.body?.code) : { ok: false, reason: 'wrong' };
  if (!result.ok) {
    return res.status(400).json({ error: result.reason === 'wrong' ? 'That code is not right. Check the email and try again.' : 'This code has expired. Ask for a new one.', code: result.reason === 'wrong' ? 'WRONG_CODE' : 'CODE_EXPIRED' });
  }
  // The code came to their inbox, so the email is theirs too.
  const { rows: [updated] } = await query(
    'update users set password_hash = $1, email_verified = true where id = $2 returning *',
    [await bcrypt.hash(newPassword, 10), user.id]);
  res.json({ token: signToken(updated), user: userToJson(updated) });
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

  res.json({ token: signToken(user), role: user.role, user: userToJson(user), verificationRequired: mailerReady() });
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
  res.json({ user: userToJson(rows[0]), verificationRequired: mailerReady() });
});

// POST /auth/google — verify a Google One Tap credential and sign in / create account
router.post('/google', async (req, res) => {
  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ error: 'credential required.' });

  // Verify the Google ID token using Google's tokeninfo endpoint
  const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
  if (!verifyRes.ok) return res.status(401).json({ error: 'Invalid Google token.' });
  const payload = await verifyRes.json();

  // Only tokens Google issued for allinkigali's own client: a token from any
  // other site could otherwise be replayed here to sign in as its owner.
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(503).json({ error: "Google sign-in isn't set up yet. Use your email." });
  if (payload.aud !== clientId) {
    return res.status(401).json({ error: 'Token audience mismatch.' });
  }
  if (!payload.email_verified || payload.email_verified === 'false') {
    return res.status(401).json({ error: 'Google email not verified.' });
  }

  const email = payload.email.toLowerCase();
  const firstName = (payload.given_name || payload.name || email.split('@')[0]).trim();
  const lastName = (payload.family_name || '').trim();

  // Find existing account or create one
  let { rows } = await query('SELECT * FROM users WHERE email=$1', [email]);
  let user = rows[0];
  if (!user) {
    const { rows: created } = await query(
      `INSERT INTO users (email, first_name, last_name, phone, role, password_hash, email_verified)
       VALUES ($1,$2,$3,'',null,'',true) RETURNING *`,
      [email, firstName, lastName || firstName]
    );
    user = created[0];
  } else if (!user.email_verified) {
    // Google has confirmed this address.
    ({ rows: [user] } = await query('update users set email_verified = true where id = $1 returning *', [user.id]));
  }

  res.json({ token: signToken(user), user: userToJson(user) });
});

module.exports = router;
