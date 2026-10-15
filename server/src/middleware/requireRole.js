/**
 * requireRole.js — the Express-side replacement for the
 * `exists (select 1 from admin_roles where ... role in (...))` checks that
 * used to live inside Postgres RLS policies. Must run after requireAuth.
 *
 * A staff account can hold several dashboards (token `roles`, e.g. news +
 * finance); `role` alone is the older single-role form. The director passes
 * every requireRole check.
 */
const rolesOf = (user) => (user ? (Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role]).filter(Boolean) : []);

// true when the user holds any of these roles (no director shortcut).
const hasRole = (user, ...roles) => rolesOf(user).some((r) => roles.includes(r));

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !hasRole(req.user, 'director', ...allowedRoles)) {
      return res.status(403).json({ error: 'Not allowed.' });
    }
    next();
  };
}

module.exports = requireRole;
module.exports.hasRole = hasRole;
module.exports.rolesOf = rolesOf;
