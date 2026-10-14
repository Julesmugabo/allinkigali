/**
 * placeTypes.js — everything that differs between restaurants and coffee
 * shops: endpoints, sidebar sections, tag groups (same options as the
 * original app), and how a place maps to/from the editor form.
 */
const lbl = (map) => Object.entries(map).map(([value, label]) => ({ value, label }));

const RESTAURANT_TAGS = [
  {
    key: 'cuisines', label: 'Cuisines', options: lbl({
      rwandan: 'Rwandan', ethiopian: 'Ethiopian', italian: 'Italian', japanese: 'Japanese', indian: 'Indian', chinese: 'Chinese',
      mediterranean: 'Mediterranean', french: 'French', american: 'American', middle_eastern: 'Middle Eastern', lebanese: 'Lebanese',
      korean: 'Korean', thai: 'Thai', mexican: 'Mexican', fusion: 'Fusion', seafood: 'Seafood', vegetarian: 'Vegetarian', vegan: 'Vegan',
      steakhouse: 'Steakhouse', bbq: 'BBQ', pizza: 'Pizza', burgers: 'Burgers', café: 'Café',
    }),
  },
  { key: 'occasion', label: 'Good for', options: lbl({ business: 'Business', romantic: 'Romantic', family: 'Family', friends: 'Friends', celebrations: 'Celebrations', casual: 'Casual', solo: 'Solo' }) },
  { key: 'atmosphere', label: 'Atmosphere', options: lbl({ cozy: 'Cozy', lively: 'Lively', quiet: 'Quiet', elegant: 'Elegant', rustic: 'Rustic', modern: 'Modern', rooftop: 'Rooftop', outdoor: 'Outdoor' }) },
  { key: 'dietary', label: 'Dietary', options: lbl({ vegetarian: 'Vegetarian', vegan: 'Vegan', glutenfree: 'Gluten-free', halal: 'Halal', dairyfree: 'Dairy-free' }) },
  { key: 'seating', label: 'Seating', options: lbl({ indoor: 'Indoor', outdoor: 'Outdoor', terrace: 'Terrace', rooftop: 'Rooftop', private: 'Private room', bar: 'Bar' }) },
  { key: 'features', label: 'Features', options: lbl({ wifi: 'WiFi', parking: 'Parking', reservation: 'Reservations', livemusic: 'Live music', delivery: 'Delivery', takeaway: 'Takeaway', bar: 'Bar', sundaybrunch: 'Sunday brunch' }) },
];

export const COFFEE_ATTRIBUTES = lbl({
  wifi: 'WiFi', poweroutlets: 'Power sockets', laptopfriendly: 'Laptop friendly', workarea: 'Work area', longstay: 'Long stay ok',
  studyarea: 'Study area', quiet: 'Quiet', romantic: 'Romantic', cozy: 'Cozy', outdoor: 'Outdoor seating', scenicview: 'Scenic view',
  groupseating: 'Group seating', spacious: 'Spacious', lively: 'Lively', relaxed: 'Relaxed', studyfriendly: 'Study friendly',
  terrace: 'Terrace', garden: 'Garden', rooftop: 'Rooftop', petfriendly: 'Pet friendly',
});

// Which attributes make a coffee shop show up for each visitor intent.
export const COFFEE_INTENTS = [
  { key: 'work', label: '💻 Work remotely', attrs: ['wifi', 'poweroutlets', 'laptopfriendly', 'workarea', 'longstay'] },
  { key: 'study', label: '📚 Study', attrs: ['wifi', 'poweroutlets', 'studyarea', 'quiet'] },
  { key: 'date', label: '❤️ Date', attrs: ['romantic', 'cozy', 'outdoor', 'scenicview'] },
  { key: 'friends', label: '👥 Meet friends', attrs: ['groupseating', 'spacious', 'lively', 'outdoor'] },
  { key: 'quiet', label: '🤫 Quiet place', attrs: ['quiet', 'relaxed', 'studyfriendly'] },
  { key: 'outdoor', label: '🌿 Outdoor seating', attrs: ['outdoor', 'terrace', 'garden', 'rooftop'] },
  { key: 'dog', label: '🐕 Dog friendly', attrs: ['petfriendly', 'outdoor'] },
];

