/**
 * AdsContext.js — Amatangazo agaragara mu makuru (ad units shown in the News feed).
 *
 * Talks to our own Express + Postgres backend now (server/src/routes/ads.js),
 * not in-memory state — every screen still only ever calls useAds().
 *
 * Kept separate from NewsContext on purpose — an ad isn't an article, even
 * though it renders inline in the same feed. Each ad is anchored to a real
 * article's id ("show this right after that story"), which the News admin
 * picks explicitly, rather than a raw position number that would silently
 * drift as articles get added, archived, or reordered above it.
 */
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';

const AdsContext = createContext(null);

export function AdsProvider({ children }) {
  const [ads, setAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAds = useCallback(async () => {
    try {
      const data = await apiFetch('/ads');
      setAds(data || []);
    } catch {
      // Leave whatever was already loaded rather than blanking the list
      // over a transient network hiccup.
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshAds();
      setIsLoading(false);
    })();
  }, [refreshAds]);

  const addAd = useCallback(async (data) => {
    try {
      const newAd = await apiFetch('/ads', {
        method: 'POST',
        body: { type: data.type || 'photo', mediaUri: data.mediaUri, afterArticleId: data.afterArticleId },
      });
      setAds((current) => [newAd, ...current]);
      return newAd;
    } catch {
      return null;
    }
  }, []);

  const updateAd = useCallback(async (id, patch) => {
    try {
      const updated = await apiFetch(`/ads/${id}`, { method: 'PATCH', body: patch });
      setAds((current) => current.map((a) => (a.id === id ? updated : a)));
      return updated;
    } catch {
      return null;
    }
  }, []);

  const deleteAd = useCallback(async (id) => {
    try {
      await apiFetch(`/ads/${id}`, { method: 'DELETE' });
      setAds((current) => current.filter((a) => a.id !== id));
    } catch {
      // no-op — the ad stays in the list, matching a failed delete leaving
      // state untouched rather than silently disappearing from the UI
    }
  }, []);

  const getAdById = useCallback((id) => ads.find((a) => a.id === id) || null, [ads]);

  // At most one ad per anchor article — if an admin wants a second ad, they
  // anchor it to a different article. Keeps feed placement unambiguous.
  const getAdAfter = useCallback(
    (articleId) => ads.find((a) => a.afterArticleId === articleId) || null,
    [ads]
  );

  const value = useMemo(
    () => ({ ads, isLoading, refreshAds, addAd, updateAd, deleteAd, getAdById, getAdAfter }),
    [ads, isLoading, refreshAds, addAd, updateAd, deleteAd, getAdById, getAdAfter]
  );

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds() {
  const context = useContext(AdsContext);
  if (!context) {
    throw new Error('useAds must be used inside <AdsProvider>.');
  }
  return context;
}

export default AdsContext;
