/**
 * layout.js — Intera, impande, n'igicucu (spacing, radii, shadows).
 * Keeps the rhythm consistent: every gap in the app is one of these values.
 */
import { Platform } from 'react-native';
import colors from './colors';

// 4pt base scale
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const radius = {
  xs: 4,
  sm: 7,
  md: 11,
  lg: 14,
  xl: 20,
  pill: 999,
};

// Horizontal padding used by every screen body.
export const gutter = 16;

// Height of the custom bottom bar (the safe-area inset is added on top).
export const TAB_BAR_HEIGHT = 62;

export const hairline = {
  width: Platform.select({ ios: 0.5, android: 0.7, default: 0.5 }),
  color: colors.border,
};

export const shadows = {
  // Soft lift for white cards on the light news feed
  card: Platform.select({
    ios: {
      shadowColor: '#0C447C',
      shadowOpacity: 0.07,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
    },
    android: { elevation: 2 },
    default: {},
  }),

  // Stronger lift for floating elements (cart bar, tab bar)
  floating: Platform.select({
    ios: {
      shadowColor: '#021C36',
      shadowOpacity: 0.22,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: -2 },
    },
    android: { elevation: 12 },
    default: {},
  }),

  // Lift for primary buttons
  button: Platform.select({
    ios: {
      shadowColor: '#185FA5',
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
    },
    android: { elevation: 5 },
    default: {},
  }),
};

export default { spacing, radius, gutter, hairline, shadows, TAB_BAR_HEIGHT };
