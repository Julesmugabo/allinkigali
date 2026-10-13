/**
 * articleActions.js — the one-click article actions used by the list and
 * the newsroom. Each returns the confirmation message to show.
 */
import { newsApi } from '../../newsApi';

export const articleActions = {
  approve: async (a) => { await newsApi.updateArticle(a.id, { status: 'published', publishedAt: new Date().toISOString() }); return 'Approved and published'; },
  reject: async (a) => { await newsApi.updateArticle(a.id, { status: 'rejected' }); return 'Rejected'; },
  feature: async (a) => { await newsApi.updateArticle(a.id, { isFeatured: !a.isFeatured }); return a.isFeatured ? 'No longer the hero story' : 'Now the hero story'; },
  breaking: async (a) => { await newsApi.updateArticle(a.id, { isBreaking: !a.isBreaking }); return a.isBreaking ? 'Breaking flag removed' : 'Marked as breaking'; },
  archive: async (a) => { await newsApi.updateArticle(a.id, { isArchived: true }); return 'Archived'; },
  restore: async (a) => { await newsApi.updateArticle(a.id, { isArchived: false }); return 'Restored'; },
  remove: async (a) => { await newsApi.deleteArticle(a.id); return 'Deleted'; },
};
