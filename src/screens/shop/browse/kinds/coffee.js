/**
 * coffee.js — browse settings for coffee shops: intent chips (work, study,
 * date…), live "quiet now", filters, card tags and search text.
 */
import {
  COFFEE_SHOPS, INTENTS, INTENT_ATTRIBUTES, COFFEE_TYPES, BREWING_METHODS, ATMOSPHERES_CS,
  FACILITIES_CS, FACILITY_LABELS, SEATINGS_CS, SEATING_LABELS_CS, SERVICES_CS, SERVICE_LABELS_CS,
} from '../../../../data/coffeeShopData';
import {
  anyOf, optionsFrom, priceGroup, ratingGroup, openNowChip, deliversChip, topRatedChip, has,
} from './common';
import { COFFEE_THEME } from '../../../../theme/shopThemes';

const PRICE = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

export default {
  key: 'coffee',
  theme: COFFEE_THEME, // warm espresso look, same as the phone coffee screens
  title: 'Coffee Shops',
  heading: 'Coffee shops in Kigali',
  noun: ['coffee shop', 'coffee shops'],
  path: '/coffee-shops',
  fallback: COFFEE_SHOPS,
  detailRoute: 'CoffeeShopDetail',
  listRoute: 'CoffeeShopMarket',
  icon: 'coffee-outline',
  searchHint: 'Search a café, drink (e.g. "cold brew") or area…',
  priceLabel: (p) => PRICE[p] || '',

  primaryChips: () => INTENTS.map((i) => ({
    key: `intent-${i.key}`, label: `${i.emoji} ${i.label}`, test: has('attributes', INTENT_ATTRIBUTES[i.key] || []),
  })),
  momentChips: [
    openNowChip,
    { key: 'quiet-now', label: '🤫 Quiet right now', test: (p) => p.busyNow === 'quiet' },
    deliversChip,
    topRatedChip,
  ],
  filterGroups: () => [
    priceGroup(PRICE),
    anyOf('drinks', 'Coffee', 'coffeeTypes', optionsFrom(COFFEE_TYPES)),
    anyOf('brewing', 'Brewing', 'brewingMethods', optionsFrom(BREWING_METHODS)),
    anyOf('atmosphere', 'Atmosphere', 'atmosphere', optionsFrom(ATMOSPHERES_CS)),
    anyOf('facilities', 'Facilities', 'facilities', optionsFrom(FACILITIES_CS, FACILITY_LABELS)),
    anyOf('seating', 'Seating', 'seating', optionsFrom(SEATINGS_CS, SEATING_LABELS_CS)),
    anyOf('services', 'Services', 'services', optionsFrom(SERVICES_CS, SERVICE_LABELS_CS)),
    ratingGroup,
  ],

  subtitle: (p) => (p.atmosphere || []).slice(0, 2).join(' · ') || 'Coffee shop',
  tags: (p) => INTENTS.filter((i) => has('attributes', INTENT_ATTRIBUTES[i.key] || [])(p)).slice(0, 2).map((i) => `${i.emoji} ${i.label}`),
  searchText: (p) => [p.name, p.location, p.district, p.description, ...(p.coffeeTypes || []), ...(p.food || []), ...(p.atmosphere || [])],

  // Place page
  reviewType: 'coffee_shop',
  orderType: 'coffeeshop',
  menuPath: (id) => `/restaurant-menu/coffee-shop/${id}`,
  booking: { type: 'coffee_shop', title: 'Reserve a seat', button: 'Reserve seat', guests: 'People', icon: 'coffee-outline', times: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'] },
  details: (p) => [
    ['target', 'Good for', INTENTS.filter((i) => has('attributes', INTENT_ATTRIBUTES[i.key] || [])(p)).map((i) => `${i.emoji} ${i.label}`)],
    ['coffee', 'Coffee', p.coffeeTypes || []],
    ['coffee-maker-outline', 'Brewing', p.brewingMethods || []],
    ['earth', 'Origins', p.origins || []],
    ['food-croissant', 'Food', p.food || []],
    ['weather-partly-cloudy', 'Atmosphere', p.atmosphere || []],
    ['wifi', 'Facilities', (p.facilities || []).map((f) => FACILITY_LABELS[f] || f)],
    ['sofa-outline', 'Seating', (p.seating || []).map((s) => SEATING_LABELS_CS[s] || s)],
    ['room-service-outline', 'Services', (p.services || []).map((s) => SERVICE_LABELS_CS[s] || s)],
  ],
};
