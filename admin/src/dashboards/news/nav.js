/**
 * nav.js — news sub-items for the portal sidebar (one per section). Related
 * sections are grouped under one item: Ads › App ads / Web ads / Advertisers.
 */
import { SECTIONS } from './constants';

const link = (s) => ({ to: s.key === 'newsroom' ? '/news' : `/news/${s.key}`, label: s.label });
const AD_KEYS = ['app-ads', 'web-ads', 'advertisers'];

export const newsNav = SECTIONS.flatMap((s) => {
  if (s.key === AD_KEYS[0]) return [{ label: 'Ads', children: SECTIONS.filter((x) => AD_KEYS.includes(x.key)).map(link) }];
  return AD_KEYS.includes(s.key) ? [] : [link(s)];
});
