/**
 * nav.js — sidebar sub-items for the Restaurants and Coffee Shops admins.
 */
import { PLACE_TYPES } from './placeTypes';

const navFor = (type) => type.sections.map((s) => ({
  to: s.key === 'overview' ? type.base : `${type.base}/${s.key}`,
  label: s.label,
}));

export const restaurantsNav = navFor(PLACE_TYPES.restaurant);
export const coffeeShopsNav = navFor(PLACE_TYPES.coffeeshop);
