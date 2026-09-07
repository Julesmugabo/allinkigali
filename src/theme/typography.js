/**
 * typography.js — Uburyo inyandiko zandikwa muri app yose.
 * One type scale for the whole app. Components pick a role, never a raw size.
 *
 * The web mockup was drawn inside a literal 375px frame, so its sizes were very
 * small. These are nudged up a step for real handsets while keeping the same
 * relative hierarchy.
 */
import { Platform } from 'react-native';

// System stack: San Francisco on iOS, Roboto on Android.
// Swap here if you later load a custom font with expo-font.
export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const fontFamilyMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

export const weight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const typography = {
  // Brand wordmark
  wordmark: { fontSize: 21, fontWeight: weight.semibold, letterSpacing: -0.4 },
  wordmarkSub: { fontSize: 8.5, fontWeight: weight.medium, letterSpacing: 1.3 },

  // Screen + section headings
  screenTitle: { fontSize: 24, fontWeight: weight.semibold, letterSpacing: -0.4 },
  sectionTitle: { fontSize: 12, fontWeight: weight.semibold, letterSpacing: 0.6 },

  // News
  heroTitle: { fontSize: 17, fontWeight: weight.semibold, lineHeight: 24, letterSpacing: -0.2 },
  cardTitle: { fontSize: 14.5, fontWeight: weight.medium, lineHeight: 20 },
  trendTitle: { fontSize: 12.5, fontWeight: weight.medium, lineHeight: 17 },
  trendNumber: { fontSize: 24, fontWeight: weight.semibold },

  // Generic
  body: { fontSize: 14, fontWeight: weight.regular, lineHeight: 20 },
  bodyStrong: { fontSize: 14, fontWeight: weight.semibold, lineHeight: 20 },
  label: { fontSize: 11, fontWeight: weight.semibold, letterSpacing: 0.5 },
  caption: { fontSize: 11, fontWeight: weight.regular },
  meta: { fontSize: 10.5, fontWeight: weight.regular },
  tab: { fontSize: 12.5, fontWeight: weight.medium },
  tabBar: { fontSize: 10.5, fontWeight: weight.medium, letterSpacing: 0.1 },
  button: { fontSize: 15, fontWeight: weight.semibold, letterSpacing: 0.2 },
  price: { fontSize: 16, fontWeight: weight.bold, letterSpacing: -0.3 },
  input: { fontSize: 15, fontWeight: weight.regular },
};

export default typography;
