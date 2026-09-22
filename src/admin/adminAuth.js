/**
 * adminAuth.js — Kwinjira mu buyobozi (admin access).
 *
 * Real accounts: AdminGateScreen.js signs a person in against our own
 * Express + Postgres backend (server/src/routes/auth.js), which returns
 * their role from the `users` table to decide which dashboard opens.
 * Nobody can grant themselves a role through the app — there's no sign-up
 * endpoint at all; admin accounts are only ever created directly against
 * the database (see server/src/createAdmin.js).
 */

export const ADMIN_ROLES = {
  NEWS: 'news',
  SELLERS: 'sellers',
  DIRECTOR: 'director',
};

export const ROLE_META = {
  [ADMIN_ROLES.NEWS]: { label: 'News Dashboard', icon: 'newspaper-variant-outline', route: 'NewsAdminDashboard' },
  [ADMIN_ROLES.SELLERS]: { label: 'Sales Partners Dashboard', icon: 'storefront-outline', route: 'SellersAdminDashboard' },
  [ADMIN_ROLES.DIRECTOR]: { label: 'Managing Director Dashboard', icon: 'chart-box-outline', route: 'DirectorAdminDashboard' },
};

export default { ADMIN_ROLES, ROLE_META };
