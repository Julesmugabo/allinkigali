/**
 * articleForm.js — the editor's data rules, kept apart from the screen:
 * article → form, form validation, and form → what the server stores.
 */
import { CATEGORY_ICONS, slugify } from '../../constants';
import { isEmbeddedPreview } from '../../../../components/form/MediaUpload';

// ISO time ⇄ the "YYYY-MM-DDTHH:mm" a datetime-local input uses (local time)
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function emptyForm(categories) {
  return {
    title: '', category: categories[0]?.key || '', source: '', sourceUrl: '', body: '', imageUrl: '',
    isBreaking: false, isFeatured: false, isTrending: false, labels: [],
    storyId: '', newStoryTitle: '', authorId: '', webAdId: '', destination: 'draft', publishAt: '',
    slug: '', metaDescription: '', ogImage: '',
  };
}

export function formFromArticle(a) {
  const scheduled = a.status === 'draft' && a.publishAt && new Date(a.publishAt) > new Date();
  return {
    title: a.title || '', category: a.category || '', source: a.source || '', sourceUrl: a.sourceUrl || '',
    body: a.body || '', imageUrl: a.imageUrl || '',
    isBreaking: !!a.isBreaking, isFeatured: !!a.isFeatured, isTrending: !!a.isTrending, labels: a.labels || [],
    storyId: a.storyId || '', newStoryTitle: '', authorId: a.authorId || '', webAdId: a.webAdId || '',
    destination: scheduled ? 'schedule' : (['draft', 'pending', 'published'].includes(a.status) ? a.status : 'draft'),
    publishAt: toLocalInput(a.publishAt),
    slug: a.slug || '', metaDescription: a.metaDescription || '', ogImage: a.ogImage || '',
  };
}

export function validate(form) {
  const e = {};
  if (!form.title.trim()) e.title = 'Headline is required.';
  if (!form.category) e.category = 'Choose a category.';
  if (!form.source.trim()) e.source = 'Name the source.';
  if (!form.body.trim()) e.body = 'Write the article body.';
  if (isEmbeddedPreview(form.imageUrl)) e.imageUrl = 'The cover is a blurry search preview — upload the photo or use its real link.';
  if (isEmbeddedPreview(form.ogImage)) e.ogImage = 'The share image is a search preview, not a real link.';
  if (form.destination === 'schedule') {
    if (!form.publishAt) e.publishAt = 'Pick when it should go live.';
    else if (new Date(form.publishAt) <= new Date()) e.publishAt = 'The scheduled time must be in the future.';
  }
  if (form.storyId === 'new' && !form.newStoryTitle.trim()) e.story = 'Give the new live story a headline.';
  return e;
}

export const wordCount = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

/** What the server stores. `existing` is the article being edited, if any. */
export function toPayload(form, { existing, storyId }) {
  const status = form.destination === 'schedule' ? 'draft' : form.destination;
  const payload = {
    title: form.title.trim(), category: form.category, source: form.source.trim(),
    sourceUrl: form.sourceUrl.trim() || null, body: form.body.trim(), imageUrl: form.imageUrl || null,
    icon: CATEGORY_ICONS[form.category] || 'newspaper-variant-outline',
    isBreaking: form.isBreaking, isFeatured: form.isFeatured, isTrending: form.isTrending,
    labels: form.labels, isSponsored: form.labels.includes('sponsored'),
    storyId: storyId || null, authorId: form.authorId || null, webAdId: form.webAdId || null,
    status,
    publishAt: form.destination === 'schedule' ? new Date(form.publishAt).toISOString() : null,
    slug: form.slug.trim() || slugify(form.title),
    metaDescription: form.metaDescription.trim() || null,
    ogImage: form.ogImage.trim() || null,
    readTimeMin: Math.max(1, Math.round(wordCount(form.body) / 200)),
  };
  // Stamp the publish time when it actually goes out now (new, or a draft
  // being published); keep the original time when re-saving a live article.
  if (status === 'published' && existing?.status !== 'published') payload.publishedAt = new Date().toISOString();
  return payload;
}
