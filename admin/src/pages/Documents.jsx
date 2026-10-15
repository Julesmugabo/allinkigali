import React, { useEffect, useState, useCallback } from 'react';
import { Plus, ExternalLink, Trash2, X, FileText, Link as LinkIcon, Sheet } from 'lucide-react';
import { apiFetch, getUser } from '../api';
import { t } from '../theme';
import { PageHeader, Card } from '../components/PageShell';

const ROLE_OPTIONS = [
  { key: 'news', label: 'News' },
  { key: 'sellers', label: 'Sales Partners' },
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'coffeeshop', label: 'Coffee Shop' },
  { key: 'finance', label: 'Finance' },
];

const FILE_TYPES = [
  { key: 'pdf',   label: 'PDF',        icon: FileText },
  { key: 'doc',   label: 'Word Doc',   icon: FileText },
  { key: 'sheet', label: 'Spreadsheet',icon: Sheet },
  { key: 'link',  label: 'Link',       icon: LinkIcon },
];

const TYPE_COLORS = {
  pdf:   '#F87171',
  doc:   '#91D51F',
  sheet: '#91D51F',
  link:  '#E6B92E',
};

export default function Documents() {
  const user = getUser();
  const isDirector = user?.role === 'director';

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('pdf');
  const [visibleTo, setVisibleTo] = useState([]);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/staff/documents');
      setDocs(data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setTitle(''); setDescription(''); setFileUrl('');
    setFileType('pdf'); setVisibleTo([]); setError('');
    setShowForm(true);
  };

  const save = async () => {
    if (!title.trim() || !fileUrl.trim()) { setError('Title and URL are required.'); return; }
    setSaving(true); setError('');
    try {
      await apiFetch('/staff/documents', {
        method: 'POST',
        body: { title: title.trim(), description: description.trim(), fileUrl: fileUrl.trim(), fileType, visibleTo: visibleTo.length ? visibleTo : null },
      });
      setShowForm(false);
      await load();
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const remove = async (doc) => {
    if (!confirm(`Remove "${doc.title}"?`)) return;
    await apiFetch(`/staff/documents/${doc.id}`, { method: 'DELETE' }).catch(() => {});
    await load();
  };

  const toggleRole = (key) => {
    setVisibleTo(prev => prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key]);
  };

  return (
    <div>
      <PageHeader
        title="Shared Documents"
        subtitle="Files and links shared with staff by the director"
        actions={isDirector ? (
          <button onClick={openNew} style={s.primaryBtn}>
            <Plus size={16} /> Add Document
          </button>
        ) : null}
      />

      {loading && <div style={s.muted}>Loading...</div>}
      {!loading && !docs.length && (
        <div style={s.emptyState}>
          <FileText size={40} color={t.textMuted} />
          <p style={{ color: t.textMuted, marginTop: 12 }}>No documents shared yet.</p>
        </div>
      )}

      <div style={s.grid}>
        {docs.map(doc => {
          const color = TYPE_COLORS[doc.fileType] || TYPE_COLORS.link;
          return (
            <div key={doc.id} style={s.card}>
              <div style={{ ...s.typeTag, background: color + '20', color }}>
                {doc.fileType?.toUpperCase() || 'LINK'}
              </div>
              <div style={s.cardTitle}>{doc.title}</div>
              {doc.description && <div style={s.cardDesc}>{doc.description}</div>}
              <div style={s.cardMeta}>
                {doc.createdByName} · {new Date(doc.createdAt).toLocaleDateString()}
              </div>
              {doc.visibleTo?.length ? (
                <div style={s.audiencePill}>{doc.visibleTo.join(', ')} only</div>
              ) : null}
              <div style={s.cardActions}>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={s.openBtn}>
                  <ExternalLink size={14} /> Open
                </a>
                {isDirector && (
                  <button onClick={() => remove(doc)} style={s.removeBtn}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Add Document</h2>
              <button onClick={() => setShowForm(false)} style={s.closeBtn}><X size={18} /></button>
            </div>

            {error && <div style={s.error}>{error}</div>}

            <div style={s.field}>
              <label style={s.label}>Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Staff Handbook 2026" style={{ width: '100%' }} />
            </div>
            <div style={{ ...s.field, marginTop: 12 }}>
              <label style={s.label}>Description (optional)</label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief note about this file" style={{ width: '100%' }} />
            </div>
            <div style={{ ...s.field, marginTop: 12 }}>
              <label style={s.label}>File URL</label>
              <input
                value={fileUrl} onChange={e => setFileUrl(e.target.value)}
                placeholder="https://drive.google.com/... or any link"
                style={{ width: '100%' }}
              />
              <span style={{ color: t.textMuted, fontSize: 12 }}>Paste a Google Drive, Dropbox or any public link.</span>
            </div>
            <div style={{ ...s.field, marginTop: 12 }}>
              <label style={s.label}>Type</label>
              <div style={s.typeRow}>
                {FILE_TYPES.map(ft => (
                  <button
                    key={ft.key}
                    onClick={() => setFileType(ft.key)}
                    style={{ ...s.typeChip, ...(fileType === ft.key ? s.typeChipActive : {}) }}
                  >
                    {ft.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ ...s.field, marginTop: 12 }}>
              <label style={s.label}>Visible to (leave blank for all staff)</label>
              <div style={s.roleGrid}>
                {ROLE_OPTIONS.map(r => (
                  <button
                    key={r.key}
                    onClick={() => toggleRole(r.key)}
                    style={{ ...s.roleChip, ...(visibleTo.includes(r.key) ? s.roleChipActive : {}) }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={s.modalActions}>
              <button onClick={() => setShowForm(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={save} disabled={saving} style={s.primaryBtn}>
                {saving ? 'Saving...' : 'Add document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  primaryBtn: { background: t.accent, color: t.onAccent, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  cancelBtn: { background: t.bgHover, color: t.text },
  muted: { color: t.textMuted, fontSize: 14, padding: '20px 0' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginTop: 24 },
  card: {
    background: t.bgCard, borderRadius: t.radiusLg,
    border: `1px solid ${t.border}`, padding: 20,
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  typeTag: { fontSize: 11, fontWeight: 700, letterSpacing: 0.5, padding: '3px 8px', borderRadius: 6, alignSelf: 'flex-start' },
  cardTitle: { color: t.text, fontSize: 14, fontWeight: 600 },
  cardDesc: { color: t.textSecondary, fontSize: 13, lineHeight: 1.4 },
  cardMeta: { color: t.textMuted, fontSize: 12 },
  audiencePill: { color: t.textSecondary, fontSize: 11, background: t.bgHover, padding: '2px 8px', borderRadius: 20, alignSelf: 'flex-start' },
  cardActions: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 },
  openBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: t.bgActive, color: t.inkAccent,
    padding: '6px 12px', borderRadius: t.radius,
    fontSize: 13, fontWeight: 500, textDecoration: 'none', flex: 1, justifyContent: 'center',
  },
  removeBtn: { background: 'transparent', color: t.inkStatus || t.danger, padding: 6, borderRadius: t.radius, display: 'flex', alignItems: 'center' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(17,17,17,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  modal: { background: t.bgCard, borderRadius: t.radiusLg, padding: 28, width: '100%', maxWidth: 500 },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { color: t.text, fontSize: 18, fontWeight: 700, margin: 0 },
  closeBtn: { background: 'transparent', color: t.textSecondary, padding: 4, display: 'flex', alignItems: 'center' },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { color: t.textSecondary, fontSize: 13, fontWeight: 500 },
  error: { background: 'rgba(248,113,113,0.12)', color: t.inkStatus || t.danger, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 },
  typeRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  typeChip: { padding: '5px 12px', borderRadius: 20, background: t.bgHover, color: t.textSecondary, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `1px solid ${t.border}` },
  typeChipActive: { background: t.bgActive, color: t.inkAccent, borderColor: t.accent },
  roleGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  roleChip: { padding: '5px 12px', borderRadius: 20, background: t.bgHover, color: t.textSecondary, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `1px solid ${t.border}` },
  roleChipActive: { background: t.bgActive, color: t.inkAccent, borderColor: t.accent },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
};
