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

  // --- News category accents (match the web mockup) -------------------------
  category: {
    world: '#185FA5',
    africa: '#3B6D11',
    politics: '#0C447C',
    business: '#854F0B',
    sport: '#993C1D',
    science: '#533AB7',
  },

  // --- Tinted thumbnail backgrounds, keyed by category ----------------------
  categoryTint: {
    world: '#E6F1FB',
    africa: '#EAF3DE',
    politics: '#E6F1FB',
    business: '#FFF0E8',
    sport: '#FAEEDA',
    science: '#EEEDFE',
  },

  // --- Gradients (arrays feed straight into <LinearGradient colors={...} />) -
  gradient: {
    shop: [navy900, navy800, '#0A3A6B', blue600],
    header: [navy800, navy700],
    card: ['rgba(12,68,124,0.85)', 'rgba(4,44,83,0.95)'],
  },
};

export default colors;
