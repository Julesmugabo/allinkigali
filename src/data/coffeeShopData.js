/**
 * coffeeShopData.js — Static seed data for coffee shops.
 *
 * INTENT_ATTRIBUTES: maps "what are you looking for?" intent → required attributes.
 * COFFEE_SHOPS: 11 real Kigali coffee shops.
 */

// ── Intent → attribute mapping ────────────────────────────────────────────────
// Used to filter coffee shops by purpose (work, study, date, etc.)

export const INTENT_ATTRIBUTES = {
  work:    ['wifi', 'poweroutlets', 'laptopfriendly', 'workarea', 'longsay'],
  study:   ['wifi', 'poweroutlets', 'studyarea', 'quiet'],
  date:    ['romantic', 'cozy', 'outdoor', 'scenicview'],
  friends: ['groupseating', 'spacious', 'lively', 'outdoor'],
  quiet:   ['quiet', 'relaxed', 'studyfriendly'],
  outdoor: ['outdoor', 'terrace', 'garden', 'rooftop'],
  dog:     ['petfriendly', 'outdoor'],
};

export const INTENTS = [
  { key: 'work',    label: 'Work remotely', emoji: '💻' },
  { key: 'study',   label: 'Study',          emoji: '📚' },
  { key: 'date',    label: 'Date',            emoji: '❤️' },
  { key: 'friends', label: 'Meet friends',    emoji: '👥' },
  { key: 'quiet',   label: 'Quiet place',     emoji: '🤫' },
  { key: 'outdoor', label: 'Outdoor seating', emoji: '🌳' },
  { key: 'dog',     label: 'Dog friendly',    emoji: '🐕' },
];

// ── Filter options ─────────────────────────────────────────────────────────────

export const COFFEE_TYPES = [
  'Espresso','Americano','Cappuccino','Latte','Flat White','Macchiato','Mocha',
  'Cortado','Cold Brew','Iced Coffee','Iced Latte','Frappé',
];

export const BREWING_METHODS = [
  'Espresso','Pour Over','V60','French Press','Aeropress','Chemex','Drip Coffee','Turkish Coffee',
];

export const COFFEE_ORIGINS = [
  'Rwandan','Ethiopian','Kenyan','East African','African','International',
  'Single Origin','Specialty Coffee','Locally Roasted','Coffee Blend',
];

export const FOOD_CATEGORIES = ['Bakery','Breakfast','Light Meals','Desserts'];

export const ATMOSPHERES_CS = ['Quiet','Cozy','Relaxed','Casual','Modern','Elegant','Luxury','Trendy','Artistic','Rustic','Lively','Romantic','Spacious','Minimalist'];
export const FACILITIES_CS  = ['wifi','poweroutlets','laptopfriendly','workarea','studyarea','meetingspace','parking','aircon','charging','wheelchair'];
export const FACILITY_LABELS= { wifi:'Free Wi-Fi', poweroutlets:'Power outlets', laptopfriendly:'Laptop friendly', workarea:'Work area', studyarea:'Study area', meetingspace:'Meeting space', parking:'Parking', aircon:'Air conditioning', charging:'Charging facilities', wheelchair:'Wheelchair accessible' };
export const SEATINGS_CS    = ['indoor','outdoor','terrace','garden','rooftop','sofa','bar','hightable','private','group'];
export const SEATING_LABELS_CS = { indoor:'Indoor', outdoor:'Outdoor', terrace:'Terrace', garden:'Garden', rooftop:'Rooftop', sofa:'Sofa/Lounge', bar:'Bar seating', hightable:'High table', private:'Private space', group:'Group seating' };

export const SERVICES_CS = ['dinein','takeaway','delivery','orderahead'];
export const SERVICE_LABELS_CS = { dinein:'Dine-in', takeaway:'Takeaway', delivery:'Delivery', orderahead:'Order ahead' };

export const OPENING_CS = ['opennow','openearly','openlate','open24'];
export const OPENING_LABELS_CS = { opennow:'Open now', openearly:'Open early', openlate:'Open late', open24:'Open 24 hours' };

// ── Seed coffee shops ─────────────────────────────────────────────────────────

