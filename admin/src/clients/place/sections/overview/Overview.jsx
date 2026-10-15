/**
 * Overview.jsx — today for this place: guests expected, bookings and
 * orders waiting, menu size, rating; the coffee-shop "how busy" switch;
 * today's bookings by hour; latest activity.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../../../../theme';
import { Panel, Kpi, KpiGrid } from '../../../../components/ui';
import BarList from '../../../../components/ui/BarList';
import { useOwner } from '../../OwnerContext';
import BusyPicker from './BusyPicker';

const day = (d) => String(d || '').slice(0, 10);
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export default function Overview() {
  const navigate = useNavigate();
  const { profile, bookings, orders, menu, isCafe, base } = useOwner();
  const today = localToday();
  const todays = bookings.filter((b) => day(b.date) === today && ['confirmed', 'pending'].includes(b.status));
  const covers = todays.filter((b) => b.status === 'confirmed').reduce((s, b) => s + (b.partySize || 1), 0);
  const waiting = bookings.filter((b) => b.status === 'pending');
  const openOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const byHour = {};
  todays.forEach((b) => { const h = String(b.time || '').slice(0, 2); if (h) byHour[h] = (byHour[h] || 0) + 1; });
  const latest = [
    ...bookings.map((b) => ({ at: b.createdAt, text: `Booking · ${b.guestName || 'guest'} · ${b.partySize || 1} people · ${b.status}` })),
    ...orders.map((o) => ({ at: o.createdAt, text: `Order #${o.code} · ${Number(o.total).toLocaleString()} RWF · ${o.status}` })),
  ].filter((x) => x.at).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);

  return (
    <>
      <KpiGrid>
        <Kpi label="Guests expected today" value={covers} hint={`${todays.length} booking(s)`} color={t.success} />
        <Kpi label="Bookings waiting for you" value={waiting.length} color={waiting.length ? t.warning : t.textSecondary} onClick={() => navigate(`${base}/bookings`)} />
        <Kpi label="Orders in progress" value={openOrders.length} color="#A78BFA" onClick={() => navigate(`${base}/orders`)} />
        <Kpi label="Menu items" value={menu.length} onClick={() => navigate(`${base}/menu`)} />
        <Kpi label="Rating" value={profile.rating ? `★ ${Number(profile.rating).toFixed(1)}` : '—'} color="#FBBF24" />
        <Kpi label="Right now" value={/^open/i.test(profile.open_status || '') ? 'Open' : 'Closed'} color={/^open/i.test(profile.open_status || '') ? t.success : t.danger} onClick={() => navigate(`${base}/settings`)} />
      </KpiGrid>
      {isCafe && <BusyPicker />}
      <div style={s.two}>
        <Panel title="Today's bookings by hour" style={{ marginBottom: 0 }}>
          <BarList rows={Object.keys(byHour).sort().map((h) => ({ key: h, label: `${h}:00`, value: byHour[h] }))} empty="No bookings today." color={t.success} />
        </Panel>
        <Panel title="Latest activity" style={{ marginBottom: 0 }}>
          {latest.length ? latest.map((x, i) => (
            <div key={i} style={s.row}><span style={s.when}>{new Date(x.at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>{x.text}</div>
          )) : <div style={{ color: t.textMuted, fontSize: 13 }}>Nothing yet.</div>}
        </Panel>
      </div>
    </>
  );
}

const s = {
  two: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 },
  row: { display: 'flex', gap: 10, padding: '7px 0', borderBottom: `1px solid ${t.border}`, color: t.text, fontSize: 13 },
  when: { color: t.textMuted, minWidth: 110 },
};
