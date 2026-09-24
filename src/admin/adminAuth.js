/**
 * adminAuth.js — Kwinjira mu buyobozi (admin access).
 *
 * There's no separate admin login screen any more — everyone signs in
 * through the same form in the Me tab (AccountScreen.js / SignInForm.js),
 * which talks to our Express + Postgres backend (server/src/routes/auth.js).
 * The signed-in account's `role` (from the `users` table) decides whether
 * an "Ubuyobozi" row even appears, and which dashboard it opens.
 * A News/Sellers role can only ever be granted by a director, from inside
 * the Director Dashboard (server/src/routes/admin.js's /assign-role) — the
 * one thing that never changed is that nobody can grant themselves an admin
 * role through ordinary sign-up; a director account itself is still only
 * ever created directly against the database (see server/src/createAdmin.js).
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
