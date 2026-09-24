/**
 * articleLabels.js — Every label a news article can carry, in one place.
 *
 * "breaking" comes from the article's isBreaking flag; the rest live in the
 * article's `labels` list. The news admin picks them in the article editor and
 * they show as small coloured tags on the cards. Sponsored is always shown
 * plainly so paid content is never mistaken for news.
 */
import { colors } from '../theme';

export const LABELS = {
  breaking: { text: 'BREAKING', backgroundColor: colors.breaking },
  exclusive: { text: 'EXCLUSIVE', backgroundColor: '#BA7517' },
  opinion: { text: 'OPINION', backgroundColor: '#533AB7' },
  sponsored: { text: 'SPONSORED', backgroundColor: '#5A6B7D' },
  pick: { text: "EDITOR'S PICK", backgroundColor: colors.blue600 },
};

// Labels the editor lets you tick, besides Breaking which has its own row.
export const EDITOR_LABELS = ['exclusive', 'opinion', 'sponsored', 'pick'];

// The keys to show on a card, in a fixed order: breaking first, then the rest.
export function getArticleLabelKeys(article) {
  const keys = article.isBreaking ? ['breaking'] : [];
  (article.labels || []).forEach((key) => {
    if (LABELS[key] && !keys.includes(key)) keys.push(key);
  });
  return keys;
}