export const COFFEE_SHOPS = [
  {
    id: 'cs1',
    name: 'Question Coffee Gishushu',
    coffeeTypes: ['Espresso','Americano','Cappuccino','Latte','Cold Brew','Specialty Coffee'],
    brewingMethods: ['Espresso','Pour Over','V60'],
    origins: ['Rwandan','Single Origin','Specialty Coffee'],
    food: ['Bakery','Light Meals'],
    atmosphere: ['Cozy','Modern','Casual'],
    facilities: ['wifi','poweroutlets','laptopfriendly','workarea'],
    seating: ['indoor','outdoor'],
    attributes: ['wifi','poweroutlets','laptopfriendly','workarea','quiet','cozy'],
    services: ['dinein','takeaway'],
    price: 2,
    rating: 4.7,
    location: 'Gishushu, KG 8 Ave, Kigali',
    district: 'Gasabo',
    phone: '+250 781 968 027',
    openStatus: 'Open now',
    description: 'Rwanda\'s pioneer specialty coffee shop. Every cup tells the story of the farmer behind it.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80', label: 'Coffee bar' },
      { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80', label: 'Interior' },
    ],
    lat: -1.941, lng: 30.092,
  },
  {
    id: 'cs2',
    name: 'Question Coffee Kiyovu',
    coffeeTypes: ['Espresso','Cappuccino','Latte','Cold Brew','Pour Over'],
    brewingMethods: ['Espresso','Pour Over','V60','Aeropress'],
    origins: ['Rwandan','Single Origin','Specialty Coffee'],
    food: ['Bakery','Light Meals'],
    atmosphere: ['Cozy','Casual','Relaxed'],
    facilities: ['wifi','poweroutlets','laptopfriendly'],
    seating: ['indoor','outdoor'],
    attributes: ['wifi','poweroutlets','laptopfriendly','quiet','cozy','outdoor'],
    services: ['dinein','takeaway'],
    price: 2,
    rating: 4.6,
    location: 'Kiyovu, KN 41 St, Kigali',
    district: 'Nyarugenge',
    phone: '+250 791 212 910',
    openStatus: 'Open now',
    description: 'The Kiyovu branch of Question Coffee. Neighbourhood gem with outstanding single-origin brews.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80', label: 'Coffee cups' },
      { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80', label: 'Café space' },
    ],
    lat: -1.957, lng: 30.058,
  },
  {
    id: 'cs3',
    name: 'Inzora Rooftop Café',
    coffeeTypes: ['Espresso','Cappuccino','Latte','Iced Coffee'],
    brewingMethods: ['Espresso','French Press'],
    origins: ['Rwandan','East African'],
    food: ['Bakery','Light Meals','Desserts'],
    atmosphere: ['Relaxed','Romantic','Trendy','Spacious'],
    facilities: ['wifi','outdoor','scenicview'],
    seating: ['outdoor','rooftop','indoor'],
    attributes: ['outdoor','rooftop','scenicview','romantic','cozy','wifi'],
    services: ['dinein','takeaway'],
    price: 2,
    rating: 4.8,
    location: 'Kacyiru, Ikirezi Bookstore, Kigali',
    district: 'Gasabo',
    phone: '+250 789 539 764',
    openStatus: 'Open now',
    description: 'Kigali\'s most famous rooftop café. Breathtaking views of the city hills paired with excellent coffee.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80', label: 'Rooftop view' },
      { url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80', label: 'Coffee' },
    ],
    lat: -1.933, lng: 30.079,
  },
  {
    id: 'cs4',
    name: 'Ikawa Café',
    coffeeTypes: ['Espresso','Americano','Flat White','Pour Over','Cold Brew'],
    brewingMethods: ['Espresso','Pour Over','V60','Chemex'],
    origins: ['Rwandan','Ethiopian','Kenyan','Single Origin'],
    food: ['Bakery','Breakfast','Light Meals'],
    atmosphere: ['Modern','Quiet','Minimalist','Cozy'],
    facilities: ['wifi','poweroutlets','laptopfriendly','workarea','studyarea'],
    seating: ['indoor','outdoor'],
    attributes: ['wifi','poweroutlets','laptopfriendly','workarea','studyarea','quiet'],
    services: ['dinein','takeaway','orderahead'],
    price: 2,
    rating: 4.6,
    location: 'KN 41 St, Kigali',
    district: 'Nyarugenge',
    phone: '+250 799 301 607',
    openStatus: 'Open now',
    description: 'Specialty coffee shop focused on East African origin coffees. Perfect for remote work and quiet study.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80', label: 'Pour over' },
      { url: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&q=80', label: 'Workspace' },
    ],
    lat: -1.960, lng: 30.063,
  },
  {
    id: 'cs5',
    name: 'ONECUP',
    coffeeTypes: ['Espresso','Cappuccino','Latte','Cold Brew','Specialty Coffee'],
    brewingMethods: ['Espresso','Pour Over','Aeropress','French Press'],
    origins: ['Rwandan','Single Origin','Locally Roasted'],
    food: ['Bakery','Light Meals'],
    atmosphere: ['Modern','Trendy','Casual'],
    facilities: ['wifi','poweroutlets','laptopfriendly'],
    seating: ['indoor','outdoor'],
    attributes: ['wifi','poweroutlets','laptopfriendly','modern','quiet'],
    services: ['dinein','takeaway'],
    price: 2,
    rating: 4.5,
    location: 'Gishushu, Kigali',
    district: 'Gasabo',
    phone: '+250 788 354 403',
    openStatus: 'Open now',
    description: 'A modern specialty café celebrating Rwanda\'s incredible coffee heritage — one cup at a time.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=800&q=80', label: 'Specialty coffee' },
      { url: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80', label: 'Café interior' },
    ],
    lat: -1.943, lng: 30.091,
  },
  {
    id: 'cs6',
    name: 'Feels Coffee',
    coffeeTypes: ['Espresso','Latte','Cappuccino','Iced Latte','Cold Brew','Mocha'],
    brewingMethods: ['Espresso','Drip Coffee'],
    origins: ['Rwandan','African','International'],
    food: ['Bakery','Breakfast','Desserts'],
    atmosphere: ['Cozy','Casual','Relaxed','Romantic'],
    facilities: ['wifi'],
    seating: ['indoor','outdoor','sofa'],
    attributes: ['wifi','cozy','romantic','outdoor','relaxed'],
    services: ['dinein','takeaway'],
    price: 1,
    rating: 4.4,
    location: 'KG 628 St, Kigali',
    district: 'Gasabo',
    phone: '+250 791 938 496',
    openStatus: 'Open now',
    description: 'A feel-good neighbourhood café known for its cozy atmosphere and value-for-money specialty drinks.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80', label: 'Latte art' },
      { url: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80', label: 'Cozy seating' },
    ],
    lat: -1.946, lng: 30.085,
  },
  {
    id: 'cs7',
    name: 'Rubia Coffee Roasters',
    coffeeTypes: ['Espresso','Americano','Flat White','Pour Over','Cold Brew','Filter Coffee'],
    brewingMethods: ['Espresso','Pour Over','V60','Aeropress','Chemex','French Press'],
    origins: ['Rwandan','Ethiopian','Kenyan','Single Origin','Locally Roasted','Specialty Coffee'],
    food: ['Bakery','Light Meals'],
    atmosphere: ['Modern','Minimal','Quiet','Artistic'],
    facilities: ['wifi','poweroutlets','laptopfriendly','workarea'],
    seating: ['indoor','outdoor'],
    attributes: ['wifi','poweroutlets','laptopfriendly','workarea','quiet','studyarea'],
    services: ['dinein','takeaway'],
    price: 2,
    rating: 4.8,
    location: 'KG 2 Ave, Kigali',
    district: 'Gasabo',
    phone: '+250 787 930 040',
    openStatus: 'Open now',
    description: 'Kigali\'s leading coffee roastery and café. They source, roast, and brew in-house. Serious coffee for serious lovers.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1497935586047-9395ee065e52?w=800&q=80', label: 'Roastery' },
      { url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80', label: 'Pour over station' },
    ],
    lat: -1.951, lng: 30.094,
  },
  {
    id: 'cs8',
    name: 'Kivu Noir',
    coffeeTypes: ['Espresso','Cappuccino','Latte','Cold Brew','Specialty Coffee','Iced Latte'],
    brewingMethods: ['Espresso','Pour Over','French Press'],
    origins: ['Rwandan','Single Origin','Specialty Coffee','Locally Roasted'],
    food: ['Bakery','Desserts','Light Meals'],
    atmosphere: ['Cozy','Elegant','Romantic','Modern'],
    facilities: ['wifi','poweroutlets','laptopfriendly'],
    seating: ['indoor','outdoor','sofa'],
    attributes: ['wifi','poweroutlets','cozy','romantic','outdoor','laptopfriendly'],
    services: ['dinein','takeaway'],
    price: 2,
    rating: 4.6,
    location: 'KG 668 St, Kigali',
    district: 'Gasabo',
    phone: '+250 791 501 679',
    openStatus: 'Open now',
    description: 'Named after Lake Kivu, this café brings the essence of Rwanda\'s western province to every cup.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?w=800&q=80', label: 'Coffee and cake' },
      { url: 'https://images.unsplash.com/photo-1593313637552-29c2c0dacd35?w=800&q=80', label: 'Café interior' },
    ],
    lat: -1.947, lng: 30.082,
  },
  {
    id: 'cs9',
    name: 'Shamba Speciality Coffee',
    coffeeTypes: ['Espresso','Pour Over','V60','Cold Brew','Flat White','Specialty Coffee'],
    brewingMethods: ['Espresso','Pour Over','V60','Aeropress','Chemex'],
    origins: ['Rwandan','Ethiopian','Kenyan','Single Origin','Specialty Coffee'],
    food: ['Bakery','Light Meals'],
    atmosphere: ['Quiet','Relaxed','Rustic','Artistic'],
    facilities: ['wifi','poweroutlets','laptopfriendly','studyarea'],
    seating: ['indoor','outdoor','garden'],
    attributes: ['wifi','poweroutlets','laptopfriendly','studyarea','quiet','outdoor','garden'],
    services: ['dinein','takeaway'],
    price: 2,
    rating: 4.7,
    location: 'KG 624 St, Kigali',
    district: 'Gasabo',
    phone: '+250 781 682 518',
    openStatus: 'Open now',
    description: 'A garden café and specialty coffee roaster. The relaxed outdoor setting makes it ideal for work, study, or a quiet afternoon.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&q=80', label: 'Garden seating' },
      { url: 'https://images.unsplash.com/photo-1516743619420-154b70a65fea?w=800&q=80', label: 'Specialty brew' },
    ],
    lat: -1.945, lng: 30.088,
  },
  {
    id: 'cs10',
    name: 'Golden Coffee Roastery',
    coffeeTypes: ['Espresso','Americano','Cappuccino','Latte','Pour Over','Cold Brew'],
    brewingMethods: ['Espresso','Pour Over','Drip Coffee','French Press'],
    origins: ['Rwandan','East African','Single Origin','Locally Roasted'],
    food: ['Bakery','Breakfast','Light Meals'],
    atmosphere: ['Casual','Modern','Spacious'],
    facilities: ['wifi','poweroutlets','workarea','parking'],
    seating: ['indoor','outdoor'],
    attributes: ['wifi','poweroutlets','workarea','spacious','outdoor','parking'],
    services: ['dinein','takeaway','delivery'],
    price: 2,
    rating: 4.4,
    location: 'KG 9 Ave, Kigali',
    district: 'Gasabo',
    phone: '+250 793 761 101',
    openStatus: 'Open now',
    description: 'A spacious roastery café offering freshly roasted Rwandan coffee and a full breakfast menu.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80', label: 'Roastery counter' },
      { url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&q=80', label: 'Breakfast spread' },
    ],
    lat: -1.939, lng: 30.105,
  },
  {
    id: 'cs11',
    name: 'Théla Bakery & Café',
    coffeeTypes: ['Espresso','Cappuccino','Latte','Mocha','Iced Coffee','Hot Chocolate'],
    brewingMethods: ['Espresso','Drip Coffee'],
    origins: ['Rwandan','International'],
    food: ['Bakery','Breakfast','Desserts'],
    atmosphere: ['Cozy','Charming','Relaxed','Rustic'],
    facilities: ['wifi'],
    seating: ['indoor','outdoor','sofa'],
    attributes: ['wifi','cozy','outdoor','relaxed','romantic','petfriendly'],
    services: ['dinein','takeaway'],
    price: 1,
    rating: 4.5,
    location: 'KN 16 Ave, Kigali',
    district: 'Nyarugenge',
    phone: '+250 794 001 210',
    openStatus: 'Open now',
    description: 'A charming bakery and café with freshly baked pastries, artisan cakes, and excellent coffee.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', label: 'Bakery display' },
      { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80', label: 'Café interior' },
    ],
    lat: -1.964, lng: 30.059,
  },
];
