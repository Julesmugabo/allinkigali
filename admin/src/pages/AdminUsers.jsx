import React, { useEffect, useState, useCallback } from 'react';
import { Users, UserPlus, Shield, Trash2 } from 'lucide-react';
import { apiFetch } from '../api';
import { t } from '../theme';
import { PageHeader, StatCard, Card, DataTable, Badge } from '../components/PageShell';

const ASSIGNABLE_ROLES = [
  { key: 'news', label: 'News admin' },
  { key: 'sellers', label: 'Sellers admin' },
  { key: 'restaurant', label: 'Restaurant admin' },
  { key: 'coffeeshop', label: 'Coffee Shop admin' },
  { key: 'finance', label: 'Finance officer' },
];

const ROLE_COLORS = {
  director: '#F59E0B', news: t.accent, sellers: t.success,
  restaurant: '#FB923C', coffeeshop: '#A78BFA', finance: '#EC4899',
};

export default function AdminUsers() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('news');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/admin/admins');
      setAdmins(data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const assignRole = async () => {
    setError('');
    setSaving(true);
    try {
      await apiFetch('/admin/assign-role', { method: 'POST', body: { email: email.trim(), role } });
      setShowAssign(false);
      setEmail('');
      await load();
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const revokeRole = async (admin) => {
    if (admin.role === 'director') {
      alert('Cannot revoke director role through the app.');
      return;
    }
    if (!confirm(`Revoke ${admin.role} role from ${admin.email}?`)) return;
    try {
      await apiFetch('/admin/assign-role', { method: 'POST', body: { email: admin.email, role: null } });
      await load();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div style={{ padding: 40, color: t.textSecondary }}>Loading...</div>;

  return (
    <div>
      <PageHeader
        title="Admin Users"
        subtitle="Manage who has access to admin dashboards"
        actions={
          <button onClick={() => setShowAssign(true)} style={s.primaryBtn}>
            <UserPlus size={16} /> Assign Role
          </button>
        }
      />

      <div style={s.statGrid}>
        <StatCard label="Total Admins" value={admins.length} icon={Users} color={t.accent} />
        <StatCard label="Directors" value={admins.filter(a => a.role === 'director').length} icon={Shield} color="#F59E0B" />
      </div>

      <Card style={{ marginTop: 24 }}>
        <DataTable
          columns={[
            { key: 'name', label: 'Name', render: (r) => (
              <div>
                <div style={{ color: t.text, fontWeight: 500 }}>{r.firstName} {r.lastName}</div>
                <div style={{ color: t.textMuted, fontSize: 12 }}>{r.email}</div>
              </div>
            )},
            { key: 'role', label: 'Role', render: (r) => (
              <Badge color={ROLE_COLORS[r.role] || t.accent}>{r.role}</Badge>
            )},
            { key: 'createdAt', label: 'Joined', render: (r) => (
              <span style={{ color: t.textSecondary, fontSize: 13 }}>
                {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
              </span>
            )},
            { key: 'actions', label: '', width: 60, render: (r) => r.role !== 'director' ? (
              <button onClick={() => revokeRole(r)} style={s.iconBtn} title="Revoke role">
                <Trash2 size={14} color={t.danger} />
              </button>
            ) : null },
          ]}
          rows={admins}
          emptyText="No admin users."
        />
      </Card>

      {showAssign && (
        <div style={s.modalOverlay} onClick={() => setShowAssign(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Assign Admin Role</h2>
            <p style={{ color: t.textSecondary, fontSize: 13, marginBottom: 16 }}>
              The user must already have an account. Enter their email and select a role.
            </p>

            {error && <div style={s.error}>{error}</div>}

            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ ...s.field, marginTop: 12 }}>
              <label style={s.label}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%' }}>
                {ASSIGNABLE_ROLES.map(r => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </div>

            <div style={s.modalActions}>
              <button onClick={() => setShowAssign(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={assignRole} disabled={saving || !email.trim()} style={s.primaryBtn}>
                {saving ? 'Assigning...' : 'Assign'}
              </button>
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
  error: { background: 'rgba(248,113,113,0.12)', color: t.danger, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  modal: { background: t.bgCard, borderRadius: t.radiusLg, padding: 28, width: '100%', maxWidth: 440 },
  modalTitle: { color: t.text, fontSize: 20, fontWeight: 700, margin: '0 0 8px' },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { color: t.textSecondary, fontSize: 13, fontWeight: 500 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
};
