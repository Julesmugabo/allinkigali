/**
 * NewsContext.jsx — data every news section shares (articles, categories,
 * stories, authors, ads), loaded once and refreshed after any change via
 * `changed()`, plus the confirmation toast.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { newsApi } from './newsApi';

const Ctx = createContext(null);

export function NewsProvider({ children }) {
  const [data, setData] = useState({ articles: [], categories: [], stories: [], authors: [], ads: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const changed = useCallback(() => setVersion((v) => v + 1), []);

  const [toast, setToast] = useState(null);
  const notify = useCallback((text) => {
    const id = Date.now();
    setToast({ text, id });
    setTimeout(() => setToast((cur) => (cur?.id === id ? null : cur)), 3000);
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      const safe = (p) => p.catch(() => []);
      try {
        const [articles, categories, stories, authors, ads] = await Promise.all([
          newsApi.articles(), safe(newsApi.categories()), safe(newsApi.stories()),
          safe(newsApi.authors()), safe(newsApi.ads()),
        ]);
        if (live) { setData({ articles, categories, stories, authors, ads }); setError(''); }
      } catch (e) { if (live) setError(e.message); }
      if (live) setLoading(false);
    })();
    return () => { live = false; };
  }, [version]);

  const categoryLabel = useCallback(
    (key) => data.categories.find((c) => c.key === key)?.label || key,
    [data.categories]
  );

  return (
    <Ctx.Provider value={{ ...data, loading, error, changed, toast, notify, categoryLabel }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNews() {
  return useContext(Ctx);
}
