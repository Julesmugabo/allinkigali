/**
 * requireVerified.js — booking, ordering and reviewing need a confirmed
 * email (run after requireAuth). Only enforced once emails can actually be
 * sent (Brevo key set), so nobody is blocked before that.
 */
const { query } = require('../db');
const { mailerReady } = require('../services/mailer');

async function requireVerified(req, res, next) {
  if (!mailerReady()) return next();
  const { rows: [u] } = await query('select email_verified from users where id = $1', [req.user.sub]);
  if (u && !u.email_verified) {
    return res.status(403).json({ error: 'Please confirm your email first — we sent you a 6-digit code.', code: 'EMAIL_NOT_VERIFIED' });
  }
  next();
}

module.exports = requireVerified;
