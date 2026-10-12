/**
 * requireRole.js — the Express-side replacement for the
 * `exists (select 1 from admin_roles where ... role in (...))` checks that
 * used to live inside Postgres RLS policies. Must run after requireAuth.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || (req.user.role !== 'director' && !allowedRoles.includes(req.user.role))) {
      return res.status(403).json({ error: 'Not allowed.' });
    }
    next();
  };
}

module.exports = requireRole;
