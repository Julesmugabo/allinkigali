/**
 * adminAuth.js — Kwinjira mu buyobozi (admin access).
 *
 * Real accounts now: AdminGateScreen.js signs a person in against Supabase
 * Auth, then looks up their role in the `admin_roles` table (see
 * supabase/001_admin_roles.sql) to decide which dashboard opens. Nobody can
 * grant themselves a role through the app — that table has no insert policy,
 * roles are only ever assigned directly in the Supabase SQL Editor.
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
