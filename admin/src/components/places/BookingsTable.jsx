/**
 * BookingsTable.jsx — table bookings with their workflow, shared by the
 * platform places admin and the owner dashboard:
 *   pending   → Confirm, Decline (with a reason the guest sees)
 *   confirmed → Completed, No-show
 * onStatus(booking, status, reason) does the saving.
 */
import React, { useState } from 'react';
import { t } from '../../theme';
import { DataTable, Tabs, Badge } from '../PageShell';
import Button from '../common/Button';
import { RowActions } from '../ui';

// The business dashboard uses its lime / gold / red; the Staff Portal its own set.
const COLORS = t.inkStatus
  ? { pending: t.gold, confirmed: t.lime, rejected: t.danger, cancelled: t.textMuted, completed: t.textMuted, noshow: t.danger }
  : { pending: '#FBBF24', confirmed: '#34D399', rejected: '#F87171', cancelled: '#94A3B8', completed: '#60A5FA', noshow: '#FB923C' };
const REASONS = ['Fully booked', 'Closed that day', 'Party too large', 'Private event', 'Other'];

const fmtDay = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }) : '—');

export default function BookingsTable({ bookings, onStatus, showPlace = false }) {
  const [tab, setTab] = useState('pending');
  const [declining, setDeclining] = useState(null);
  const [busy, setBusy] = useState(null);
  const count = (st) => bookings.filter((b) => b.status === st).length;
  const tabs = [
    { key: 'pending', label: 'Waiting', count: count('pending') },
    { key: 'upcoming', label: 'Confirmed', count: count('confirmed') },
    { key: 'all', label: 'All', count: bookings.length },
  ];
  const rows = tab === 'pending' ? bookings.filter((b) => b.status === 'pending')
    : tab === 'upcoming' ? bookings.filter((b) => b.status === 'confirmed') : bookings;

  const act = async (b, status, reason) => {
    setBusy(b.id);
    try { await onStatus(b, status, reason); setDeclining(null); } catch (e) { alert(e.message); }
    setBusy(null);
  };

  const columns = [
    ...(showPlace ? [{ key: 'placeName', label: 'Place', render: (b) => b.placeName || '—' }] : []),
    {
      key: 'guest', label: 'Guest', render: (b) => (
        <div>
          <div style={{ fontWeight: 500 }}>{b.guestName || '—'}</div>
          <div style={{ color: t.textMuted, fontSize: 12 }}>
            {b.guestPhone ? <a href={`tel:${b.guestPhone}`}>{b.guestPhone}</a> : ''}
            {b.noshowCount > 0 && <span style={{ color: t.inkStatus || COLORS.noshow, fontWeight: t.inkStatus ? 600 : undefined }}> · {b.noshowCount} past no-show(s)</span>}
          </div>
        </div>
      ),
    },
    { key: 'when', label: 'When', render: (b) => `${fmtDay(b.date)} · ${String(b.time || '').slice(0, 5)}` },
    { key: 'partySize', label: 'Guests' },
    { key: 'notes', label: 'Notes', render: (b) => <span style={{ fontSize: 12, color: t.textSecondary }}>{b.notes || (b.declineReason ? `Declined: ${b.declineReason}` : '')}</span> },
    { key: 'status', label: 'Status', render: (b) => <Badge color={COLORS[b.status]}>{b.status === 'noshow' ? 'no-show' : b.status}</Badge> },
    {
      key: 'a', label: '', render: (b) => (declining === b.id ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 260 }}>
          {REASONS.map((r) => <Button key={r} size="sm" variant="danger" disabled={busy === b.id} onClick={() => act(b, 'rejected', r)}>{r}</Button>)}
          <Button size="sm" variant="ghost" onClick={() => setDeclining(null)}>Back</Button>
        </div>
      ) : (
        <RowActions>
          {b.status === 'pending' && <Button size="sm" variant="success" disabled={busy === b.id} onClick={() => act(b, 'confirmed')}>Confirm</Button>}
          {b.status === 'pending' && <Button size="sm" variant="danger" onClick={() => setDeclining(b.id)}>Decline</Button>}
          {b.status === 'confirmed' && <Button size="sm" variant="info" disabled={busy === b.id} onClick={() => act(b, 'completed')}>Completed</Button>}
          {b.status === 'confirmed' && <Button size="sm" variant="warning" disabled={busy === b.id} onClick={() => act(b, 'noshow')}>No-show</Button>}
        </RowActions>
      )),
    },
  ];

  return (
    <>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      <DataTable columns={columns} rows={rows} emptyText={tab === 'pending' ? 'No bookings waiting for an answer.' : 'No bookings here.'} />
    </>
  );
}
