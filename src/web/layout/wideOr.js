/**
 * wideOr.js — makes one navigator screen that shows the wide-web page on a
 * computer browser and the original phone screen everywhere else.
 */
import React from 'react';
import useIsWideWeb from '../hooks/useIsWideWeb';

export default function wideOr(Narrow, Wide) {
  function ResponsiveScreen(props) {
    return useIsWideWeb() ? <Wide {...props} /> : <Narrow {...props} />;
  }
  ResponsiveScreen.displayName = `WideOr(${Narrow.name || 'Screen'})`;
  return ResponsiveScreen;
}
