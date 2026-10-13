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
  // "create account" mode — shown after ACCOUNT_NOT_FOUND
  const [needsCreate, setNeedsCreate] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/admin/admins');
      setAdmins(data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetModal = () => {
    setShowAssign(false);
    setEmail('');
    setRole('news');
    setError('');
    setNeedsCreate(false);
    setFirstName('');
    setLastName('');
    setPassword('');
  };

  const assignRole = async () => {
    setError('');
    setSaving(true);
    try {
      const body = { email: email.trim(), role };
      if (needsCreate) {
        body.firstName = firstName.trim();
        body.lastName = lastName.trim();
        body.password = password;
      }
      const result = await apiFetch('/admin/assign-role', { method: 'POST', body });
      resetModal();
      await load();
      if (result.created) {
        alert(`Account created for ${result.email} with role "${result.role}". Share the temporary password with them.`);
      }
    } catch (err) {
      // Server returned ACCOUNT_NOT_FOUND — switch to create-account mode.
      if (err.code === 'ACCOUNT_NOT_FOUND' || (err.message && err.message.includes('ACCOUNT_NOT_FOUND'))) {
        setNeedsCreate(true);
        setError('');
      } else {
        setError(err.message);
      }
    }
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
        <div style={s.modalOverlay} onClick={resetModal}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>{needsCreate ? 'Create Account & Assign Role' : 'Assign Admin Role'}</h2>
            <p style={{ color: t.textSecondary, fontSize: 13, marginBottom: 16 }}>
              {needsCreate
                ? `No account found for ${email}. Fill in their details to create one and assign the role in one step.`
                : 'Enter the person\'s email and select a role to assign.'}
            </p>

            {error && <div style={s.error}>{error}</div>}

            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input
                type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setNeedsCreate(false); setError(''); }}
                placeholder="user@example.com"
                style={{ width: '100%' }}
                disabled={needsCreate}
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

            {needsCreate && (
              <>
                <div style={s.divider} />
                <p style={{ color: t.textMuted, fontSize: 12, marginBottom: 12 }}>
                  Account details — share the password with the person after creating.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ ...s.field, flex: 1 }}>
                    <label style={s.label}>First name *</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Jean"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ ...s.field, flex: 1 }}>
                    <label style={s.label}>Last name</label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Uwimana"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                <div style={{ ...s.field, marginTop: 12 }}>
                  <label style={s.label}>Temporary password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      style={{ width: '100%', paddingRight: 80 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: t.textSecondary, cursor: 'pointer', fontSize: 12, padding: 0 }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div style={s.modalActions}>
              <button onClick={resetModal} style={s.cancelBtn}>Cancel</button>
              <button
                onClick={assignRole}
                disabled={saving || !email.trim() || (needsCreate && (!firstName.trim() || !password.trim()))}
                style={s.primaryBtn}
              >
                {saving
                  ? (needsCreate ? 'Creating...' : 'Assigning...')
                  : (needsCreate ? 'Create account & assign' : 'Assign role')}
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
  divider: { borderTop: `1px solid ${t.border}`, margin: '16px 0' },
};
