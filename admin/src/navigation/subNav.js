/**
 * subNav.js — which dashboards have sub-items in the sidebar. Keyed by the
 * dashboard's base path; each dashboard owns its list in its own nav.js.
 * A dashboard without an entry shows as a single sidebar link.
 */
import { financeNav } from '../dashboards/finance/nav';
import { newsNav } from '../dashboards/news/nav';
import { restaurantsNav, coffeeShopsNav } from '../dashboards/places/nav';
import { sellersNav } from '../dashboards/sellers/nav';
import { directorNav } from '../dashboards/director/nav';

export const SUB_NAV = {
  '/overview': directorNav,
  '/finance': financeNav,
  '/news': newsNav,
  '/sellers': sellersNav,
  '/restaurants': restaurantsNav,
  '/coffee-shops': coffeeShopsNav,
};
