/**
 * landListings.js — Fake Ibibanza (land plot) listings, in the style of
 * LandWatch: straight to the plots, no marketing/intro pages. Spread across
 * real provinces/districts so the location filter has something to filter.
 */
const TYPES = {
  residential: { label: 'Residential', icon: 'home-city-outline' },
  commercial: { label: 'Commercial', icon: 'store-outline' },
  agricultural: { label: 'Agricultural', icon: 'sprout-outline' },
};

export const LAND_TYPES = TYPES;

export const LAND_LISTINGS = [
  { id: 'lp-1', title: 'Plot near Kimironko Market', province: 'kigali', district: 'gasabo', sector: 'Kimironko', sizeSqm: 500, price: 45000000, type: 'residential', titled: true, description: 'Flat plot a short walk from Kimironko market, water and electricity on site, quiet neighbourhood.', phone: '0788200101' },
  { id: 'lp-2', title: 'Commercial plot, Remera main road', province: 'kigali', district: 'gasabo', sector: 'Remera', sizeSqm: 800, price: 120000000, type: 'commercial', titled: true, description: 'Frontage on the main road, suited for a shop or office block, high foot traffic.', phone: '0788200102' },
  { id: 'lp-3', title: 'Plot in Niboye, close to KCC', province: 'kigali', district: 'kicukiro', sector: 'Niboye', sizeSqm: 450, price: 38000000, type: 'residential', titled: true, description: 'Gently sloped residential plot, easy road access, 10 minutes from Kicukiro center.', phone: '0788200103' },
  { id: 'lp-4', title: 'Plot overlooking Nyamirambo', province: 'kigali', district: 'nyarugenge', sector: 'Nyamirambo', sizeSqm: 350, price: 28000000, type: 'residential', titled: false, description: 'Good view, seller has the sale agreement; land title transfer to be completed by the buyer.', phone: '0788200104' },
  { id: 'lp-5', title: 'Agricultural land, Jali hills', province: 'kigali', district: 'gasabo', sector: 'Jali', sizeSqm: 5000, price: 15000000, type: 'agricultural', titled: true, description: 'Fertile hillside land, currently planted with beans and maize, year-round water access nearby.', phone: '0788200105' },
  { id: 'lp-6', title: 'Plot near Musanze town', province: 'northern', district: 'musanze', sector: 'Muhoza', sizeSqm: 600, price: 25000000, type: 'residential', titled: true, description: 'Volcanoes-area plot, cool climate, 5 minutes from Musanze town center.', phone: '0788200106' },
  { id: 'lp-7', title: 'Commercial plot, Byumba town', province: 'northern', district: 'gicumbi', sector: 'Byumba', sizeSqm: 700, price: 32000000, type: 'commercial', titled: true, description: 'On the main taxi-park road, ideal for a shop, pharmacy or small supermarket.', phone: '0788200107' },
  { id: 'lp-8', title: 'Farmland near Burera lake', province: 'northern', district: 'burera', sector: 'Butaro', sizeSqm: 10000, price: 18000000, type: 'agricultural', titled: true, description: 'Lakeside farmland, Irish potatoes grow well here, road access for a truck.', phone: '0788200108' },
  { id: 'lp-9', title: 'Plot in Huye, near campus', province: 'southern', district: 'huye', sector: 'Ngoma', sizeSqm: 400, price: 22000000, type: 'residential', titled: true, description: 'Walking distance to the university, popular with staff and student housing.', phone: '0788200109' },
  { id: 'lp-10', title: 'Plot in Nyanza, near the old palace', province: 'southern', district: 'nyanza', sector: 'Busasamana', sizeSqm: 550, price: 19000000, type: 'residential', titled: true, description: 'Quiet residential area close to the King\'s Palace Museum.', phone: '0788200110' },
  { id: 'lp-11', title: 'Agricultural land, Muhanga', province: 'southern', district: 'muhanga', sector: 'Nyamabuye', sizeSqm: 8000, price: 14000000, type: 'agricultural', titled: false, description: 'Good soil for coffee, seller is the original owner, paperwork in progress.', phone: '0788200111' },
  { id: 'lp-12', title: 'Commercial plot, Gisagara road', province: 'southern', district: 'gisagara', sector: 'Save', sizeSqm: 650, price: 16000000, type: 'commercial', titled: true, description: 'On the tarmac road toward Save, suited for a fuel station or shop.', phone: '0788200112' },
  { id: 'lp-13', title: 'Plot near Rwamagana town', province: 'eastern', district: 'rwamagana', sector: 'Kigabiro', sizeSqm: 500, price: 20000000, type: 'residential', titled: true, description: 'Flat land, close to the main Kigali-Rwamagana road.', phone: '0788200113' },
  { id: 'lp-14', title: 'Farmland, Nyagatare plains', province: 'eastern', district: 'nyagatare', sector: 'Nyagatare', sizeSqm: 20000, price: 25000000, type: 'agricultural', titled: true, description: 'Large flat plot suited for cattle ranching or large-scale farming.', phone: '0788200114' },
  { id: 'lp-15', title: 'Plot in Kayonza, near Akagera gate', province: 'eastern', district: 'kayonza', sector: 'Mukarange', sizeSqm: 450, price: 12000000, type: 'residential', titled: true, description: 'Close to the Akagera National Park entrance, potential for a guesthouse.', phone: '0788200115' },
  { id: 'lp-16', title: 'Commercial plot, Nyamata center', province: 'eastern', district: 'bugesera', sector: 'Nyamata', sizeSqm: 600, price: 30000000, type: 'commercial', titled: true, description: 'Close to Nyamata bus park, strong foot traffic throughout the day.', phone: '0788200116' },
  { id: 'lp-17', title: 'Lakeside plot, Rubavu', province: 'western', district: 'rubavu', sector: 'Gisenyi', sizeSqm: 700, price: 60000000, type: 'residential', titled: true, description: 'Walking distance to Lake Kivu, popular with weekend/holiday home buyers.', phone: '0788200117' },
  { id: 'lp-18', title: 'Commercial plot, Rusizi border area', province: 'western', district: 'rusizi', sector: 'Kamembe', sizeSqm: 500, price: 27000000, type: 'commercial', titled: true, description: 'Near the DR Congo border crossing, high cross-border trade traffic.', phone: '0788200118' },
  { id: 'lp-19', title: 'Tea-growing land, Nyamasheke', province: 'western', district: 'nyamasheke', sector: 'Kagano', sizeSqm: 15000, price: 21000000, type: 'agricultural', titled: true, description: 'Established tea plants on part of the plot, remainder open for planting.', phone: '0788200119' },
  { id: 'lp-20', title: 'Plot overlooking Lake Kivu, Karongi', province: 'western', district: 'karongi', sector: 'Rubengera', sizeSqm: 600, price: 35000000, type: 'residential', titled: false, description: 'Beautiful lake view, seller has the sale agreement; buyer completes the title transfer.', phone: '0788200120' },
];

export default { LAND_LISTINGS, LAND_TYPES };
