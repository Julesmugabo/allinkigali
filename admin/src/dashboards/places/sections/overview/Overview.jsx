/**
 * Overview.jsx — listings at a glance: how many, open now, on delivery,
 * average rating, bookings waiting, and the districts with most places.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../../../../theme';
import { Panel, Kpi, KpiGrid, Loading, ErrorText } from '../../../../components/ui';
import BarList from '../../../../components/ui/BarList';
import { usePlaces } from '../../PlacesContext';

export const isOpen = (p) => /^open/i.test(p.open_status || '');

export default function Overview() {
  const navigate = useNavigate();
  const { type, places, bookings, loading, error } = usePlaces();
  if (loading) return <Loading />;

  const active = places.filter((p) => p.is_active !== false);
  const rated = active.filter((p) => p.rating);
  const avg = rated.length ? (rated.reduce((s, p) => s + Number(p.rating), 0) / rated.length).toFixed(1) : '—';
  const byDistrict = {};
  active.forEach((p) => { const d = p.district || 'Unknown'; byDistrict[d] = (byDistrict[d] || 0) + 1; });
  const pending = bookings.filter((b) => b.status === 'pending').length;
  const today = new Date().toISOString().slice(0, 10);
  const todays = bookings.filter((b) => String(b.date).slice(0, 10) === today && b.status === 'confirmed').length;

  return (
    <>
      <ErrorText>{error}</ErrorText>
      <KpiGrid>
        <Kpi label={`${type.title} listed`} value={active.length} hint={places.length - active.length ? `${places.length - active.length} hidden` : undefined} onClick={() => navigate(`${type.base}/list`)} />
        <Kpi label="Open now" value={active.filter(isOpen).length} color={t.success} />
        <Kpi label="Delivery on" value={active.filter((p) => p.delivery_enabled).length} color="#A78BFA" />
        <Kpi label="Average rating" value={avg === '—' ? avg : `★ ${avg}`} color="#FBBF24" />
        <Kpi label="Bookings waiting" value={pending} color={t.warning} onClick={() => navigate(`${type.base}/bookings`)} />
        <Kpi label="Confirmed for today" value={todays} color={t.accent} />
      </KpiGrid>
      <Panel title="Listings by district">
        <BarList rows={Object.entries(byDistrict).sort((a, b) => b[1] - a[1]).map(([d, n]) => ({ key: d, label: d, value: n }))} empty="No listings yet." />
      </Panel>
    </>
  );
}
