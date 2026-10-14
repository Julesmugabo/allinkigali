/**
 * resto.js — browse settings for restaurants: cuisine chips, moment chips,
 * filters, card tags and the text a search matches (dishes included).
 */
import {
  RESTAURANTS, CUISINES, CUISINE_FOODS, OCCASION_LABELS, ATMOSPHERES, ATMOSPHERE_LABELS,
  DIETARY, DIETARY_LABELS, SEATINGS, SEATING_LABELS, FEATURES, FEATURE_LABELS, PRICE_LABELS,
} from '../../../../data/restaurantData';
import {
  anyOf, allOf, optionsFrom, priceGroup, ratingGroup, openNowChip, deliversChip, has,
} from './common';

const cuisineLabel = (k) => CUISINES.find((c) => c.key === k)?.label || k.charAt(0).toUpperCase() + k.slice(1);

export default {
  key: 'resto',
  title: 'Restaurants',
  heading: 'Restaurants in Kigali',
  noun: ['restaurant', 'restaurants'],
  path: '/restaurants',
  fallback: RESTAURANTS,
  detailRoute: 'RestaurantDetail',
  listRoute: 'RestaurantMarket',
  icon: 'silverware-fork-knife',
  searchHint: 'Search a restaurant, dish (e.g. "brochettes") or area…',
  priceLabel: (p) => PRICE_LABELS[p] || '',

  // Cuisine chips: the cuisines that actually appear, most common first.
  primaryChips: (places) => {
    const count = {};
    places.forEach((p) => (p.cuisines || []).forEach((c) => { count[c] = (count[c] || 0) + 1; }));
    return Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, 12)
      .map((c) => ({ key: `cuisine-${c}`, label: cuisineLabel(c), test: has('cuisines', [c]) }));
  },
  momentChips: [
    openNowChip,
    { key: 'date', label: '❤️ Date night', test: has('occasion', ['date', 'anniversary']) },
    { key: 'family', label: '👨‍👩‍👧 Family', test: has('occasion', ['family']) },
    { key: 'business', label: '💼 Business', test: has('occasion', ['business']) },
    deliversChip,
    { key: 'vegan', label: '🥗 Vegan', test: has('dietary', ['vegan']) },
  ],
  filterGroups: () => [
    priceGroup(PRICE_LABELS),
    anyOf('atmosphere', 'Atmosphere', 'atmosphere', optionsFrom(ATMOSPHERES, ATMOSPHERE_LABELS)),
    allOf('diet', 'Diet', 'dietary', optionsFrom(DIETARY, DIETARY_LABELS)),
    anyOf('seating', 'Seating', 'seating', optionsFrom(SEATINGS, SEATING_LABELS)),
    anyOf('features', 'Features', 'features', optionsFrom(FEATURES, FEATURE_LABELS)),
    ratingGroup,
  ],

  subtitle: (p) => (p.cuisines || []).slice(0, 2).map(cuisineLabel).join(' · '),
  tags: (p) => [
    ...(p.occasion || []).slice(0, 1).map((o) => OCCASION_LABELS[o] || o),
    ...(p.seating || []).filter((s) => s !== 'standard').slice(0, 1).map((s) => SEATING_LABELS[s] || s),
  ],
  searchText: (p) => [
    p.name, p.location, p.district, p.description, ...(p.foods || []),
    ...(p.cuisines || []).flatMap((c) => [cuisineLabel(c), ...(CUISINE_FOODS[c] || [])]),
  ],

  // Place page
  reviewType: 'restaurant',
  orderType: 'restaurant',
  menuPath: (id) => `/restaurant-menu/${id}`,
  booking: { type: 'restaurant', title: 'Book a table', button: 'Book table', guests: 'Guests', icon: 'silverware-fork-knife', times: ['12:00', '13:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'] },
  details: (p) => [
    ['heart-outline', 'Good for', (p.occasion || []).map((o) => OCCASION_LABELS[o] || o)],
    ['weather-partly-cloudy', 'Atmosphere', (p.atmosphere || []).map((a) => ATMOSPHERE_LABELS[a] || a)],
    ['leaf-circle-outline', 'Diet', (p.dietary || []).map((d) => DIETARY_LABELS[d] || d)],
    ['chair-rolling', 'Seating', (p.seating || []).map((s) => SEATING_LABELS[s] || s)],
    ['star-outline', 'Features', (p.features || []).map((f) => FEATURE_LABELS[f] || f)],
    ['food-outline', 'Signature dishes', p.foods || []],
  ],
};
