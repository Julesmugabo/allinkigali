/**
 * Insights.jsx — booking patterns: busiest days and hours, how many
 * requests turn into visits, no-shows, and how fast the place answers.
 */
import React from 'react';
import { t } from '../../../../theme';
import { Panel, Kpi, KpiGrid } from '../../../../components/ui';
import BarList from '../../../../components/ui/BarList';
import { useOwner } from '../../OwnerContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');

export default function Insights() {
  const { bookings, orders } = useOwner();
  const total = bookings.length;
  const confirmed = bookings.filter((b) => ['confirmed', 'completed', 'noshow'].includes(b.status)).length;
  const completed = bookings.filter((b) => b.status === 'completed').length;
  const noshow = bookings.filter((b) => b.status === 'noshow').length;
  const answered = bookings.filter((b) => b.respondedAt);
  const fast = answered.filter((b) => new Date(b.respondedAt) - new Date(b.createdAt) < 2 * 3600 * 1000).length;
  const avgMin = answered.length ? Math.round(answered.reduce((s, b) => s + (new Date(b.respondedAt) - new Date(b.createdAt)), 0) / answered.length / 60000) : null;

  const byDay = DAYS.map((d) => ({ key: d, label: d, value: 0 }));
  const byHour = {};
  bookings.forEach((b) => {
    if (b.date) byDay[new Date(b.date).getDay()].value += 1;
    const h = String(b.time || '').slice(0, 2);
    if (h) byHour[h] = (byHour[h] || 0) + 1;
  });
  const dishes = {};
  orders.filter((o) => o.status !== 'cancelled').forEach((o) => (o.items || []).forEach((i) => { dishes[i.name] = (dishes[i.name] || 0) + Number(i.qty || i.quantity || 1); }));

  return (
    <>
      <KpiGrid>
        <Kpi label="Booking requests" value={total} />
        <Kpi label="Accepted" value={pct(confirmed, total)} hint={`${confirmed} of ${total}`} color={t.success} />
        <Kpi label="Guests who came" value={pct(completed, completed + noshow)} hint={`${noshow} no-show(s)`} color="#60A5FA" />
        <Kpi label="Answered within 2 h" value={pct(fast, total)} hint={avgMin != null ? `average ${avgMin < 120 ? `${avgMin} min` : `${Math.round(avgMin / 60)} h`}` : 'no answers recorded yet'} color={fast / (total || 1) >= 0.8 ? t.success : t.warning} />
      </KpiGrid>
      <div style={s.two}>
        <Panel title="Busiest days" style={{ marginBottom: 0 }}><BarList rows={byDay} empty="No bookings yet." /></Panel>
        <Panel title="Busiest booking times" style={{ marginBottom: 0 }}>
          <BarList rows={Object.keys(byHour).sort().map((h) => ({ key: h, label: `${h}:00`, value: byHour[h] }))} empty="No bookings yet." color={t.success} />
        </Panel>
      </div>
      <Panel title="Most ordered (delivery)" style={{ marginTop: 20 }}>
        <BarList rows={Object.entries(dishes).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, n]) => ({ key: name, label: name, value: n }))} empty="No delivery orders yet." color="#A78BFA" />
      </Panel>
    </>
  );
}

const s = { two: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 } };
