/**
 * shopThemes.js — colour themes for the Resto/Coffee pages (list page,
 * place page and their pieces). Every piece reads the same named roles, so
 * a category only picks a theme: restaurants and weddings stay navy,
 * coffee shops get the warm espresso look. Provide with <ShopThemeProvider>,
 * read with useShopStyles(makeStyles).
 */
import React, { createContext, useContext, useMemo } from 'react';
import colors, { coffeeColors as cc } from './colors';

export const NAVY_THEME = {
  gradient: colors.gradient.shop,
  text: colors.white,
  textSoft: colors.textOnNavy,
  textMuted: colors.textOnNavyFaint,
  accent: colors.blue500, // selected chips, active buttons
  accentSoft: 'rgba(55,138,221,0.16)',
  accentText: colors.blue300, // icons, links, small highlights
  surface: 'rgba(255,255,255,0.06)', // cards
  surfaceAlt: 'rgba(255,255,255,0.10)', // inputs, hovered rows
  panel: 'rgba(11,46,82,0.92)', // action boxes, menus
  menu: '#0B2E52',
  border: 'rgba(133,183,235,0.18)',
  borderStrong: 'rgba(133,183,235,0.35)',
  photoWell: 'rgba(2,28,54,0.6)',
  cta: '#1A7A4A', // the main button
  ctaText: colors.white,
};

export const COFFEE_THEME = {
  gradient: cc.gradient,
  text: cc.text,
  textSoft: cc.textSoft,
  textMuted: cc.textMuted,
  accent: cc.accent,
  accentSoft: cc.accentSoft,
  accentText: cc.accentText,
  surface: cc.surface,
  surfaceAlt: cc.surfaceAlt,
  panel: cc.surface,
  menu: cc.surfaceAlt,
  border: cc.border,
  borderStrong: 'rgba(236,223,208,0.28)',
  photoWell: cc.surfaceAlt,
  cta: cc.cta,
  ctaText: cc.ctaText,
};

const ShopThemeContext = createContext(NAVY_THEME);

export function ShopThemeProvider({ theme, children }) {
  return <ShopThemeContext.Provider value={theme || NAVY_THEME}>{children}</ShopThemeContext.Provider>;
}

export const useShopTheme = () => useContext(ShopThemeContext);

// Builds a component's StyleSheet from the current theme (once per theme).
export function useShopStyles(makeStyles) {
  const theme = useShopTheme();
  return useMemo(() => makeStyles(theme), [makeStyles, theme]);
}
