/**
 * theme/index.js — Aho ibintu byose bya theme bihurira.
 * Import from here everywhere:  import { colors, spacing } from '../theme';
 */
import { DefaultTheme } from '@react-navigation/native';

import colors from './colors';
import typography, { fontFamily, fontFamilyMedium, weight } from './typography';
import { spacing, radius, gutter, hairline, shadows, TAB_BAR_HEIGHT } from './layout';

// React Navigation needs its own theme object so screen transitions and the
// container background don't flash white.
export const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.blue500,
    background: colors.background,
    card: colors.navy800,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.breaking,
  },
};

export {
  colors,
  typography,
  fontFamily,
  fontFamilyMedium,
  weight,
  spacing,
  radius,
  gutter,
  hairline,
  shadows,
  TAB_BAR_HEIGHT,
};

export default { colors, typography, spacing, radius, gutter, shadows };
