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
  {
    id: 'rt-1', listingType: 'rent', title: '3-bedroom house in Kibagabaga',
    province: 'kigali', district: 'gasabo', sector: 'Kimironko',
    price: 450000, bedrooms: 3, bathrooms: 2, sizeSqm: 180,
    features: ['Parking', 'Water tank', 'Fenced compound'],
    description: 'Modern 3-bedroom house in a quiet, fenced compound close to Kibagabaga hospital.',
    phone: '0788300101',
    photos: [
      { url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80', label: 'Front view' },
      { url: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80', label: 'Living room' },
      { url: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&q=80', label: 'Master bedroom' },
    ],
  },
  {
    id: 'rt-2', listingType: 'rent', title: 'Furnished apartment, Kacyiru',
    province: 'kigali', district: 'gasabo', sector: 'Kacyiru',
    price: 600000, bedrooms: 2, bathrooms: 2, sizeSqm: 110,
    features: ['Furnished', 'Generator backup', 'CCTV'],
    description: 'Fully furnished 2-bedroom apartment, walking distance to embassies and offices.',
    phone: '0788300102',
    photos: [
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', label: 'Apartment interior' },
      { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80', label: 'Kitchen' },
      { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80', label: 'Bedroom' },
    ],
  },
  {
    id: 'rt-3', listingType: 'rent', title: 'Studio apartment, Remera',
    province: 'kigali', district: 'gasabo', sector: 'Remera',
    price: 220000, bedrooms: 1, bathrooms: 1, sizeSqm: 45,
    features: ['Furnished', 'Water tank'],
    description: 'Compact studio, ideal for a single professional, close to Giporoso roundabout.',
    phone: '0788300103',
    photos: [
      { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', label: 'Studio space' },
      { url: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80', label: 'Kitchen area' },
    ],
  },
  {
    id: 'rt-4', listingType: 'rent', title: '2-bedroom house, Kanombe',
    province: 'kigali', district: 'kicukiro', sector: 'Kanombe',
    price: 280000, bedrooms: 2, bathrooms: 1, sizeSqm: 90,
    features: ['Parking', 'Fenced compound'],
    description: '10 minutes from Kigali International Airport, quiet residential street.',
    phone: '0788300104',
    photos: [
      { url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80', label: 'Exterior' },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', label: 'Compound' },
    ],
  },
  {
    id: 'rt-5', listingType: 'rent', title: 'Family house, Nyarugunga',
    province: 'kigali', district: 'kicukiro', sector: 'Nyarugunga',
    price: 500000, bedrooms: 4, bathrooms: 3, sizeSqm: 220,
    features: ['Parking', 'Garden', 'Borehole water', 'Generator backup'],
    description: 'Spacious 4-bedroom family home with a garden, close to international schools.',
    phone: '0788300105',
    photos: [
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', label: 'Front of house' },
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', label: 'Garden' },
      { url: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80', label: 'Living room' },
    ],
  },
  {
    id: 'rt-6', listingType: 'rent', title: '1-bedroom in Nyamirambo',
    province: 'kigali', district: 'nyarugenge', sector: 'Nyamirambo',
    price: 150000, bedrooms: 1, bathrooms: 1, sizeSqm: 40,
    features: ['Water tank'],
    description: 'Affordable, simple one-bedroom house in a lively neighbourhood.',
    phone: '0788300106',
    photos: [
      { url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80', label: 'Interior' },
    ],
  },
  {
    id: 'rt-7', listingType: 'rent', title: 'House near Musanze town',
    province: 'northern', district: 'musanze', sector: 'Muhoza',
    price: 200000, bedrooms: 2, bathrooms: 1, sizeSqm: 95,
    features: ['Parking', 'Garden'],
    description: '5-minute walk to Musanze town center, cool mountain climate.',
    phone: '0788300107',
    photos: [
      { url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80', label: 'House with mountain view' },
      { url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80', label: 'Garden' },
    ],
  },
  {
    id: 'rt-8', listingType: 'rent', title: 'House in Huye, near the university',
    province: 'southern', district: 'huye', sector: 'Ngoma',
    price: 180000, bedrooms: 2, bathrooms: 1, sizeSqm: 85,
    features: ['Water tank', 'Fenced compound'],
    description: 'Popular with university staff, quiet street, easy taxi access.',
    phone: '0788300108',
    photos: [
      { url: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80', label: 'Front view' },
    ],
  },
  {
    id: 'rt-9', listingType: 'rent', title: 'House near Rwamagana town',
    province: 'eastern', district: 'rwamagana', sector: 'Kigabiro',
    price: 160000, bedrooms: 2, bathrooms: 1, sizeSqm: 80,
    features: ['Parking', 'Solar power'],
    description: 'Simple family house close to the main road into Rwamagana.',
    phone: '0788300109',
    photos: [
      { url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80', label: 'Exterior' },
    ],
  },
  {
    id: 'rt-10', listingType: 'rent', title: 'Lakeview apartment, Rubavu',
    province: 'western', district: 'rubavu', sector: 'Gisenyi',
    price: 350000, bedrooms: 2, bathrooms: 2, sizeSqm: 100,
    features: ['Furnished', 'Generator backup'],
    description: 'A short walk from Lake Kivu, popular with remote workers and weekenders.',
    phone: '0788300110',
    photos: [
      { url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80', label: 'Lake view' },
      { url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80', label: 'Living room' },
    ],
  },

  {
    id: 'sl-1', listingType: 'sale', title: '4-bedroom house, Kibagabaga',
    province: 'kigali', district: 'gasabo', sector: 'Kimironko',
    price: 180000000, bedrooms: 4, bathrooms: 3, sizeSqm: 300,
    features: ['Parking', 'Garden', 'Solar power', 'Gated community'],
    description: 'Well-built 4-bedroom family home on a titled plot, ready to move in.',
    phone: '0788300201',
    photos: [
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', label: 'Exterior' },
      { url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80', label: 'Living room' },
      { url: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80', label: 'Kitchen' },
      { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80', label: 'Master bedroom' },
    ],
  },
  {
    id: 'sl-2', listingType: 'sale', title: 'Apartment block, Kacyiru',
    province: 'kigali', district: 'gasabo', sector: 'Kacyiru',
    price: 220000000, bedrooms: 6, bathrooms: 6, sizeSqm: 500,
    features: ['Parking', 'CCTV', 'Generator backup'],
    description: 'A 3-unit apartment block, currently rented out, sold with existing tenants.',
    phone: '0788300202',
    photos: [
      { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80', label: 'Building exterior' },
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', label: 'Sample unit interior' },
    ],
  },
  {
    id: 'sl-3', listingType: 'sale', title: '3-bedroom bungalow, Kanombe',
    province: 'kigali', district: 'kicukiro', sector: 'Kanombe',
    price: 95000000, bedrooms: 3, bathrooms: 2, sizeSqm: 200,
    features: ['Parking', 'Fenced compound', 'Borehole water'],
    description: 'Single-storey family home close to the airport, titled land.',
    phone: '0788300203',
    photos: [
      { url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80', label: 'Bungalow front' },
      { url: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80', label: 'Living area' },
    ],
  },
  {
    id: 'sl-4', listingType: 'sale', title: 'House with shop space, Nyamirambo',
    province: 'kigali', district: 'nyarugenge', sector: 'Nyamirambo',
    price: 75000000, bedrooms: 2, bathrooms: 1, sizeSqm: 150,
    features: ['Parking'],
    description: 'Living quarters above a ground-floor shop space, good rental income potential.',
    phone: '0788300204',
    photos: [
      { url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80', label: 'Street level shop' },
      { url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80', label: 'Upstairs living' },
    ],
  },
  {
    id: 'sl-5', listingType: 'sale', title: 'House near Musanze town',
    province: 'northern', district: 'musanze', sector: 'Muhoza',
    price: 60000000, bedrooms: 3, bathrooms: 2, sizeSqm: 160,
    features: ['Garden', 'Parking'],
    description: 'Modern house with mountain views, close to the town center.',
    phone: '0788300205',
    photos: [
      { url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80', label: 'Mountain view house' },
      { url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80', label: 'Garden' },
    ],
  },
  {
    id: 'sl-6', listingType: 'sale', title: 'Family house, Huye',
    province: 'southern', district: 'huye', sector: 'Ngoma',
    price: 48000000, bedrooms: 3, bathrooms: 2, sizeSqm: 170,
    features: ['Water tank', 'Fenced compound'],
    description: 'Spacious compound, close to schools and the university.',
    phone: '0788300206',
    photos: [
      { url: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80', label: 'Exterior' },
      { url: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80', label: 'Living room' },
    ],
  },
  {
    id: 'sl-7', listingType: 'sale', title: 'House, Rwamagana town',
    province: 'eastern', district: 'rwamagana', sector: 'Kigabiro',
    price: 42000000, bedrooms: 3, bathrooms: 2, sizeSqm: 165,
    features: ['Parking', 'Solar power'],
    description: 'Well-maintained family home on the main Rwamagana road.',
    phone: '0788300207',
    photos: [
      { url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80', label: 'House exterior' },
    ],
  },
  {
    id: 'sl-8', listingType: 'sale', title: 'Lakeview house, Rubavu',
    province: 'western', district: 'rubavu', sector: 'Gisenyi',
    price: 150000000, bedrooms: 4, bathrooms: 3, sizeSqm: 280,
    features: ['Furnished', 'Garden', 'Generator backup'],
    description: 'Lake Kivu views from the upstairs balcony, titled land.',
    phone: '0788300208',
    photos: [
      { url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80', label: 'Lake view from balcony' },
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', label: 'House exterior' },
      { url: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80', label: 'Interior' },
    ],
  },
];

export default { SEED_PROPERTIES, PROPERTY_FEATURES };
