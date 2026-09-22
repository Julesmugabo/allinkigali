/**
 * NewsContext.js — Ububiko bw'amakuru (the news "database").
 *
 * Talks to our own Express + Postgres backend (server/src/routes/news.js)
 * now, not Supabase — every screen still only ever calls useNews(),
 * nothing outside this file needed to change, same as the plan intended.
 *
 * The server enforces who sees what (a signed-in 'news'/'director' admin
 * gets every article — drafts, pending, rejected, archived; anyone else
 * only gets published, non-archived rows) — this context just calls
 * `refreshArticles()` right after a sign-in or sign-out so that scope
 * updates immediately, since (unlike Supabase) there's no built-in
 * auth-state-change event to listen for here.
 */
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';

const NewsContext = createContext(null);

const ALL_TAB = { key: 'all', label: 'Byose' };

function slugify(label) {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function computeFeed(articles, categoryKey = 'all') {
  // Archived is separate from status on purpose: archiving must never lose
  // what the article's real status was, so an unarchive can restore it
  // exactly. An archived article is hidden from readers even if it's still
  // technically "published".
  const published = articles.filter((a) => a.status === 'published' && !a.isArchived);

  if (categoryKey === 'all') {
    const hero = published.find((a) => a.isFeatured) || published[0] || null;
    return {
      hero,
      trending: published.filter((a) => a.isTrending),
      latest: published.filter((a) => a.id !== hero?.id),
    };
  }

  const matching = published.filter((a) => a.category === categoryKey);
  const [first, ...rest] = matching;
  return {
    hero: first || null,
    trending: published.filter((a) => a.isTrending && a.category === categoryKey),
    latest: rest,
  };
}

export function NewsProvider({ children }) {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshArticles = useCallback(async () => {
    try {
      const data = await apiFetch('/news/articles');
      setArticles(data || []);
    } catch {
      // Leave whatever was already loaded rather than blanking the feed
      // over a transient network hiccup.
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiFetch('/news/categories');
      setCategories(data || []);
    } catch {
      // same reasoning as refreshArticles
    }
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([refreshArticles(), fetchCategories()]);
      setIsLoading(false);
    })();
  }, [refreshArticles, fetchCategories]);

  const addArticle = useCallback(async (data) => {
    try {
      const newArticle = await apiFetch('/news/articles', { method: 'POST', body: data });
      setArticles((current) => [newArticle, ...current]);
      return newArticle;
    } catch {
      return null;
    }
  }, []);

  const updateArticle = useCallback(async (id, patch) => {
    try {
      const updated = await apiFetch(`/news/articles/${id}`, { method: 'PATCH', body: patch });
      setArticles((current) => current.map((a) => (a.id === id ? updated : a)));
      return updated;
    } catch {
      return null;
    }
  }, []);

  const deleteArticle = useCallback(async (id) => {
    try {
      await apiFetch(`/news/articles/${id}`, { method: 'DELETE' });
      setArticles((current) => current.filter((a) => a.id !== id));
    } catch {
      // no-op — article stays in the list, matching the pre-fix state
    }
  }, []);

  const approveArticle = useCallback(
    (id) => updateArticle(id, { status: 'published', publishedAt: new Date().toISOString() }),
    [updateArticle]
  );

  const rejectArticle = useCallback((id) => updateArticle(id, { status: 'rejected' }), [updateArticle]);

  /**
   * Archive one or many articles at once — the server only has a per-id
   * PATCH endpoint, so this fires them in parallel rather than adding a
   * bulk endpoint for what's still a small, checkbox-driven selection.
   */
  const archiveArticles = useCallback(async (ids) => {
    await Promise.all(ids.map((id) => updateArticle(id, { isArchived: true })));
  }, [updateArticle]);

  const unarchiveArticle = useCallback((id) => updateArticle(id, { isArchived: false }), [updateArticle]);

  const incrementArticleView = useCallback(async (id) => {
    try {
      await apiFetch(`/news/articles/${id}/view`, { method: 'POST' });
      setArticles((current) => current.map((a) => (a.id === id ? { ...a, views: (a.views || 0) + 1 } : a)));
    } catch {
      // a missed view count isn't worth surfacing an error for
    }
  }, []);

  const getArticleById = useCallback((id) => articles.find((a) => a.id === id) || null, [articles]);

  const getFeed = useCallback((categoryKey) => computeFeed(articles, categoryKey), [articles]);

  const addCategory = useCallback(
    async (label) => {
      const key = slugify(label);
      const existing = categories.find((c) => c.key === key);
      if (existing) return existing;

      try {
        const row = await apiFetch('/news/categories', { method: 'POST', body: { key, label } });
        setCategories((current) => [...current, row]);
        return row;
      } catch {
        return null;
      }
    },
    [categories]
  );

  const updateCategory = useCallback(async (key, patch) => {
    try {
      const row = await apiFetch(`/news/categories/${key}`, { method: 'PATCH', body: patch });
      setCategories((current) => current.map((c) => (c.key === key ? row : c)));
    } catch {
      // no-op
    }
  }, []);

  const deleteCategory = useCallback(
    async (key) => {
      // Fast local check first (matches the old in-memory behaviour); the
      // FK `on delete restrict` on news_articles.category is the real
      // enforcement even if this client-side check were ever stale.
      const inUse = articles.some((a) => a.category === key);
      if (inUse) return false;

      try {
        await apiFetch(`/news/categories/${key}`, { method: 'DELETE' });
        setCategories((current) => current.filter((c) => c.key !== key));
        return true;
      } catch {
        return false;
      }
    },
    [articles]
  );

  const categoriesWithAll = useMemo(() => [ALL_TAB, ...categories], [categories]);

  const value = useMemo(
    () => ({
      articles,
      categories,
      categoriesWithAll,
      isLoading,
      refreshArticles,
      addArticle,
      updateArticle,
      deleteArticle,
      approveArticle,
      rejectArticle,
      archiveArticles,
      unarchiveArticle,
      incrementArticleView,
      getArticleById,
      getFeed,
      addCategory,
      updateCategory,
      deleteCategory,
    }),
    [
      articles,
      categories,
      categoriesWithAll,
      isLoading,
      refreshArticles,
      addArticle,
      updateArticle,
      deleteArticle,
      approveArticle,
      rejectArticle,
      archiveArticles,
      unarchiveArticle,
      incrementArticleView,
      getArticleById,
      getFeed,
      addCategory,
      updateCategory,
      deleteCategory,
    ]
  );

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
}

export function useNews() {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used inside <NewsProvider>.');
  }
  return context;
}

export default NewsContext;
