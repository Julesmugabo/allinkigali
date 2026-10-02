/**
 * adminAuth.js — Admin roles and route metadata.
 *
 * Original 3 roles (news, sellers, director) + 5 marketplace admin roles
 * added for the marketplace dashboards. Director accounts are still only ever
 * created directly against the database via createAdmin.js. All other roles
 * are granted by the director through the Director Dashboard → Admins tab.
 */

export const ADMIN_ROLES = {
  NEWS:        'news',
  SELLERS:     'sellers',
  DIRECTOR:    'director',
  IBIBANZA:    'ibibanza',
  INZUZAMACYE: 'inzuzamacye',
  SALEHOUSE:   'salehouse',
  ALLINGADGET: 'allingadget',
  URUHURWIZA:  'uruhurwiza',
};

export const ROLE_META = {
  [ADMIN_ROLES.NEWS]:        { label: 'News Dashboard',           icon: 'newspaper-variant-outline', route: 'NewsAdminDashboard'      },
  [ADMIN_ROLES.SELLERS]:     { label: 'Sales Partners Dashboard', icon: 'storefront-outline',        route: 'SellersAdminDashboard'   },
  [ADMIN_ROLES.DIRECTOR]:    { label: 'Director Dashboard',       icon: 'chart-box-outline',         route: 'DirectorAdminDashboard'  },
  [ADMIN_ROLES.IBIBANZA]:    { label: 'Ibibanza Dashboard',       icon: 'terrain',                   route: 'IbibanzaDashboard'       },
  [ADMIN_ROLES.INZUZAMACYE]: { label: 'Inzu Zamacye Dashboard',   icon: 'home-search-outline',       route: 'InzuZamacyeDashboard'    },
  [ADMIN_ROLES.SALEHOUSE]:   { label: 'House for Sale Dashboard', icon: 'home-city-outline',         route: 'SaleHouseDashboard'      },
  [ADMIN_ROLES.ALLINGADGET]: { label: 'Allingadget Dashboard',    icon: 'laptop',                    route: 'AllingadgetDashboard'    },
  [ADMIN_ROLES.URUHURWIZA]:  { label: 'Uruhu Rwiza Dashboard',    icon: 'face-woman-outline',        route: 'UruhuRwizaDashboard'     },
};

export default { ADMIN_ROLES, ROLE_META };
