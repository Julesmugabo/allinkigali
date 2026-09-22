/**
 * auth.js — JWT verification, the Express-side replacement for what
 * Supabase's RLS + auth.uid() used to do automatically.
 *
 * requireAuth: rejects if there's no valid token.
 * attachUserIfPresent: decodes a token if one's there, but never rejects —
 * used on routes that behave differently for admins vs. the public (e.g.
 * a customer sees only published articles, an admin sees everything) but
 * are still open to anonymous requests.
 */
const jwt = require('jsonwebtoken');

function getTokenFromHeader(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

function attachUserIfPresent(req, _res, next) {
  const token = getTokenFromHeader(req);
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

function requireAuth(req, res, next) {
  attachUserIfPresent(req, res, () => {
    if (!req.user) return res.status(401).json({ error: 'Not signed in.' });
    next();
  });
}

module.exports = { requireAuth, attachUserIfPresent };
