/**
 * newsApi.js — every call the news dashboard makes, in one place.
 */
import { apiFetch } from '../../api';

const get = (p) => apiFetch(p);
const post = (p, body) => apiFetch(p, { method: 'POST', body: body ?? {} });
const patch = (p, body) => apiFetch(p, { method: 'PATCH', body });
const del = (p) => apiFetch(p, { method: 'DELETE' });

export const newsApi = {
  // articles (a signed-in news admin gets every status)
  articles: () => get('/news/articles'),
  createArticle: (body) => post('/news/articles', body),
  updateArticle: (id, body) => patch(`/news/articles/${id}`, body),
  deleteArticle: (id) => del(`/news/articles/${id}`),
  publishScheduled: () => post('/news/articles/publish-scheduled'),
  expireBreaking: () => post('/news/articles/expire-breaking'),

  // categories
  categories: () => get('/news/categories'),
  createCategory: (key, label) => post('/news/categories', { key, label }),
  renameCategory: (key, label) => patch(`/news/categories/${key}`, { label }),
  deleteCategory: (key) => del(`/news/categories/${key}`),

  // live stories
  stories: () => get('/news/stories'),
  createStory: (title) => post('/news/stories', { title }),
  updateStory: (id, body) => patch(`/news/stories/${id}`, body),
  deleteStory: (id) => del(`/news/stories/${id}`),

  // authors
  authors: () => get('/news/authors'),
  createAuthor: (body) => post('/news/authors', body),
  updateAuthor: (id, body) => patch(`/news/authors/${id}`, body),
  deactivateAuthor: (id) => del(`/news/authors/${id}`),

  // ads
  ads: () => get('/ads/manage'),
  createAd: (body) => post('/ads', body),
  updateAd: (id, body) => patch(`/ads/${id}`, body),
  deleteAd: (id) => del(`/ads/${id}`),
  advertisers: () => get('/news/advertisers'),
  createAdvertiser: (body) => post('/news/advertisers', body),
  updateAdvertiser: (id, body) => patch(`/news/advertisers/${id}`, body),
  deleteAdvertiser: (id) => del(`/news/advertisers/${id}`),
  campaigns: () => get('/news/campaigns'),
  createCampaign: (body) => post('/news/campaigns', body),
  updateCampaign: (id, body) => patch(`/news/campaigns/${id}`, body),
  deleteCampaign: (id) => del(`/news/campaigns/${id}`),

  // analytics
  viewsByDay: (days) => get(`/news/analytics/reads-over-time?days=${days}`),
  topArticles: (limit = 10) => get(`/news/analytics/top-articles?limit=${limit}`),
  byCategory: () => get('/news/analytics/by-category'),
  byAuthor: () => get('/news/analytics/by-author'),

  // settings
  readerSettings: () => get('/news/settings'),
  setShowViewCounts: (showViewCounts) => patch('/news/settings', { showViewCounts }),
  workflowSettings: () => get('/news/workflow-settings'),
  saveWorkflowSettings: (body) => patch('/news/workflow-settings', body),
};
