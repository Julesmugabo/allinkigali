/**
 * Reviews.jsx — what guests said about the restaurant or café, with a
 * public reply (the panel is shared with wedding venues).
 */
import React from 'react';
import ReviewsPanel from '../../../common/ReviewsPanel';
import { useOwner } from '../../OwnerContext';

export default function Reviews() {
  const { reviews, api, changed, notify } = useOwner();
  const onReply = async (r, text) => { await api.reply(r.id, text); notify('Reply posted'); changed(); };
  return <ReviewsPanel reviews={reviews} onReply={onReply} />;
}
