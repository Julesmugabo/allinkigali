/**
 * NewsDashboard.jsx — the news module's shell. Sections are picked from
 * the portal sidebar (see ./nav.js); each has its own URL, /news/<section>.
 * Every section lives in its own folder under ./sections.
 */
import React from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageShell';
import { Toast } from '../../components/ui';
import { NewsProvider, useNews } from './NewsContext';
import { SECTIONS } from './constants';

import Newsroom from './sections/newsroom/Newsroom';
import Articles from './sections/articles/Articles';
import ArticleEditor from './sections/editor/ArticleEditor';
import Categories from './sections/categories/Categories';
import Stories from './sections/stories/Stories';
import AdOps from './sections/ads/AdOps';
import Authors from './sections/authors/Authors';
import Analytics from './sections/analytics/Analytics';
import Reports from './sections/reports/Reports';
import Settings from './sections/settings/Settings';

const VIEWS = {
  newsroom: Newsroom,
  articles: Articles,
  write: ArticleEditor,
  categories: Categories,
  stories: Stories,
  ads: AdOps,
  authors: Authors,
  analytics: Analytics,
  reports: Reports,
  settings: Settings,
};

function NewsToast() {
  const { toast } = useNews();
  return <Toast toast={toast} />;
}

function Shell() {
  const { section = 'newsroom' } = useParams();
  const [params] = useSearchParams();
  const View = VIEWS[section];
  if (!View) return <Navigate to="/news" replace />;
  const label = section === 'write' && params.get('id') ? 'Edit Article' : SECTIONS.find((x) => x.key === section)?.label;
  return (
    <div>
      <PageHeader title="News" subtitle={label} />
      <View />
      <NewsToast />
    </div>
  );
}

export default function NewsDashboard() {
  return (
    <NewsProvider>
      <Shell />
    </NewsProvider>
  );
}
