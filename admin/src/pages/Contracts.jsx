import React, { useEffect, useState, useCallback } from 'react';
import { Plus, ExternalLink, Trash2, X, FileText, CheckCircle } from 'lucide-react';
import { apiFetch, getUser } from '../api';
import { t } from '../theme';
import { PageHeader, Card, DataTable, Badge } from '../components/PageShell';

export default function Contracts() {
  const user = getUser();
  const isDirector = user?.role === 'director';

  const [contracts, setContracts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [selectedUser, setSelectedUser] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const load = useCallback(async () => {
    const [contractData, staffData] = await Promise.all([
      apiFetch('/staff/contracts').catch(() => []),
      isDirector ? apiFetch('/admin/admins').catch(() => []) : Promise.resolve([]),
    ]);
    setContracts(contractData || []);
    setStaffList(staffData || []);
    setLoading(false);
  }, [isDirector]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setSelectedUser(''); setTitle(''); setDescription('');
    setFileUrl(''); setValidFrom(''); setValidUntil('');
    setError(''); setShowForm(true);
  };

  const save = async () => {
    if (!selectedUser || !title.trim() || !fileUrl.trim()) {
      setError('Staff member, title and file URL are required.');
      return;
    }
    setSaving(true); setError('');
    try {
      await apiFetch('/staff/contracts', {
        method: 'POST',
        body: {
          userId: selectedUser,
          title: title.trim(),
          description: description.trim(),
          fileUrl: fileUrl.trim(),
          validFrom: validFrom || null,
          validUntil: validUntil || null,
        },
      });
      setShowForm(false);
      await load();
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const remove = async (contract) => {
    if (!confirm(`Delete contract "${contract.title}"?`)) return;
    await apiFetch(`/staff/contracts/${contract.id}`, { method: 'DELETE' }).catch(() => {});
    await load();
  };

  const statusOf = (c) => {
    if (!c.validUntil) return { label: 'Active', color: t.success };
    const exp = new Date(c.validUntil);
    const now = new Date();
    const daysLeft = Math.ceil((exp - now) / 86400000);
    if (daysLeft < 0) return { label: 'Expired', color: t.danger };
    if (daysLeft <= 30) return { label: `Expires in ${daysLeft}d`, color: t.warning };
    return { label: 'Active', color: t.success };
  };

  if (loading) return <div style={{ padding: 40, color: t.textSecondary }}>Loading...</div>;

  const columns = [
    ...(isDirector ? [{
      key: 'staff', label: 'Staff Member', render: (r) => (
        <div>
          <div style={{ color: t.text, fontWeight: 500 }}>{r.staffName}</div>
          <div style={{ color: t.textMuted, fontSize: 12 }}>{r.staffEmail}</div>
        </div>
      ),
    }] : []),
    { key: 'title', label: 'Contract', render: (r) => (
      <div>
        <div style={{ color: t.text, fontWeight: 500 }}>{r.title}</div>
        {r.description && <div style={{ color: t.textSecondary, fontSize: 12 }}>{r.description}</div>}
      </div>
    )},
    { key: 'period', label: 'Period', render: (r) => (
      <span style={{ color: t.textSecondary, fontSize: 13 }}>
        {r.validFrom ? new Date(r.validFrom).toLocaleDateString() : '—'}
        {r.validUntil ? ` → ${new Date(r.validUntil).toLocaleDateString()}` : ''}
      </span>
    )},
    { key: 'status', label: 'Status', render: (r) => {
      const st = statusOf(r);
      return <Badge color={st.color}>{st.label}</Badge>;
    }},
    { key: 'actions', label: '', width: 100, render: (r) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" style={s.openBtn}>
          <ExternalLink size={13} /> Open
        </a>
        {isDirector && (
          <button onClick={() => remove(r)} style={s.iconBtn} title="Delete">
            <Trash2 size={14} color={t.danger} />
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader
        title={isDirector ? 'Staff Contracts' : 'My Contracts'}
        subtitle={isDirector ? 'Manage employment contracts for all staff' : 'Your contracts on file'}
        actions={isDirector ? (
          <button onClick={openNew} style={s.primaryBtn}>
            <Plus size={16} /> Add Contract
          </button>
        ) : null}
      />

      <Card style={{ marginTop: 24 }}>
        <DataTable columns={columns} rows={contracts} emptyText="No contracts on file." />
      </Card>

      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Add Contract</h2>
              <button onClick={() => setShowForm(false)} style={s.closeBtn}><X size={18} /></button>
            </div>

            {error && <div style={s.error}>{error}</div>}

            <div style={s.field}>
              <label style={s.label}>Staff Member *</label>
              <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} style={{ width: '100%' }}>
                <option value="">— Select staff member —</option>
                {staffList.filter(s => s.role !== 'director').map(m => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} ({m.role})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ ...s.field, marginTop: 12 }}>
              <label style={s.label}>Contract Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Employment Contract 2026" style={{ width: '100%' }} />
            </div>
            <div style={{ ...s.field, marginTop: 12 }}>
              <label style={s.label}>Description (optional)</label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief note" style={{ width: '100%' }} />
            </div>
            <div style={{ ...s.field, marginTop: 12 }}>
              <label style={s.label}>File URL *</label>
              <input
                value={fileUrl} onChange={e => setFileUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                style={{ width: '100%' }}
              />
              <span style={{ color: t.textMuted, fontSize: 12 }}>Google Drive, Dropbox or any shareable link.</span>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <div style={{ ...s.field, flex: 1 }}>
                <label style={s.label}>Valid From</label>
                <input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div style={{ ...s.field, flex: 1 }}>
                <label style={s.label}>Valid Until</label>
                <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>

            <div style={s.modalActions}>
              <button onClick={() => setShowForm(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={save} disabled={saving} style={s.primaryBtn}>
                {saving ? 'Saving...' : 'Add contract'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  primaryBtn: { background: t.accent, color: t.bg, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  cancelBtn: { background: t.bgHover, color: t.text },
  iconBtn: { background: 'transparent', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center' },
  openBtn: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: t.bgActive, color: t.accent,
    padding: '5px 10px', borderRadius: t.radius,
    fontSize: 12, fontWeight: 500, textDecoration: 'none',
  },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  modal: { background: t.bgCard, borderRadius: t.radiusLg, padding: 28, width: '100%', maxWidth: 500 },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { color: t.text, fontSize: 18, fontWeight: 700, margin: 0 },
  closeBtn: { background: 'transparent', color: t.textSecondary, padding: 4, display: 'flex', alignItems: 'center' },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { color: t.textSecondary, fontSize: 13, fontWeight: 500 },
  error: { background: 'rgba(248,113,113,0.12)', color: t.danger, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
};
