import { CLIENT_LOOK } from './clients/look';

// The original dark set, kept for reference. Since 2026-10-15 both the
// Staff Portal and the business dashboard use the light allinkigali look
// (clients/look.js): #F5F2EA page, black/grey words, lime and gold shapes.
const DARK_LOOK = {
  bg: '#0B1120',
  bgSidebar: '#0F172A',
  bgCard: '#1E293B',
  bgInput: '#1E293B',
  bgHover: '#334155',
  bgActive: 'rgba(56,189,248,0.12)',

  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  accent: '#38BDF8',
  accentHover: '#7DD3FC',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',

  border: '#1E293B',
  borderLight: 'rgba(148,163,184,0.15)',

  radius: '8px',
  radiusLg: '12px',

  shadow: '0 1px 3px rgba(0,0,0,0.3)',
  shadowLg: '0 4px 12px rgba(0,0,0,0.4)',

  font: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",

  // Words placed on or beside colour. The Staff Portal writes in its colours;
  // the client dashboard (clients/theme.js) keeps words black and grey and
  // puts the colour in fills, dots and bars instead.
  onAccent: '#0B1120', // words on an accent-filled button or chip
  inkAccent: '#38BDF8', // words marking the active tab or an info button
  inkStatus: null, // null: status words in their own colour
};

export const t = { ...DARK_LOOK, ...CLIENT_LOOK };
