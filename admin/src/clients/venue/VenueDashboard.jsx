/**
 * VenueDashboard.jsx — a wedding venue's pages in the client dashboard:
 * /venue (today), /venue/visits, /venue/profile, /venue/reviews.
 */
import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageShell';
import { ErrorText, Loading } from '../../components/ui';
import Flash, { useFlash } from '../common/Flash';
import ReviewsPanel from '../common/ReviewsPanel';
import { venueApi } from './venueApi';
import VenueToday from './VenueToday';
import VenueVisits from './VenueVisits';
import VenueProfile from './VenueProfile';

const TITLES = { today: 'Today', visits: 'Visit requests', profile: 'Venue profile', reviews: 'Reviews' };

function VenueReviews({ show }) {
  const [reviews, setReviews] = useState(null);
  const load = () => venueApi.reviews().then(setReviews).catch((e) => show(e.message, true));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!reviews) return <Loading />;
  return <ReviewsPanel reviews={reviews} onReply={async (r, text) => { await venueApi.reply(r.id, text); show('Reply posted'); load(); }} />;
}

export default function VenueDashboard() {
  const { section = 'today' } = useParams();
  const [venue, setVenue] = useState(null);
  const [error, setError] = useState('');
  const [flash, show] = useFlash();
  useEffect(() => { venueApi.profile().then(setVenue).catch((e) => setError(e.message)); }, []);

  if (!TITLES[section]) return <Navigate to="/venue" replace />;
  if (!venue) return error ? <ErrorText>{error}</ErrorText> : <Loading />;
  return (
    <div>
      <PageHeader title={venue.name} subtitle={TITLES[section]} />
      {section === 'today' && <VenueToday venue={venue} />}
      {section === 'visits' && <VenueVisits show={show} />}
      {section === 'profile' && <VenueProfile venue={venue} onSaved={setVenue} show={show} />}
      {section === 'reviews' && <VenueReviews show={show} />}
      <Flash flash={flash} />
    </div>
  );
}
