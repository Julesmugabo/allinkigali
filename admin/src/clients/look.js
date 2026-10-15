/**
 * look.js — the dashboards' colours (Staff Portal and business.allinkigali.rw),
 * the same palette as the allinkigali app: a navy sidebar like the app's top
 * bar, a light page with white cards, navy words, blue for buttons and active
 * things, gold for "needs you" highlights. theme.js uses these.
 */
export const NAVY = '#042C53';
export const BLUE = '#378ADD';
export const GOLD = '#F5C518';
export const RED = '#D0342C';
export const PAGE = '#F2F4F7';
// Older names kept by a few screens: "go" colour and "needs you" colour.
export const LIME = BLUE;

export const CLIENT_LOOK = {
  bg: PAGE,
  bgSidebar: NAVY,
  bgCard: '#FFFFFF',
  bgInput: '#FFFFFF',
  bgHover: '#E6F1FB',
  bgActive: 'rgba(55,138,221,0.14)',

  text: NAVY,
  textSecondary: '#5A6B7D',
  textMuted: '#8A97A6',

  accent: BLUE,
  accentHover: '#185FA5',
  success: '#2E9E5B',
  warning: GOLD,
  danger: RED,

  border: 'rgba(4,44,83,0.08)',
  borderLight: 'rgba(4,44,83,0.14)',
  shadow: '0 1px 2px rgba(4,44,83,0.08)',
  shadowLg: '0 10px 30px rgba(4,44,83,0.16)',

  onAccent: '#FFFFFF',
  inkAccent: NAVY,
  inkStatus: NAVY,
  lime: BLUE,
  gold: GOLD,

  // The navy sidebar, like the app's top bar.
  sideText: '#E6F1FB',
  sideMuted: '#85B7EB',
  sideActiveBg: 'rgba(255,255,255,0.12)',
  sideIcon: '#85B7EB',
  sideBorder: 'rgba(133,183,235,0.18)',
};
