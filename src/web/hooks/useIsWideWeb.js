/**
 * useIsWideWeb.js — the one place that decides "is this the wide web layout".
 * True only on web, past the breakpoint. Native builds never see true here.
 */
import { Platform, useWindowDimensions } from 'react-native';

export const WEB_BREAKPOINT = 768;

export default function useIsWideWeb() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= WEB_BREAKPOINT;
}
