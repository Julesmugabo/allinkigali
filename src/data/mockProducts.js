/**
 * mockProducts.js — Ibicuruzwa (products catalogue).
 *
 * For now the shop sells one thing: gas. Searching "gaz" / "gas" reveals the
 * available cylinder options.
 *
 * ADDING YOUR PHOTOS LATER
 * ------------------------
 * 1. Drop the file in  assets/products/  (e.g. sp-gas-12kg.png)
 * 2. Change that product's `image` field from null to:
 *        image: require('../../assets/products/sp-gas-12kg.png'),
 * Nothing else needs to change — ProductCard shows an icon placeholder
 * whenever `image` is null, and the real photo as soon as it isn't.
 */
import { normalise } from '../utils/format';

// A product "family" is what the user is shopping for. Right now: gas only.
export const PRODUCT_FAMILIES = [
  {
    key: 'gas',
    label: 'Gaz',
    tagline: 'Gaz yo guteka — itangwa mu Kigali',
    icon: 'gas-cylinder',
    // Words that should surface this family from the search box. Keep both
    // Kinyarwanda and English spellings so either works.
    keywords: ['gaz', 'gas', 'gaze', 'gasi', 'guteka', 'cylinder', 'itanura'],
  },
];

export const products = [
  {
    id: 'gas-6kg-refill',
    family: 'gas',
    brand: 'SP Gaz',
    name: 'SP Gaz 6kg — Kongera gushyiramo',
    shortName: '6kg refill',
    size: '6 kg',
    type: 'refill', // refill = you already own the cylinder
    price: 12000,
    oldPrice: 13500,
    currency: 'RWF',
    inStock: true,
    deliveryNote: 'Bigera mu masaha 2',
    description: "Kongera gushyira gaz mu icupa ufite. Igiciro ni icya gaz gusa.",
    image: null,
    icon: 'gas-cylinder',
    keywords: ['gaz', 'gas', '6kg', 'sp', 'refill', 'nto'],
  },
  {
    id: 'gas-12kg-refill',
    family: 'gas',
    brand: 'SP Gaz',
    name: 'SP Gaz 12kg — Kongera gushyiramo',
    shortName: '12kg refill',
    size: '12 kg',
    type: 'refill',
    price: 21500,
    oldPrice: 23000,
    currency: 'RWF',
    inStock: true,
    deliveryNote: 'Bigera mu masaha 2',
    description: "Ingano ikoreshwa cyane mu ngo. Uzana icupa ryawe, twuzuze gaz.",
    image: null,
    icon: 'gas-cylinder',
    keywords: ['gaz', 'gas', '12kg', 'sp', 'refill', 'urugo'],
  },
  {
    id: 'gas-12kg-full',
    family: 'gas',
    brand: 'Safi Gaz',
    name: 'Safi Gaz 12kg — Icupa rishya + gaz',
    shortName: '12kg icupa rishya',
    size: '12 kg',
    type: 'full', // full = new cylinder included
    price: 46000,
    oldPrice: null,
    currency: 'RWF',
    inStock: true,
    deliveryNote: 'Bigera mu masaha 3',
    description: "Uhabwa icupa rishya ryuzuye gaz, hamwe n'umuyoboro n'agafuniko.",
    image: null,
    icon: 'gas-cylinder',
    keywords: ['gaz', 'gas', '12kg', 'safi', 'full', 'icupa', 'rishya'],
  },
  {
    id: 'gas-15kg-refill',
    family: 'gas',
    brand: 'Lake Gaz',
    name: 'Lake Gaz 15kg — Kongera gushyiramo',
    shortName: '15kg refill',
    size: '15 kg',
    type: 'refill',
    price: 26500,
    oldPrice: null,
    currency: 'RWF',
    inStock: true,
    deliveryNote: 'Bigera mu masaha 3',
    description: 'Ikwiye ingo nini cyangwa uducuruzi duto duteka buri munsi.',
    image: null,
    icon: 'gas-cylinder',
    keywords: ['gaz', 'gas', '15kg', 'lake', 'refill', 'nini'],
  },
  {
    id: 'gas-25kg-refill',
    family: 'gas',
    brand: 'SP Gaz',
    name: 'SP Gaz 25kg — Kongera gushyiramo',
    shortName: '25kg refill',
    size: '25 kg',
    type: 'refill',
    price: 43000,
    oldPrice: null,
    currency: 'RWF',
    inStock: false, // demonstrates the out-of-stock state
    deliveryNote: 'Bizaboneka bidatinze',
    description: 'Ingano ikoreshwa muri resitora n\'amahoteli.',
    image: null,
    icon: 'gas-cylinder',
    keywords: ['gaz', 'gas', '25kg', 'sp', 'resitora'],
  },
  {
    id: 'gas-regulator',
    family: 'gas',
    brand: 'Accessory',
    name: 'Umuyoboro wa gaz + Regulator',
    shortName: 'Umuyoboro',
    size: '1.5 m',
    type: 'accessory',
    price: 8500,
    oldPrice: null,
    currency: 'RWF',
    inStock: true,
    deliveryNote: 'Bigera mu masaha 2',
    description: "Umuyoboro ufite ubuziranenge n'agapima gaz.",
    image: null,
    icon: 'pipe-valve',
    keywords: ['gaz', 'gas', 'regulator', 'umuyoboro', 'tube', 'accessory'],
  },
];

/**
 * Search the catalogue. Empty query returns an empty list on purpose — the
 * shop screen shows suggestion chips instead of dumping the catalogue.
 */
export function searchProducts(query = '') {
  const q = normalise(query);
  if (!q) return [];

  return products.filter((p) => {
    const haystack = [p.name, p.brand, p.size, p.shortName, ...(p.keywords || [])]
      .map(normalise)
      .join(' ');
    return haystack.includes(q);
  });
}

/**
 * Which families match a query — used to show "Gaz" as a heading above results.
 */
export function matchFamilies(query = '') {
  const q = normalise(query);
  if (!q) return [];
  return PRODUCT_FAMILIES.filter((f) =>
    [f.label, ...(f.keywords || [])].map(normalise).some((k) => k.includes(q) || q.includes(k))
  );
}

export function getProductById(id) {
  return products.find((p) => p.id === id) || null;
}

// Chips shown before the user types anything.
export const SEARCH_SUGGESTIONS = ['Gaz', 'Gaz 12kg', 'Gaz 6kg', 'Umuyoboro'];

export default { products, searchProducts, getProductById, PRODUCT_FAMILIES };
