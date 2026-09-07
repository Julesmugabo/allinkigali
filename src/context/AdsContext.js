/**
 * AdsContext.js — Amatangazo agaragara mu makuru (ad units shown in the News feed).
 *
 * Kept separate from NewsContext on purpose — an ad isn't an article, even
 * though it renders inline in the same feed. Each ad is anchored to a real
 * article's id ("show this right after that story"), which the News admin
 * picks explicitly, rather than a raw position number that would silently
 * drift as articles get added, archived, or reordered above it.
 */
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

const AdsContext = createContext(null);

export function AdsProvider({ children }) {
  const [ads, setAds] = useState([]);

  const addAd = useCallback((data) => {
    const newAd = {
      id: `ad-${Date.now()}`,
      type: 'photo', // 'photo' | 'video'
      mediaUri: null,
      afterArticleId: null,
      createdAt: new Date().toISOString(),
      ...data,
    };
    setAds((current) => [newAd, ...current]);
    return newAd;
  }, []);

  const updateAd = useCallback((id, patch) => {
    setAds((current) => current.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const deleteAd = useCallback((id) => {
    setAds((current) => current.filter((a) => a.id !== id));
  }, []);

  const getAdById = useCallback((id) => ads.find((a) => a.id === id) || null, [ads]);

  // At most one ad per anchor article — if an admin wants a second ad, they
  // anchor it to a different article. Keeps feed placement unambiguous.
  const getAdAfter = useCallback(
    (articleId) => ads.find((a) => a.afterArticleId === articleId) || null,
    [ads]
  );

  const value = useMemo(
    () => ({ ads, addAd, updateAd, deleteAd, getAdById, getAdAfter }),
    [ads, addAd, updateAd, deleteAd, getAdById, getAdAfter]
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
