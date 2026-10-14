/**
 * AdsContext.js — Amatangazo (the ads readers see).
 *
 * Loads the ads that are running now (switched on, inside their dates) for
 * both channels: `appAds` for the app/phone feed and `webAds` for the
 * website. Managing ads happens in the News dashboard of the Staff Portal.
 *
 * recordView() counts an ad once per app session however often it scrolls
 * past; openAd() counts the click and opens the advertiser's link.
 */
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { Linking } from 'react-native';
import { apiFetch } from '../services/apiClient';

const AdsContext = createContext(null);
const seen = new Set(); // ad ids already counted this session

export function AdsProvider({ children }) {
  const [ads, setAds] = useState([]);

  const refreshAds = useCallback(async () => {
    try {
      const data = await apiFetch('/ads');
      setAds(Array.isArray(data) ? data : []);
    } catch {
      // Keep what's loaded rather than blanking ads over a network hiccup.
    }
  }, []);
  useEffect(() => { refreshAds(); }, [refreshAds]);

  const recordView = useCallback((ad) => {
    if (!ad?.id || seen.has(ad.id)) return;
    seen.add(ad.id);
    apiFetch(`/ads/${ad.id}/view`, { method: 'POST' }).catch(() => {});
  }, []);

  const openAd = useCallback((ad) => {
    if (!ad?.linkUrl) return;
    apiFetch(`/ads/${ad.id}/click`, { method: 'POST' }).catch(() => {});
    const url = /^https?:\/\//i.test(ad.linkUrl) ? ad.linkUrl : `https://${ad.linkUrl}`;
    Linking.openURL(url).catch(() => {});
  }, []);

  const value = useMemo(() => ({
    appAds: ads.filter((a) => a.channel === 'app'),
    webAds: ads.filter((a) => a.channel === 'web'),
    refreshAds, recordView, openAd,
  }), [ads, refreshAds, recordView, openAd]);

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds() {
  const ctx = useContext(AdsContext);
  if (!ctx) throw new Error('useAds must be used inside an AdsProvider');
  return ctx;
}

// Picks the n-th ad of a list, wrapping around, so slots take turns.
export const nthAd = (list, n) => (list.length ? list[((n % list.length) + list.length) % list.length] : null);

export default AdsContext;
