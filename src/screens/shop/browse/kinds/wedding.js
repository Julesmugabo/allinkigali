/**
 * wedding.js — browse settings for wedding venues: guest-size chips,
 * setting chips, filters, card tags and search text.
 */
import { WEDDING_VENUES, FACILITY_LABELS, VIEW_LABELS, PRIVACY_LABELS, PHOTO_LABELS } from '../../../../data/weddingVenueData';
import { anyOf, optionsFrom, priceGroup, ratingGroup, topRatedChip, has } from './common';

const PRICE = { 1: 'Budget-friendly', 2: 'Mid-range', 3: 'Luxury' };
const fits = (min, max) => (p) => Number(p.capacity || 0) >= min && (max == null || Number(p.capacity || 0) < max);

export default {
  key: 'wedding',
  title: 'Wedding Venues',
  heading: 'Wedding venues in Kigali',
  noun: ['venue', 'venues'],
  path: '/wedding-venues',
  fallback: WEDDING_VENUES,
  detailRoute: 'WeddingDetail',
  listRoute: 'WeddingMarket',
  icon: 'flower-outline',
  searchHint: 'Search a venue, area or style (e.g. "garden")…',
  priceLabel: (p) => PRICE[p] || '',

  primaryChips: () => [
    { key: 'size-small', label: 'Intimate (under 200)', test: fits(1, 200) },
    { key: 'size-medium', label: 'Medium (200–500)', test: fits(200, 500) },
    { key: 'size-large', label: 'Large (500+)', test: fits(500) },
  ],
  momentChips: [
    { key: 'garden', label: '🌳 Garden', test: has('views', ['garden_views', 'green_natural']) },
    { key: 'city', label: '🏙 City view', test: has('views', ['city_views']) },
    { key: 'rain', label: '☔ Rain backup', test: has('facilities', ['rain_backup', 'tent']) },
    { key: 'budget', label: '💰 Budget-friendly', test: (p) => Number(p.price) === 1 },
    topRatedChip,
  ],
  filterGroups: () => [
    priceGroup(PRICE),
    {
      key: 'guests', title: 'Guests', options: [{ key: '100', label: '100+' }, { key: '300', label: '300+' }, { key: '500', label: '500+' }, { key: '1000', label: '1,000+' }],
      test: (p, picked) => Number(p.capacity || 0) >= Math.min(...picked.map(Number)),
    },
    anyOf('views', 'Setting & views', 'views', optionsFrom(Object.keys(VIEW_LABELS), VIEW_LABELS)),
    anyOf('facilities', 'Facilities', 'facilities', optionsFrom(Object.keys(FACILITY_LABELS), FACILITY_LABELS)),
    anyOf('privacy', 'Privacy', 'privacy', optionsFrom(Object.keys(PRIVACY_LABELS), PRIVACY_LABELS)),
    ratingGroup,
  ],

  subtitle: (p) => (p.capacity ? `Up to ${Number(p.capacity).toLocaleString()} guests` : 'Wedding venue'),
  tags: (p) => (p.views || []).slice(0, 2).map((v) => VIEW_LABELS[v] || v),
  searchText: (p) => [p.name, p.location, p.district, p.description,
    ...(p.views || []).map((v) => VIEW_LABELS[v] || v), ...(p.facilities || []).map((f) => FACILITY_LABELS[f] || f)],

  // Place page
  reviewType: 'wedding',
  orderType: null,
  menuPath: null,
  booking: { type: 'wedding', title: 'Book a visit', button: 'Request visit', guests: 'Expected guests', icon: 'calendar-heart', times: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'], note: 'Visit the venue with the manager before you book your day.' },
  details: (p) => [
    ['account-group-outline', 'Capacity', p.capacity ? [`Up to ${Number(p.capacity).toLocaleString()} guests`] : []],
    ['image-filter-hdr', 'Setting & views', (p.views || []).map((v) => VIEW_LABELS[v] || v)],
    ['check-decagram-outline', 'Facilities', (p.facilities || []).map((f) => FACILITY_LABELS[f] || f)],
    ['lock-outline', 'Privacy', (p.privacy || []).map((x) => PRIVACY_LABELS[x] || x)],
    ['camera-outline', 'Photography', (p.photography || []).map((x) => PHOTO_LABELS[x] || x)],
  ],
};
