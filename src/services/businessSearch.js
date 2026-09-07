/**
 * businessSearch.js — Gusesengura icyifuzo no gushakisha ubucuruzi buhuye na cyo.
 *
 * Split into two steps on purpose, mirroring the Gemini function-calling
 * design we'll swap in later:
 *
 *   1. interpretQuery(raw) — turns free text into structured params
 *      (today: keyword rules; later: a backend call that asks Gemini to
 *      extract { category, location, date, priceRange, ... }).
 *   2. queryBusinesses(list, params) — filters the business list using only
 *      structured params, never the raw text (today: the local mock array;
 *      later: the same shape of params sent to the real database).
 *
 * Nothing outside this file needs to change when step 1 starts calling a
 * real AI backend — only the inside of interpretQuery does.
 */
import { BUSINESS_CATEGORIES } from '../data/mockBusinesses';
import { normalise } from '../utils/format';

const MAX_RESULTS = 4;

// Words that point at each category. Kept alongside the categories so the
// list is easy to extend when a new kind of business is added.
const CATEGORY_KEYWORDS = {
  gas: ['gaz', 'gas', 'gasi', 'guteka', 'cylinder', 'icupa'],
  fitness: ['gym', 'fitness', 'workout', 'imyitozo', 'ndamucyo', 'kwiyubaka', 'gukora sport'],
  kids: ['kids', 'children', 'abana', 'leisure', 'kwidagadura', 'family', 'umuryango', 'kwishimisha'],
  transport: ['ride', 'taxi', 'moto', 'gutwara', 'ingendo', 'book a ride', 'delivery', 'airport'],
};

/**
 * Free text -> structured params. This is the exact shape a Gemini
 * function-calling response will fill in later:
 *   { category, keyword, raw }
 */
export function interpretQuery(raw = '') {
  const q = normalise(raw);

  const category =
    Object.keys(CATEGORY_KEYWORDS).find((key) =>
      CATEGORY_KEYWORDS[key].some((word) => q.includes(normalise(word)))
    ) || null;

  return { category, keyword: q, raw };
}

/**
 * Structured params -> matching businesses. Only ever reads `params`, never
 * `params.raw` directly, so this function works unchanged once params come
 * from a real AI backend instead of interpretQuery.
 */
export function queryBusinesses(list = [], params = {}) {
  const { category, keyword } = params;

  const scored = list
    .filter((biz) => !category || biz.category === category)
    .map((biz) => {
      // biz.category is included so a seller's own custom category (the
      // platform accepts any kind of business, not just the preset list)
      // is still findable by keyword even without a dedicated category rule.
      const haystack = normalise(
        [biz.name, biz.category, biz.location, ...(biz.services || []), ...(biz.keywords || [])].join(' ')
      );
      const matchesKeyword = !keyword || haystack.includes(keyword);
      return { biz, matchesKeyword };
    })
    .filter(({ matchesKeyword }) => category || matchesKeyword)
    .map(({ biz }) => biz);

  return scored.slice(0, MAX_RESULTS);
}

/**
 * Convenience wrapper the UI calls today. Swap the `interpretQuery` call
 * inside here for a backend/Gemini call when that's ready — `queryBusinesses`
 * and everything downstream stays the same.
 */
export function searchBusinesses(list, raw) {
  const params = interpretQuery(raw);
  const results = queryBusinesses(list, params);
  return { params, results, isEmpty: results.length === 0 };
}

/**
 * A preset category (gas/fitness/kids/transport) has its own translated
 * label; a seller's custom category is just their own text, shown as-is.
 */
export function categoryLabel(key) {
  if (!key) return null;
  const preset = BUSINESS_CATEGORIES.find((c) => c.key === key);
  return preset ? preset.label : key;
}

/**
 * Every distinct category currently in use, with how many businesses use
 * it — preset or custom alike. Built for the sales-partner admin dashboard's
 * category management (seeing what sellers are actually registering under,
 * including categories nobody anticipated), but generic enough to reuse
 * anywhere a category breakdown is useful.
 */
export function getCategoryCounts(list = []) {
  const counts = new Map();
  list.forEach((biz) => {
    if (!biz.category) return;
    counts.set(biz.category, (counts.get(biz.category) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([category, count]) => ({
      category,
      label: categoryLabel(category),
      count,
      isPreset: BUSINESS_CATEGORIES.some((c) => c.key === category),
    }))
    .sort((a, b) => b.count - a.count);
}

export default { interpretQuery, queryBusinesses, searchBusinesses, categoryLabel, getCategoryCounts };
