/**
 * propertyListings.js — Fake house listings, in the style of Zillow: photo-led
 * cards, price, beds/baths, and a map-less location tag. `listingType`
 * ('rent' | 'sale') is what tells Inzu zamacye and House for Sale apart —
 * same shape, same screens, different filter and price label.
 */
export const PROPERTY_FEATURES = [
  'Parking', 'Water tank', 'Solar power', 'Borehole water', 'Fenced compound',
  'Furnished', 'Garden', 'Generator backup', 'CCTV', 'Gated community',
];

export const SEED_PROPERTIES = [
  { id: 'rt-1', listingType: 'rent', title: '3-bedroom house in Kibagabaga', province: 'kigali', district: 'gasabo', sector: 'Kimironko', price: 450000, bedrooms: 3, bathrooms: 2, sizeSqm: 180, features: ['Parking', 'Water tank', 'Fenced compound'], description: 'Modern 3-bedroom house in a quiet, fenced compound close to Kibagabaga hospital.', phone: '0788300101' },
  { id: 'rt-2', listingType: 'rent', title: 'Furnished apartment, Kacyiru', province: 'kigali', district: 'gasabo', sector: 'Kacyiru', price: 600000, bedrooms: 2, bathrooms: 2, sizeSqm: 110, features: ['Furnished', 'Generator backup', 'CCTV'], description: 'Fully furnished 2-bedroom apartment, walking distance to embassies and offices.', phone: '0788300102' },
  { id: 'rt-3', listingType: 'rent', title: 'Studio apartment, Remera', province: 'kigali', district: 'gasabo', sector: 'Remera', price: 220000, bedrooms: 1, bathrooms: 1, sizeSqm: 45, features: ['Furnished', 'Water tank'], description: 'Compact studio, ideal for a single professional, close to Giporoso roundabout.', phone: '0788300103' },
  { id: 'rt-4', listingType: 'rent', title: '2-bedroom house, Kanombe', province: 'kigali', district: 'kicukiro', sector: 'Kanombe', price: 280000, bedrooms: 2, bathrooms: 1, sizeSqm: 90, features: ['Parking', 'Fenced compound'], description: '10 minutes from Kigali International Airport, quiet residential street.', phone: '0788300104' },
  { id: 'rt-5', listingType: 'rent', title: 'Family house, Nyarugunga', province: 'kigali', district: 'kicukiro', sector: 'Nyarugunga', price: 500000, bedrooms: 4, bathrooms: 3, sizeSqm: 220, features: ['Parking', 'Garden', 'Borehole water', 'Generator backup'], description: 'Spacious 4-bedroom family home with a garden, close to international schools.', phone: '0788300105' },
  { id: 'rt-6', listingType: 'rent', title: '1-bedroom in Nyamirambo', province: 'kigali', district: 'nyarugenge', sector: 'Nyamirambo', price: 150000, bedrooms: 1, bathrooms: 1, sizeSqm: 40, features: ['Water tank'], description: 'Affordable, simple one-bedroom house in a lively neighbourhood.', phone: '0788300106' },
  { id: 'rt-7', listingType: 'rent', title: 'House near Musanze town', province: 'northern', district: 'musanze', sector: 'Muhoza', price: 200000, bedrooms: 2, bathrooms: 1, sizeSqm: 95, features: ['Parking', 'Garden'], description: '5-minute walk to Musanze town center, cool mountain climate.', phone: '0788300107' },
  { id: 'rt-8', listingType: 'rent', title: 'House in Huye, near the university', province: 'southern', district: 'huye', sector: 'Ngoma', price: 180000, bedrooms: 2, bathrooms: 1, sizeSqm: 85, features: ['Water tank', 'Fenced compound'], description: 'Popular with university staff, quiet street, easy taxi access.', phone: '0788300108' },
  { id: 'rt-9', listingType: 'rent', title: 'House near Rwamagana town', province: 'eastern', district: 'rwamagana', sector: 'Kigabiro', price: 160000, bedrooms: 2, bathrooms: 1, sizeSqm: 80, features: ['Parking', 'Solar power'], description: 'Simple family house close to the main road into Rwamagana.', phone: '0788300109' },
  { id: 'rt-10', listingType: 'rent', title: 'Lakeview apartment, Rubavu', province: 'western', district: 'rubavu', sector: 'Gisenyi', price: 350000, bedrooms: 2, bathrooms: 2, sizeSqm: 100, features: ['Furnished', 'Generator backup'], description: 'A short walk from Lake Kivu, popular with remote workers and weekenders.', phone: '0788300110' },

  { id: 'sl-1', listingType: 'sale', title: '4-bedroom house, Kibagabaga', province: 'kigali', district: 'gasabo', sector: 'Kimironko', price: 180000000, bedrooms: 4, bathrooms: 3, sizeSqm: 300, features: ['Parking', 'Garden', 'Solar power', 'Gated community'], description: 'Well-built 4-bedroom family home on a titled plot, ready to move in.', phone: '0788300201' },
  { id: 'sl-2', listingType: 'sale', title: 'Apartment block, Kacyiru', province: 'kigali', district: 'gasabo', sector: 'Kacyiru', price: 220000000, bedrooms: 6, bathrooms: 6, sizeSqm: 500, features: ['Parking', 'CCTV', 'Generator backup'], description: 'A 3-unit apartment block, currently rented out, sold with existing tenants.', phone: '0788300202' },
  { id: 'sl-3', listingType: 'sale', title: '3-bedroom bungalow, Kanombe', province: 'kigali', district: 'kicukiro', sector: 'Kanombe', price: 95000000, bedrooms: 3, bathrooms: 2, sizeSqm: 200, features: ['Parking', 'Fenced compound', 'Borehole water'], description: 'Single-storey family home close to the airport, titled land.', phone: '0788300203' },
  { id: 'sl-4', listingType: 'sale', title: 'House with shop space, Nyamirambo', province: 'kigali', district: 'nyarugenge', sector: 'Nyamirambo', price: 75000000, bedrooms: 2, bathrooms: 1, sizeSqm: 150, features: ['Parking'], description: 'Living quarters above a ground-floor shop space, good rental income potential.', phone: '0788300204' },
  { id: 'sl-5', listingType: 'sale', title: 'House near Musanze town', province: 'northern', district: 'musanze', sector: 'Muhoza', price: 60000000, bedrooms: 3, bathrooms: 2, sizeSqm: 160, features: ['Garden', 'Parking'], description: 'Modern house with mountain views, close to the town center.', phone: '0788300205' },
  { id: 'sl-6', listingType: 'sale', title: 'Family house, Huye', province: 'southern', district: 'huye', sector: 'Ngoma', price: 48000000, bedrooms: 3, bathrooms: 2, sizeSqm: 170, features: ['Water tank', 'Fenced compound'], description: 'Spacious compound, close to schools and the university.', phone: '0788300206' },
  { id: 'sl-7', listingType: 'sale', title: 'House, Rwamagana town', province: 'eastern', district: 'rwamagana', sector: 'Kigabiro', price: 42000000, bedrooms: 3, bathrooms: 2, sizeSqm: 165, features: ['Parking', 'Solar power'], description: 'Well-maintained family home on the main Rwamagana road.', phone: '0788300207' },
  { id: 'sl-8', listingType: 'sale', title: 'Lakeview house, Rubavu', province: 'western', district: 'rubavu', sector: 'Gisenyi', price: 150000000, bedrooms: 4, bathrooms: 3, sizeSqm: 280, features: ['Furnished', 'Garden', 'Generator backup'], description: 'Lake Kivu views from the upstairs balcony, titled land.', phone: '0788300208' },
];

export default { SEED_PROPERTIES, PROPERTY_FEATURES };
