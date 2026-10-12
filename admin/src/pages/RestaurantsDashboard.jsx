import React, { useEffect, useState, useMemo } from 'react';
import {
  UtensilsCrossed, Plus, Pencil, Trash2, Eye, MapPin,
  Phone, Star, Clock,
} from 'lucide-react';
import { apiFetch } from '../api';
import { t } from '../theme';
import { PageHeader, StatCard, Card, DataTable, Badge, Tabs } from '../components/PageShell';

export default function RestaurantsDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState('list');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', location: '', district: '', phone: '', website: '', cuisines: '', price_range: '', atmosphere: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [r, b] = await Promise.all([
        apiFetch('/restaurants'),
        apiFetch('/resto-bookings/admin?type=restaurant').catch(() => []),
      ]);
      setRestaurants(r || []);
      setBookings(b || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search) return restaurants;
    const q = search.toLowerCase();
    return restaurants.filter(r => r.name?.toLowerCase().includes(q) || r.location?.toLowerCase().includes(q));
  }, [restaurants, search]);

  const pendingBookings = useMemo(() => bookings.filter(b => b.status === 'pending'), [bookings]);

  const openNew = () => {
    setEditId(null);
    setForm({ name: '', description: '', location: '', district: '', phone: '', website: '', cuisines: '', price_range: '', atmosphere: '' });
    setShowForm(true);
  };

  const openEdit = (r) => {
    setEditId(r.id);
    setForm({
      name: r.name || '', description: r.description || '', location: r.location || '',
      district: r.district || '', phone: r.phone || '', website: r.website || '',
      cuisines: Array.isArray(r.cuisines) ? r.cuisines.join(', ') : r.cuisines || '',
      price_range: r.price_range || '', atmosphere: r.atmosphere || '',
    });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        ...form,
        cuisines: form.cuisines.split(',').map(c => c.trim()).filter(Boolean),
      };
      if (editId) {
        await apiFetch(`/restaurants/${editId}`, { method: 'PUT', body });
      } else {
        await apiFetch('/restaurants', { method: 'POST', body });
      }
      setShowForm(false);
      await load();
    } catch (err) { alert(err.message); }
    setSaving(false);
  };

  const deleteRestaurant = async (id) => {
    if (!confirm('Delete this restaurant?')) return;
    try {
      await apiFetch(`/restaurants/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) { alert(err.message); }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      await apiFetch(`/resto-bookings/${id}/status`, { method: 'PUT', body: { status } });
      await load();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div style={{ padding: 40, color: t.textSecondary }}>Loading...</div>;

  const tabs = [
    { key: 'list', label: 'Restaurants', count: restaurants.length },
    { key: 'bookings', label: 'Bookings', count: bookings.length },
  ];

  return (
    <div>
      <PageHeader
        title="Restaurants"
        subtitle="Manage all restaurants on the platform"
        actions={
          <button onClick={openNew} style={s.primaryBtn}>
            <Plus size={16} /> Add Restaurant
          </button>
        }
      />

      <div style={s.statGrid}>
        <StatCard label="Total" value={restaurants.length} icon={UtensilsCrossed} color={t.accent} />
        <StatCard label="Pending Bookings" value={pendingBookings.length} icon={Clock} color={t.warning} />
      </div>

      <Card style={{ marginTop: 24 }}>
        <Tabs tabs={tabs} active={tab} onChange={setTab} />

        {tab === 'list' && (
          <>
            <input
              placeholder="Search restaurants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 300, marginBottom: 16 }}
            />
            <DataTable
              columns={[
                { key: 'name', label: 'Name', render: (r) => (
                  <div>
                    <div style={{ color: t.text, fontWeight: 500 }}>{r.name}</div>
                    <div style={{ color: t.textMuted, fontSize: 12 }}>
                      <MapPin size={10} style={{ marginRight: 3 }} />{r.location || '—'}
                    </div>
                  </div>
                )},
                { key: 'phone', label: 'Phone', render: (r) => (
                  <span style={{ color: t.textSecondary }}>{r.phone || '—'}</span>
                )},
                { key: 'open_status', label: 'Status', render: (r) => (
                  <Badge color={r.open_status === 'open' ? t.success : t.danger}>{r.open_status || 'closed'}</Badge>
                )},
                { key: 'rating', label: 'Rating', render: (r) => (
                  <span style={{ color: '#FBBF24' }}>
                    <Star size={12} fill="#FBBF24" style={{ marginRight: 3 }} />
                    {r.avg_rating || '—'}
                  </span>
                )},
                { key: 'actions', label: '', width: 100, render: (r) => (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(r)} style={s.iconBtn}><Pencil size={14} color={t.accent} /></button>
                    <button onClick={() => deleteRestaurant(r.id)} style={s.iconBtn}><Trash2 size={14} color={t.danger} /></button>
                  </div>
                )},
              ]}
              rows={filtered}
              emptyText="No restaurants yet."
            />
          </>
        )}

        {tab === 'bookings' && (
          <DataTable
            columns={[
              { key: 'placeName', label: 'Restaurant', render: (r) => (
                <span style={{ color: t.text, fontWeight: 500 }}>{r.placeName || '—'}</span>
              )},
              { key: 'guestName', label: 'Guest', render: (r) => (
                <span style={{ color: t.text }}>{r.guestName || '—'}</span>
              )},
              { key: 'date', label: 'Date', render: (r) => (
                <span style={{ color: t.textSecondary }}>{r.date || '—'}</span>
              )},
              { key: 'partySize', label: 'Guests', render: (r) => r.partySize || '—' },
              { key: 'status', label: 'Status', render: (r) => (
                <Badge color={r.status === 'confirmed' ? t.success : r.status === 'pending' ? t.warning : t.danger}>
                  {r.status}
                </Badge>
              )},
              { key: 'actions', label: '', width: 160, render: (r) => r.status === 'pending' ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => updateBookingStatus(r.id, 'confirmed')} style={{ ...s.smallBtn, color: t.success }}>Confirm</button>
                  <button onClick={() => updateBookingStatus(r.id, 'rejected')} style={{ ...s.smallBtn, color: t.danger }}>Reject</button>
                </div>
              ) : null },
            ]}
            rows={bookings}
            emptyText="No bookings yet."
          />
        )}
      </Card>

      {showForm && (
        <div style={s.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>{editId ? 'Edit Restaurant' : 'Add Restaurant'}</h2>
            <div style={s.formGrid}>
              {['name', 'location', 'district', 'phone', 'website', 'cuisines', 'price_range', 'atmosphere'].map((key) => (
                <div key={key} style={s.field}>
                  <label style={s.label}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                  <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={{ width: '100%' }} />
                </div>
              ))}
              <div style={{ ...s.field, gridColumn: '1 / -1' }}>
                <label style={s.label}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ width: '100%', resize: 'vertical' }} />
              </div>
            </div>
            <div style={s.modalActions}>
              <button onClick={() => setShowForm(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={save} disabled={saving} style={s.primaryBtn}>{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  statGrid: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  primaryBtn: { background: t.accent, color: t.bg, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  cancelBtn: { background: t.bgHover, color: t.text },
  iconBtn: { background: 'transparent', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center' },
  smallBtn: { background: 'transparent', padding: '4px 8px', fontSize: 12, fontWeight: 600 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  modal: { background: t.bgCard, borderRadius: t.radiusLg, padding: 28, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { color: t.text, fontSize: 20, fontWeight: 700, margin: '0 0 20px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { color: t.textSecondary, fontSize: 13, fontWeight: 500, textTransform: 'capitalize' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
};
