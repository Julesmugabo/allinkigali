/**
 * ClientDashboard — full operational view for one specific client business
 * (restaurant or coffee shop). Only reachable by the Sellers Admin (or the
 * director via the Sellers dashboard) by clicking "Open Dashboard" on a
 * client row. The ClientBanner at the top always shows the business name
 * and a back button.
 *
 * Tabs:
 *   Overview  — key details + status toggle
 *   Bookings  — all bookings for this business, confirm / reject pending
 *   Menu      — menu items (restaurant only)
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Phone, Globe, Star, Clock, CheckCircle, XCircle,
  ToggleLeft, ToggleRight, UtensilsCrossed, Coffee,
} from 'lucide-react';
import { apiFetch } from '../api';
import { t } from '../theme';
import { StatCard, Card, DataTable, Badge, Tabs } from '../components/PageShell';
import ClientBanner from '../components/ClientBanner';
import { useClient } from '../context/ClientContext';

export default function ClientDashboard() {
  const { client, exitClient } = useClient();
  const navigate = useNavigate();

  const [info, setInfo] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [toggling, setToggling] = useState(false);

  // If no client in context, redirect back
  useEffect(() => {
    if (!client) navigate('/sellers', { replace: true });
  }, [client, navigate]);

  const load = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const isRestaurant = client.type === 'restaurant';
      const [infoData, bookingData, menuData] = await Promise.all([
        isRestaurant
          ? apiFetch(`/restaurants/${client.id}`)
          : apiFetch(`/coffee-shops/${client.id}`),
        apiFetch(`/resto-bookings/admin?type=${isRestaurant ? 'restaurant' : 'coffee_shop'}`)
          .then(rows => (rows || []).filter(b => b.placeId === client.id))
          .catch(() => []),
        isRestaurant
          ? apiFetch(`/restaurant-menu?restaurantId=${client.id}`).catch(() => [])
          : Promise.resolve([]),
      ]);
      setInfo(infoData);
      setBookings(bookingData);
      setMenu(menuData || []);
    } catch {}
    setLoading(false);
  }, [client]);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async () => {
    if (!info) return;
    setToggling(true);
    try {
      const endpoint = client.type === 'restaurant'
        ? `/restaurants/${client.id}`
        : `/coffee-shops/${client.id}`;
      const newStatus = info.open_status === 'open' ? 'closed' : 'open';
      await apiFetch(endpoint, { method: 'PUT', body: { ...info, open_status: newStatus } });
      await load();
    } catch (err) { alert(err.message); }
    setToggling(false);
  };

  const updateBookingStatus = async (id, status) => {
    try {
      await apiFetch(`/resto-bookings/${id}/status`, { method: 'PUT', body: { status } });
      await load();
    } catch (err) { alert(err.message); }
  };

  if (!client) return null;
  if (loading) return (
    <div>
      <ClientBanner />
      <div style={{ padding: 40, color: t.textSecondary }}>Loading...</div>
    </div>
  );

  const isRestaurant = client.type === 'restaurant';
  const pending = bookings.filter(b => b.status === 'pending');
  const Icon = isRestaurant ? UtensilsCrossed : Coffee;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'bookings', label: 'Bookings', count: bookings.length },
    ...(isRestaurant ? [{ key: 'menu', label: 'Menu', count: menu.length }] : []),
  ];

  return (
    <div>
      <ClientBanner />

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerIcon}>
          <Icon size={22} color={isRestaurant ? t.accent : '#A78BFA'} />
        </div>
        <div>
          <h1 style={s.headerTitle}>{info?.name || client.name}</h1>
          <div style={s.headerMeta}>
            {info?.location && <span><MapPin size={12} /> {info.location}</span>}
            {info?.phone && <span><Phone size={12} /> {info.phone}</span>}
            {info?.website && (
              <a href={info.website} target="_blank" rel="noopener noreferrer" style={{ color: t.accent, fontSize: 12 }}>
                <Globe size={12} /> Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={s.statGrid}>
        <StatCard label="Status" value={info?.open_status === 'open' ? 'Open' : 'Closed'} icon={Clock} color={info?.open_status === 'open' ? t.success : t.danger} />
        <StatCard label="Bookings" value={bookings.length} icon={CheckCircle} color={t.accent} />
        <StatCard label="Pending" value={pending.length} icon={Clock} color={t.warning} />
        {info?.avg_rating && <StatCard label="Rating" value={info.avg_rating} icon={Star} color="#FBBF24" />}
      </div>

      <Card style={{ marginTop: 24 }}>
        <Tabs tabs={tabs} active={tab} onChange={setTab} />

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div style={s.overviewGrid}>
            <InfoRow label="Name" value={info?.name} />
            <InfoRow label="Location" value={info?.location} />
            <InfoRow label="District" value={info?.district} />
            <InfoRow label="Phone" value={info?.phone} />
            <InfoRow label="Website" value={info?.website} />
            {isRestaurant && <InfoRow label="Cuisines" value={Array.isArray(info?.cuisines) ? info.cuisines.join(', ') : info?.cuisines} />}
            {isRestaurant && <InfoRow label="Price Range" value={info?.price_range} />}
            {isRestaurant && <InfoRow label="Atmosphere" value={info?.atmosphere} />}
            {!isRestaurant && <InfoRow label="Coffee Types" value={Array.isArray(info?.coffee_types) ? info.coffee_types.join(', ') : info?.coffee_types} />}
            {!isRestaurant && <InfoRow label="Brewing Methods" value={Array.isArray(info?.brewing_methods) ? info.brewing_methods.join(', ') : info?.brewing_methods} />}
            {info?.description && (
              <div style={{ ...s.infoRow, gridColumn: '1 / -1' }}>
                <span style={s.infoLabel}>Description</span>
                <span style={s.infoValue}>{info.description}</span>
              </div>
            )}
            <div style={{ ...s.infoRow, gridColumn: '1 / -1', borderBottom: 'none', paddingTop: 8 }}>
              <span style={s.infoLabel}>Open / Closed</span>
              <button onClick={toggleStatus} disabled={toggling} style={s.toggleBtn}>
                {info?.open_status === 'open'
                  ? <><ToggleRight size={22} color={t.success} /> <span style={{ color: t.success, fontWeight: 600 }}>Currently Open</span> <span style={{ color: t.textMuted, fontSize: 12 }}>— click to close</span></>
                  : <><ToggleLeft size={22} color={t.danger} /> <span style={{ color: t.danger, fontWeight: 600 }}>Currently Closed</span> <span style={{ color: t.textMuted, fontSize: 12 }}>— click to open</span></>}
              </button>
            </div>
          </div>
        )}

        {/* ── Bookings ── */}
        {tab === 'bookings' && (
          <DataTable
            columns={[
              { key: 'guestName', label: 'Guest', render: r => <span style={{ color: t.text, fontWeight: 500 }}>{r.guestName || '—'}</span> },
              { key: 'date', label: 'Date', render: r => <span style={{ color: t.textSecondary }}>{r.date || '—'}</span> },
              { key: 'partySize', label: 'Party', render: r => <span style={{ color: t.textSecondary }}>{r.partySize || '—'}</span> },
              { key: 'status', label: 'Status', render: r => (
                <Badge color={r.status === 'confirmed' ? t.success : r.status === 'pending' ? t.warning : t.danger}>
                  {r.status}
                </Badge>
              )},
              { key: 'actions', label: '', width: 160, render: r => r.status === 'pending' ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => updateBookingStatus(r.id, 'confirmed')} style={{ ...s.actionBtn, color: t.success }}>
                    <CheckCircle size={13} /> Confirm
                  </button>
                  <button onClick={() => updateBookingStatus(r.id, 'rejected')} style={{ ...s.actionBtn, color: t.danger }}>
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              ) : null },
            ]}
            rows={bookings}
            emptyText="No bookings for this business."
          />
        )}

        {/* ── Menu (restaurant only) ── */}
        {tab === 'menu' && (
          <DataTable
            columns={[
              { key: 'name', label: 'Item', render: r => (
                <div>
                  <div style={{ color: t.text, fontWeight: 500 }}>{r.name}</div>
                  {r.description && <div style={{ color: t.textMuted, fontSize: 12 }}>{r.description}</div>}
                </div>
              )},
              { key: 'category', label: 'Category', render: r => <span style={{ color: t.textSecondary }}>{r.category || '—'}</span> },
              { key: 'price', label: 'Price', render: r => <span style={{ color: t.text }}>{r.price ? `${r.price} RWF` : '—'}</span> },
              { key: 'available', label: 'Available', render: r => (
                <Badge color={r.is_available !== false ? t.success : t.danger}>
                  {r.is_available !== false ? 'Yes' : 'No'}
                </Badge>
              )},
            ]}
            rows={menu}
            emptyText="No menu items found."
          />
        )}
      </Card>
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={s.infoValue}>{value}</span>
    </div>
  );
}

const s = {
  header: {
    display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
  },
  headerIcon: {
    width: 48, height: 48, borderRadius: 12,
    background: t.bgCard, border: `1px solid ${t.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: { color: t.text, fontSize: 22, fontWeight: 700, margin: '0 0 4px' },
  headerMeta: { display: 'flex', alignItems: 'center', gap: 14, color: t.textSecondary, fontSize: 13 },

  statGrid: { display: 'flex', gap: 16, flexWrap: 'wrap' },

  overviewGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 },
  infoRow: {
    display: 'flex', flexDirection: 'column', gap: 2,
    padding: '10px 0', borderBottom: `1px solid ${t.border}`,
  },
  infoLabel: { color: t.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { color: t.text, fontSize: 14 },

  toggleBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'transparent', padding: '4px 0', cursor: 'pointer',
  },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'transparent', padding: '5px 8px',
    fontSize: 12, fontWeight: 600,
  },
};