const COFFEE_TAGS = [
  { key: 'coffeeTypes', label: 'Coffee', options: ['Espresso', 'Americano', 'Cappuccino', 'Latte', 'Flat White', 'Cold Brew', 'Pour Over', 'Filter Coffee', 'Specialty Coffee'] },
  { key: 'brewingMethods', label: 'Brewing methods', options: ['Espresso machine', 'Pour over', 'French press', 'AeroPress', 'Chemex', 'Siphon', 'Cold brew'] },
  { key: 'origins', label: 'Bean origins', options: ['Rwanda', 'Ethiopia', 'Kenya', 'Colombia', 'Brazil', 'Guatemala', 'Burundi', 'Uganda'] },
  { key: 'food', label: 'Food', options: ['Pastries', 'Sandwiches', 'Cakes', 'Breakfast', 'Lunch', 'Light meals', 'Vegan options'] },
  { key: 'atmosphere', label: 'Atmosphere', options: ['Cozy', 'Lively', 'Quiet', 'Modern', 'Rustic', 'Artistic', 'Minimalist'] },
  { key: 'facilities', label: 'Facilities', options: lbl({ wifi: 'WiFi', poweroutlets: 'Power outlets', parking: 'Parking', aircon: 'Air con', petfriendly: 'Pet friendly' }) },
  { key: 'seating', label: 'Seating', options: lbl({ indoor: 'Indoor', outdoor: 'Outdoor', terrace: 'Terrace', rooftop: 'Rooftop', bar: 'Bar', coworking: 'Co-working' }) },
  { key: 'attributes', label: 'Attributes (drive the visitor intents)', options: COFFEE_ATTRIBUTES },
];

const BASE_FIELDS = ['name', 'description', 'location', 'district', 'phone', 'website', 'openStatus'];

function fromPlace(type, p) {
  const f = { photos: (p?.photos || []).map((x) => ({ url: x.url, label: x.label || '' })), price: String(p?.price ?? 2), rating: String(p?.rating ?? '4.0') };
  BASE_FIELDS.forEach((k) => { f[k] = p?.[k] || (k === 'openStatus' ? 'Open now' : ''); });
  type.tags.forEach((g) => { f[g.key] = p?.[g.key] || []; });
  if (type.key === 'restaurant') f.foods = (p?.foods || []).join(', ');
  if (type.key === 'coffeeshop') f.services = (p?.services || []).join(', ');
  return f;
}

function toBody(type, f) {
  const body = { ...f, price: parseInt(f.price, 10) || 2, rating: parseFloat(f.rating) || 4, photos: f.photos.filter((p) => p.url) };
  const list = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean);
  if (type.key === 'restaurant') body.foods = list(f.foods);
  if (type.key === 'coffeeshop') body.services = list(f.services);
  return body;
}

export const PLACE_TYPES = {
  restaurant: {
    key: 'restaurant', base: '/restaurants', api: '/restaurants', admin: '/admin/restaurants', bookingType: 'restaurant',
    title: 'Restaurants', one: 'Restaurant', tags: RESTAURANT_TAGS, groupKey: 'cuisines',
    sections: [
      { key: 'overview', label: 'Overview' }, { key: 'list', label: 'Restaurants' }, { key: 'add', label: 'Add Restaurant' },
      { key: 'bookings', label: 'Bookings' }, { key: 'menu', label: 'Menus' }, { key: 'cuisines', label: 'Cuisines' },
    ],
    fromPlace: (p) => fromPlace(PLACE_TYPES.restaurant, p), toBody: (f) => toBody(PLACE_TYPES.restaurant, f),
  },
  coffeeshop: {
    key: 'coffeeshop', base: '/coffee-shops', api: '/coffee-shops', admin: '/admin/coffee-shops', bookingType: 'coffee_shop',
    title: 'Coffee Shops', one: 'Coffee Shop', tags: COFFEE_TAGS, groupKey: 'coffeeTypes',
    sections: [
      { key: 'overview', label: 'Overview' }, { key: 'list', label: 'Coffee Shops' }, { key: 'add', label: 'Add Coffee Shop' },
      { key: 'bookings', label: 'Bookings' }, { key: 'intents', label: 'Visitor Intents' },
    ],
    fromPlace: (p) => fromPlace(PLACE_TYPES.coffeeshop, p), toBody: (f) => toBody(PLACE_TYPES.coffeeshop, f),
  },
};
