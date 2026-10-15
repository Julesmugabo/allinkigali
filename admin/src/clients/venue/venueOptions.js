/**
 * venueOptions.js — the choices a wedding venue's profile offers, with the
 * same keys and words the app shows couples (src/data/weddingVenueData.js).
 */
const list = (labels) => Object.entries(labels).map(([value, label]) => ({ value, label }));

export const FACILITIES = list({
  parking: 'Parking', tables_chairs: 'Tables & chairs', tent: 'Tent', stage: 'Stage', sound_system: 'Sound system',
  event_lighting: 'Event lighting', generator: 'Generator', bridal_room: 'Bridal room', toilets: 'Toilets', kitchen: 'Kitchen',
  security: 'Security', wifi: 'Wi-Fi', wheelchair: 'Wheelchair accessible', rain_backup: 'Rain backup',
});
export const VIEWS = list({
  garden_views: 'Garden views', city_views: 'City views', mountain_views: 'Mountain views', waterfront: 'Waterfront',
  green_natural: 'Green / natural', scenic: 'Scenic',
});
export const PRIVACY = list({ private_venue: 'Private venue', exclusive_booking: 'Exclusive booking' });
export const PHOTOGRAPHY = list({ instagrammable: 'Instagrammable spots', photo_areas: 'Dedicated photography areas' });
export const PRICES = [{ value: '1', label: 'Budget-friendly' }, { value: '2', label: 'Mid-range' }, { value: '3', label: 'Luxury' }];
export const DISTRICTS = ['Gasabo', 'Kicukiro', 'Nyarugenge', 'Bugesera', 'Rwamagana', 'Musanze', 'Rubavu', 'Huye', 'Other'];
