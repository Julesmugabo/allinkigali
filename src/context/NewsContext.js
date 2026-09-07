/**
 * NewsContext.js — Ububiko bw'amakuru (the news "database").
 *
 * Promotes the news feed from static mockNews.js constants into an editable
 * store, the same way BusinessContext promoted the shop. This is what makes
 * the News admin dashboard's Add/Edit/Approve actions actually do something
 * instead of being a UI that draws on data nothing can change.
 *
 * Every seed article starts as `status: 'published'` (they were already
 * being shown before this existed) with `views: 0` — views only grow from
 * real taps in NewsScreen from here on, they are not backfilled/faked.
 */
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import {
  allArticles as seedArticles,
  heroArticle as seedHero,
  trendingArticles as seedTrending,
  CATEGORIES as seedCategoriesWithAll,
} from '../data/mockNews';

const NewsContext = createContext(null);

const ALL_TAB = { key: 'all', label: 'Byose' };

function slugify(label) {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function seedArticleState() {
  const trendingIds = new Set(seedTrending.map((a) => a.id));
  return seedArticles.map((a) => ({
    sourceUrl: null,
    body: '',
    imageUrl: null,
    ...a,
    status: 'published',
    isFeatured: a.id === seedHero.id,
    isTrending: trendingIds.has(a.id),
    isArchived: false,
    views: 0,
  }));
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
  const [articles, setArticles] = useState(seedArticleState);
  // Real content categories only — "Byose" (All) is a UI-only pseudo-category
  // added back for the customer tab strip, not something an editor manages.
  const [categories, setCategories] = useState(() => seedCategoriesWithAll.filter((c) => c.key !== 'all'));

  const addArticle = useCallback((data) => {
    const newArticle = {
      id: `news-${Date.now()}`,
      publishedAt: new Date().toISOString(),
      isFeatured: false,
      isTrending: false,
      isArchived: false,
      views: 0,
      sourceUrl: null,
      body: '',
      imageUrl: null,
      ...data,
    };
    setArticles((current) => [newArticle, ...current]);
    return newArticle;
  }, []);

  const updateArticle = useCallback((id, patch) => {
    setArticles((current) => current.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const deleteArticle = useCallback((id) => {
    setArticles((current) => current.filter((a) => a.id !== id));
  }, []);

  const approveArticle = useCallback((id) => {
    setArticles((current) =>
      current.map((a) =>
        a.id === id ? { ...a, status: 'published', publishedAt: new Date().toISOString() } : a
      )
    );
  }, []);

  const rejectArticle = useCallback((id) => {
    setArticles((current) => current.map((a) => (a.id === id ? { ...a, status: 'rejected' } : a)));
  }, []);

  /**
   * Archive one or many articles at once — takes an array so a multi-select
   * "archive these" action is a single state update, not N of them.
   */
  const archiveArticles = useCallback((ids) => {
    const idSet = new Set(ids);
    setArticles((current) => current.map((a) => (idSet.has(a.id) ? { ...a, isArchived: true } : a)));
  }, []);

  const unarchiveArticle = useCallback((id) => {
    setArticles((current) => current.map((a) => (a.id === id ? { ...a, isArchived: false } : a)));
  }, []);

  const incrementArticleView = useCallback((id) => {
    setArticles((current) => current.map((a) => (a.id === id ? { ...a, views: (a.views || 0) + 1 } : a)));
  }, []);

  const getArticleById = useCallback((id) => articles.find((a) => a.id === id) || null, [articles]);

  const getFeed = useCallback((categoryKey) => computeFeed(articles, categoryKey), [articles]);

  const addCategory = useCallback((label) => {
    const key = slugify(label);
    const newCategory = { key, label };
    setCategories((current) => (current.some((c) => c.key === key) ? current : [...current, newCategory]));
    return newCategory;
  }, []);

  const updateCategory = useCallback((key, patch) => {
    setCategories((current) => current.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }, []);

  const deleteCategory = useCallback(
    (key) => {
      const inUse = articles.some((a) => a.category === key);
      if (inUse) return false;
      setCategories((current) => current.filter((c) => c.key !== key));
      return true;
    },
    [articles]
  );

  const categoriesWithAll = useMemo(() => [ALL_TAB, ...categories], [categories]);

  const value = useMemo(
    () => ({
      articles,
      categories,
      categoriesWithAll,
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
