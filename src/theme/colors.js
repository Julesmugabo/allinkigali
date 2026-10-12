/**
 * colors.js — Isoko rimwe ry'amabara ya app yose.
 * Single source of truth for every colour in the app.
 * Never hard-code a hex value inside a component; add it here instead.
 */

// --- Core blue ramp (darkest to lightest) ------------------------------------
const navy900 = '#021C36'; // deepest — status bar, gradient tail
const navy800 = '#042C53'; // brand navy — header, hero cards, tab bar
const navy700 = '#0C447C'; // raised navy — image wells, gradient middle
const blue600 = '#185FA5'; // mid blue — small text on light backgrounds
const blue500 = '#378ADD'; // action blue — active indicators, icons, buttons
const blue300 = '#85B7EB'; // light blue — text on navy
const blue200 = '#B5D4F4'; // hairline borders
const blue100 = '#E6F1FB'; // tinted surfaces, thumbnails

// --- Restaurant palette ------------------------------------------------------
export const restaurantColors = {
  bg:         '#000000',
  primary:    '#FFFFFF',
  accent:     '#D9684B', // terracotta — category tags, buttons, highlights
  accentSoft: 'rgba(217,104,75,0.15)',
  surface:    '#000000', // cards blend into background
  surfaceAlt: '#1C1C1E', // search bars, input fields
  text:       '#FFFFFF',
  textMuted:  '#8E8E93',
  border:     'rgba(255,255,255,0.08)',
  gradient:   ['#000000', '#0A0A0A', '#111111'],
};

// --- Food menu palette -------------------------------------------------------
export const menuColors = {
  bg:          '#000000',
  primary:     '#FFFFFF',
  accent:      '#D9684B', // terracotta — order buttons, highlights
  accentSoft:  'rgba(217,104,75,0.15)',
  sage:        '#879B76', // sage green — veg/vegan/healthy tags
  sageSoft:    'rgba(135,155,118,0.15)',
  espresso:    '#A0785C', // lightened espresso for dark bg
  espressoSoft:'rgba(160,120,92,0.15)',
  surface:     '#000000', // cards blend into background
  surfaceAlt:  '#1C1C1E', // search bars, input fields
  text:        '#FFFFFF',
  textMuted:   '#8E8E93',
  border:      'rgba(255,255,255,0.08)',
  gradient:    ['#000000', '#0A0A0A', '#111111'],
};

// --- Wedding / places-exploring palette --------------------------------------
export const weddingColors = {
  bg:          '#F5E9D7', // sand beige background
  primary:     '#0B2D42', // adventure blue — nav, headings
  accent:      '#00A884', // Kigali green — buttons, active tabs, location pins
  accentSoft:  '#E0F5F0', // tinted green surface
  highlight:   '#FF6B3D', // sunset orange — featured, badges, CTAs
  gold:        '#F4B000', // sunrise gold — star ratings, favorites
  skyBlue:     '#4DA8DA', // sky blue — map elements, info tags
  surface:     '#FFFFFF',
  text:        '#0B2D42',
  textMuted:   '#5A7A6E',
  gradient:    ['#061929', '#0B2D42', '#0D3D55'],
};

// --- Coffee shop palette -----------------------------------------------------
export const coffeeColors = {
  bg:         '#F5E9D7', // creamy beige background
  primary:    '#6F4E37', // espresso brown — headings, nav
  accent:     '#879B76', // sage green — buttons, active, category chips
  accentSoft: '#EBF0E4', // tinted sage surface
  surface:    '#23150F', // dark espresso card background
  text:       '#BDE8F8', // light blue — text on black cards
  textMuted:  'rgba(189,232,248,0.6)', // faded light blue
  gradient:   ['#3D2B1F', '#6F4E37', '#8B6347'],
};

export const colors = {
  navy900,
  navy800,
  navy700,
  blue600,
  blue500,
  blue300,
  blue200,
  blue100,

  // --- Surfaces -------------------------------------------------------------
  background: '#F2F4F7',
  surface: '#FFFFFF',
  surfaceTinted: blue100,
  border: blue200,
  borderOnNavy: 'rgba(133,183,235,0.25)',
  overlayOnNavy: 'rgba(255,255,255,0.08)',
  overlayOnNavyStrong: 'rgba(255,255,255,0.14)',

  // --- Text -----------------------------------------------------------------
  textPrimary: navy800,
  textSecondary: '#5A6B7D',
  textMuted: '#8A97A6',
  textOnNavy: '#E6F1FB',
  textOnNavySoft: blue300,
  textOnNavyFaint: 'rgba(133,183,235,0.55)',

  // --- Status / accents -----------------------------------------------------
  breaking: '#E24B4A',
  success: '#2E9E5B',
  warning: '#BA7517',
  danger: '#D0342C',
  white: '#FFFFFF',
  black: '#000000',

  // --- News category accents ------------------------------------------------
  category: {
    world: '#185FA5',
    africa: '#3B6D11',
    politics: '#0C447C',
    business: '#854F0B',
    sport: '#993C1D',
    science: '#533AB7',
  },

  // --- Tinted thumbnail backgrounds, keyed by category ---------------------
  categoryTint: {
    world: '#E6F1FB',
    africa: '#EAF3DE',
    politics: '#E6F1FB',
    business: '#FFF0E8',
    sport: '#FAEEDA',
    science: '#EEEDFE',
  },

  // --- Gradients ------------------------------------------------------------
  gradient: {
    shop: [navy900, navy800, '#0A3A6B', blue600],
    header: [navy800, navy700],
    card: ['rgba(12,68,124,0.85)', 'rgba(4,44,83,0.95)'],
  },
};

export default colors;
