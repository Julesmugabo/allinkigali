/**
 * usePlaceDetail.js — everything the place page needs for one place: the
 * place itself (built-in example first, then the live copy), its menu, its
 * reviews and a few similar places. `reloadReviews` refreshes after posting.
 */
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../../services/apiClient';
import usePlaces from '../browse/usePlaces';

const photoList = (p) => (p?.photos || []).map((x) => (typeof x === 'string' ? { url: x } : x)).filter((x) => x?.url);

export default function usePlaceDetail(kind, id) {
  const { places } = usePlaces(kind);
  const [place, setPlace] = useState(() => kind.fallback.find((p) => String(p.id) === String(id)) || null);
  const [missing, setMissing] = useState(false);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState({ count: 0, average: null, counts: {}, reviews: [] });

  useEffect(() => {
    if (!id) return;
    let live = true;
    apiFetch(`${kind.path}/${id}`)
      .then((d) => { if (live && d?.id) setPlace(d); })
      .catch(() => { if (live) setMissing(true); });
    if (kind.menuPath) {
      apiFetch(kind.menuPath(id)).then((d) => live && Array.isArray(d) && setMenu(d.filter((m) => m.available !== false))).catch(() => {});
    }
    return () => { live = false; };
  }, [kind, id]);

  const reloadReviews = useCallback(() => {
    if (!id) return;
    apiFetch(`/reviews?placeType=${kind.reviewType}&placeId=${encodeURIComponent(id)}`).then((d) => d && setReviews(d)).catch(() => {});
  }, [kind, id]);
  useEffect(reloadReviews, [reloadReviews]);

  // Similar: same district or sharing a cuisine/atmosphere, best rated first.
  const similar = place ? places
    .filter((p) => String(p.id) !== String(place.id))
    .map((p) => ({ p, score: (p.district && p.district === place.district ? 2 : 0) + kind.tags(p).filter((t) => kind.tags(place).includes(t)).length + Number(p.rating || 0) / 5 }))
    .sort((a, b) => b.score - a.score).slice(0, 4).map((x) => x.p) : [];

  return { place, photos: photoList(place), menu, reviews, reloadReviews, similar, missing: missing && !place };
}
