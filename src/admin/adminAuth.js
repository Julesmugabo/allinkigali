/**
 * adminAuth.js — Admin roles and route metadata.
 *
 * Director accounts are only ever created directly against the database via
 * createAdmin.js. All other roles are granted by the director through the
 * Director Dashboard → Admins tab.
 */

export const ADMIN_ROLES = {
  NEWS:        'news',
  SELLERS:     'sellers',
  DIRECTOR:    'director',
  RESTAURANT:  'restaurant',
  COFFEESHOP:  'coffeeshop',
  FINANCE:     'finance',
};

export const ROLE_META = {
  [ADMIN_ROLES.NEWS]:       { label: 'News Dashboard',            icon: 'newspaper-variant-outline', route: 'NewsAdminDashboard'       },
  [ADMIN_ROLES.SELLERS]:    { label: 'Sales Partners Dashboard',  icon: 'storefront-outline',        route: 'SellersAdminDashboard'    },
  [ADMIN_ROLES.DIRECTOR]:   { label: 'Director Dashboard',        icon: 'chart-box-outline',         route: 'DirectorAdminDashboard'   },
  [ADMIN_ROLES.RESTAURANT]: { label: 'Restaurant Dashboard',      icon: 'silverware-fork-knife',     route: 'RestaurantAdminDashboard' },
  [ADMIN_ROLES.COFFEESHOP]: { label: 'Coffee Shop Dashboard',     icon: 'coffee-outline',            route: 'CoffeeShopAdminDashboard' },
  [ADMIN_ROLES.FINANCE]:    { label: 'Finance Dashboard',         icon: 'cash-register',             route: 'FinanceDashboard'         },
};

export default { ADMIN_ROLES, ROLE_META };
