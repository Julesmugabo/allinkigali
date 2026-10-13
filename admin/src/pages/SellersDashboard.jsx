import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Store, Clock, Check, X, ToggleLeft, ToggleRight,
  Truck, MapPin, Phone, ChevronDown, ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { t } from '../theme';
import { PageHeader, StatCard, Card, DataTable, Badge, Tabs } from '../components/PageShell';
import { useClient } from '../context/ClientContext';

const STATUS_COLOR = {
  open: t.success, closed: t.danger, pending: t.warning,
  approved: t.success, declined: t.danger,
};

export default function SellersDashboard() {
  const { enterClient } = useClient();
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [actionId, setActionId] = useState(null);

  const openClientDashboard = (type, id, name) => {
    enterClient(type, id, name);
    navigate('/client-dashboard');
  };

  const loadAll = useCallback(async () => {
    try {
      const [p, pend] = await Promise.all([
        apiFetch('/admin/restaurants-list'),
        apiFetch('/pending-listings').catch(() => []),
      ]);
      setPlaces(p || []);
      setPending(pend || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const restaurants = useMemo(() => places.filter(p => p.type === 'restaurant'), [places]);
  const coffeeShops = useMemo(() => places.filter(p => p.type === 'coffeeshop'), [places]);
  const deliveryEnabled = useMemo(() => restaurants.filter(r => r.delivery_enabled), [restaurants]);

  const handleListingAction = async (id, action) => {
    setActionId(id);
    try {
      await apiFetch(`/pending-listings/${id}/${action}`, { method: 'POST' });
      await loadAll();
    } catch (err) { alert(err.message); }
    setActionId(null);
  };

  const toggleField = async (place, field, value) => {
    setActionId(place.id);
    try {
      const endpoint = place.type === 'restaurant'
        ? `/admin/restaurants/${place.id}`
        : `/admin/coffee-shops/${place.id}`;
      await apiFetch(endpoint, { method: 'PATCH', body: { [field]: value } });
      await loadAll();
    } catch (err) { alert(err.message); }
    setActionId(null);
  };

  if (loading) return <div style={{ padding: 40, color: t.textSecondary }}>Loading...</div>;

  const tabs = [
    { key: 'pending', label: 'Pending', count: pending.length },
    { key: 'restaurants', label: 'Restaurants', count: restaurants.length },
    { key: 'coffeeShops', label: 'Coffee Shops', count: coffeeShops.length },
    { key: 'deliveries', label: 'Deliveries', count: deliveryEnabled.length },
  ];

  return (
    <div>
      <PageHeader title="Sales Partners" subtitle="Manage restaurants, coffee shops, and listings" />

      <div style={s.statGrid}>
        <StatCard label="Pending" value={pending.length} icon={Clock} color={t.warning} />
        <StatCard label="Restaurants" value={restaurants.length} icon={Store} color={t.accent} />
        <StatCard label="Coffee Shops" value={coffeeShops.length} icon={Store} color="#A78BFA" />
        <StatCard label="Delivery" value={deliveryEnabled.length} icon={Truck} color={t.success} />
      </div>

      <Card style={{ marginTop: 24 }}>
        <Tabs tabs={tabs} active={tab} onChange={setTab} />

        {tab === 'pending' && (
          <DataTable
            columns={[
              { key: 'business_name', label: 'Business Name', render: (r) => (
                <div>
                  <div style={{ color: t.text, fontWeight: 500 }}>{r.business_name}</div>
                  <div style={{ color: t.textMuted, fontSize: 12 }}>{r.listing_type}</div>
                </div>
              )},
              { key: 'location', label: 'Location', render: (r) => (
                <span style={{ color: t.textSecondary }}><MapPin size={12} style={{ marginRight: 4 }} />{r.location || '—'}</span>
              )},
              { key: 'phone', label: 'Phone', render: (r) => (
                <span style={{ color: t.textSecondary }}>{r.phone || '—'}</span>
              )},
              { key: 'status', label: 'Status', render: (r) => (
                <Badge color={STATUS_COLOR[r.status]}>{r.status}</Badge>
              )},
              { key: 'actions', label: '', width: 140, render: (r) => r.status === 'pending' ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleListingAction(r.id, 'approve')}
                    disabled={actionId === r.id}
                    style={{ ...s.actionBtn, background: `${t.success}20`, color: t.success }}
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    onClick={() => handleListingAction(r.id, 'decline')}
                    disabled={actionId === r.id}
                    style={{ ...s.actionBtn, background: `${t.danger}20`, color: t.danger }}
                  >
                    <X size={14} /> Decline
                  </button>
                </div>
              ) : null },
            ]}
            rows={pending}
            emptyText="No pending listings."
          />
        )}

        {tab === 'restaurants' && (
          <DataTable
            columns={[
              { key: 'name', label: 'Name', render: (r) => (
                <div>
                  <div style={{ color: t.text, fontWeight: 500 }}>{r.name}</div>
                  <div style={{ color: t.textMuted, fontSize: 12 }}>{r.location || '—'}</div>
                </div>
              )},
              { key: 'phone', label: 'Phone', render: (r) => (
                <span style={{ color: t.textSecondary }}>{r.phone || '—'}</span>
              )},
              { key: 'open_status', label: 'Status', render: (r) => (
                <button
                  onClick={() => toggleField(r, 'open_status', r.open_status === 'open' ? 'closed' : 'open')}
                  disabled={actionId === r.id}
                  style={s.toggleBtn}
                >
                  {r.open_status === 'open'
                    ? <><ToggleRight size={18} color={t.success} /> <span style={{ color: t.success }}>Open</span></>
                    : <><ToggleLeft size={18} color={t.danger} /> <span style={{ color: t.danger }}>Closed</span></>
                  }
                </button>
              )},
              { key: 'delivery', label: 'Delivery', render: (r) => (
                <button
                  onClick={() => toggleField(r, 'delivery_enabled', !r.delivery_enabled)}
                  disabled={actionId === r.id}
                  style={s.toggleBtn}
                >
                  {r.delivery_enabled
                    ? <><ToggleRight size={18} color={t.success} /> <span style={{ color: t.success }}>On</span></>
                    : <><ToggleLeft size={18} color={t.textMuted} /> <span style={{ color: t.textMuted }}>Off</span></>
                  }
                </button>
              )},
              { key: 'manage', label: '', width: 140, render: (r) => (
                <button
                  onClick={() => openClientDashboard('restaurant', r.id, r.name)}
                  style={s.openDashBtn}
                >
                  <ExternalLink size={13} /> Open Dashboard
                </button>
              )},
            ]}
            rows={restaurants}
            emptyText="No restaurants yet."
          />
        )}

        {tab === 'coffeeShops' && (
          <DataTable
            columns={[
              { key: 'name', label: 'Name', render: (r) => (
                <div>
                  <div style={{ color: t.text, fontWeight: 500 }}>{r.name}</div>
                  <div style={{ color: t.textMuted, fontSize: 12 }}>{r.location || '—'}</div>
                </div>
              )},
              { key: 'phone', label: 'Phone', render: (r) => (
                <span style={{ color: t.textSecondary }}>{r.phone || '—'}</span>
              )},
              { key: 'open_status', label: 'Status', render: (r) => (
                <button
                  onClick={() => toggleField(r, 'open_status', r.open_status === 'open' ? 'closed' : 'open')}
                  disabled={actionId === r.id}
                  style={s.toggleBtn}
                >
                  {r.open_status === 'open'
                    ? <><ToggleRight size={18} color={t.success} /> <span style={{ color: t.success }}>Open</span></>
                    : <><ToggleLeft size={18} color={t.danger} /> <span style={{ color: t.danger }}>Closed</span></>
                  }
                </button>
              )},
              { key: 'manage', label: '', width: 140, render: (r) => (
                <button
                  onClick={() => openClientDashboard('coffeeshop', r.id, r.name)}
                  style={s.openDashBtn}
                >
                  <ExternalLink size={13} /> Open Dashboard
                </button>
              )},
            ]}
            rows={coffeeShops}
            emptyText="No coffee shops yet."
          />
        )}

        {tab === 'deliveries' && (
          <DataTable
            columns={[
              { key: 'name', label: 'Restaurant', render: (r) => (
                <div style={{ color: t.text, fontWeight: 500 }}>{r.name}</div>
              )},
              { key: 'delivery_fee', label: 'Fee', render: (r) => (
                <span style={{ color: t.text }}>{r.delivery_fee ? `${r.delivery_fee} RWF` : '—'}</span>
              )},
              { key: 'estimated_time', label: 'Est. Time', render: (r) => (
                <span style={{ color: t.textSecondary }}>{r.estimated_time || '—'}</span>
              )},
              { key: 'delivery_enabled', label: 'Enabled', render: (r) => (
                <button
                  onClick={() => toggleField(r, 'delivery_enabled', !r.delivery_enabled)}
                  disabled={actionId === r.id}
                  style={s.toggleBtn}
                >
                  {r.delivery_enabled
                    ? <><ToggleRight size={18} color={t.success} /> <span style={{ color: t.success }}>On</span></>
                    : <><ToggleLeft size={18} color={t.textMuted} /> <span style={{ color: t.textMuted }}>Off</span></>
                  }
                </button>
              )},
            ]}
            rows={restaurants}
            emptyText="No restaurants with delivery."
          />
        )}
      </Card>
    </div>
  );
}

const s = {
  statGrid: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
    background: 'transparent',
  },
  toggleBtn: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'transparent', padding: '4px 0', fontSize: 13,
  },
  openDashBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: t.bgActive, color: t.accent,
    padding: '6px 10px', borderRadius: 8,
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: `1px solid ${t.accent}30`,
    whiteSpace: 'nowrap',
  },
};
