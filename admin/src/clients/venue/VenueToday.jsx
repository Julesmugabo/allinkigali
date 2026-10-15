/**
 * VenueToday.jsx — a wedding venue's first page: visit requests waiting for
 * an answer, the next confirmed visits, and how couples rate the venue.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../../theme';
import { DataTable } from '../../components/PageShell';
import { Panel, Kpi, KpiGrid, ErrorText, Loading } from '../../components/ui';
import { day } from '../common/format';
import { venueApi } from './venueApi';

const today = () => new Date().toISOString().slice(0, 10);

export default function VenueToday({ venue }) {
  const navigate = useNavigate();
  const [visits, setVisits] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    venueApi.visits().then(setVisits).catch((e) => setError(e.message));
    venueApi.reviews().then(setReviews).catch(() => {});
  }, []);

  if (!visits) return error ? <ErrorText>{error}</ErrorText> : <Loading />;
  const waiting = visits.filter((v) => v.status === 'pending');
  const next = visits.filter((v) => v.status === 'confirmed' && String(v.date).slice(0, 10) >= today())
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <>
      <KpiGrid>
        <Kpi label="Visit requests waiting" value={waiting.length} color={waiting.length ? t.warning : t.textSecondary} onClick={() => navigate('/venue/visits')} />
        <Kpi label="Upcoming visits" value={next.length} color={t.success} onClick={() => navigate('/venue/visits')} />
        <Kpi label="Rating" value={avg ? `★ ${avg}` : '—'} color="#FBBF24" hint={`${reviews.length} review${reviews.length === 1 ? '' : 's'}`} onClick={() => navigate('/venue/reviews')} />
        <Kpi label="Photos in the app" value={(venue.photos || []).length} color={(venue.photos || []).length ? t.accent : t.warning} hint="Couples look at photos first" onClick={() => navigate('/venue/profile')} />
      </KpiGrid>
      <Panel title="Next visits">
        <DataTable
          columns={[
            { key: 'date', label: 'When', render: (v) => `${day(v.date)} · ${String(v.time || '').slice(0, 5)}` },
            { key: 'guestName', label: 'Couple / guest', render: (v) => <>{v.guestName}<div style={{ color: t.textMuted, fontSize: 12 }}>{v.guestPhone}</div></> },
            { key: 'partySize', label: 'People' },
            { key: 'notes', label: 'Notes', render: (v) => <span style={{ color: t.textSecondary, fontSize: 12 }}>{v.notes}</span> },
          ]}
          rows={next.slice(0, 8)}
          emptyText="No confirmed visits coming up."
        />
      </Panel>
    </>
  );
}
