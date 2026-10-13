import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pin, PinOff, Trash2, Edit2, X, Check } from 'lucide-react';
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

export default function Announcements() {
  const user = getUser();
  const isDirector = user?.role === 'director';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // announcement being edited

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [visibleTo, setVisibleTo] = useState([]); // empty = all
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/staff/announcements');
      setItems(data || []);
      // Mark all as read
      (data || []).filter(a => !a.isRead).forEach(a => {
        apiFetch(`/staff/announcements/${a.id}/read`, { method: 'POST' }).catch(() => {});
      });
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null); setTitle(''); setBody(''); setPinned(false); setVisibleTo([]);
    setError(''); setShowForm(true);
  };

  const openEdit = (ann) => {
    setEditing(ann);
    setTitle(ann.title); setBody(ann.body); setPinned(ann.pinned);
    setVisibleTo(ann.visibleTo || []);
    setError(''); setShowForm(true);
  };

  const save = async () => {
    if (!title.trim() || !body.trim()) { setError('Title and body are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { title: title.trim(), body: body.trim(), pinned, visibleTo: visibleTo.length ? visibleTo : null };
      if (editing) {
        await apiFetch(`/staff/announcements/${editing.id}`, { method: 'PATCH', body: payload });
      } else {
        await apiFetch('/staff/announcements', { method: 'POST', body: payload });
      }
      setShowForm(false);
      await load();
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const remove = async (ann) => {
    if (!confirm(`Delete "${ann.title}"?`)) return;
    await apiFetch(`/staff/announcements/${ann.id}`, { method: 'DELETE' }).catch(() => {});
    await load();
  };

  const toggleRole = (key) => {
    setVisibleTo(prev => prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key]);
  };

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="Notices from the director to all staff"
        actions={isDirector ? (
          <button onClick={openNew} style={s.primaryBtn}>
            <Plus size={16} /> New Announcement
          </button>
        ) : null}
      />

      <Card style={{ marginTop: 8 }}>
        {loading && <div style={s.muted}>Loading...</div>}
        {!loading && !items.length && <div style={s.muted}>No announcements yet.</div>}

        {items.map((ann) => (
          <div key={ann.id} style={{ ...s.annRow, ...(ann.pinned ? s.pinnedRow : {}) }}>
            <div style={s.annMain}>
              <div style={s.annHeader}>
                <div style={s.annTitleRow}>
                  {ann.pinned && <Pin size={13} color={t.accent} />}
                  {!ann.isRead && <div style={s.unreadDot} />}
                  <span style={s.annTitle}>{ann.title}</span>
                </div>
                {isDirector && (
                  <div style={s.annActions}>
                    <button onClick={() => openEdit(ann)} style={s.iconBtn} title="Edit">
                      <Edit2 size={14} color={t.textSecondary} />
                    </button>
                    <button onClick={() => remove(ann)} style={s.iconBtn} title="Delete">
                      <Trash2 size={14} color={t.danger} />
                    </button>
                  </div>
                )}
              </div>
              <p style={s.annBody}>{ann.body}</p>
              <div style={s.annMeta}>
                <span>{ann.createdByName}</span>
                <span>·</span>
                <span>{new Date(ann.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {ann.visibleTo?.length ? (
                  <span style={s.audiencePill}>
                    {ann.visibleTo.join(', ')} only
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </Card>

      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>{editing ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button onClick={() => setShowForm(false)} style={s.closeBtn}><X size={18} /></button>
            </div>

            {error && <div style={s.error}>{error}</div>}

            <div style={s.field}>
              <label style={s.label}>Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Team meeting Thursday" style={{ width: '100%' }} />
            </div>
            <div style={{ ...s.field, marginTop: 12 }}>
              <label style={s.label}>Message</label>
              <textarea
                value={body} onChange={e => setBody(e.target.value)}
                placeholder="Write the full announcement here..."
                rows={5}
                style={{ width: '100%', resize: 'vertical', background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: t.radius, color: t.text, padding: '8px 12px', fontSize: 14, fontFamily: t.font }}
              />
            </div>

            <div style={{ ...s.field, marginTop: 12 }}>
              <label style={s.label}>Visible to</label>
              <div style={s.roleGrid}>
                {ROLE_OPTIONS.map(r => (
                  <button
                    key={r.key}
                    onClick={() => toggleRole(r.key)}
                    style={{ ...s.roleChip, ...(visibleTo.includes(r.key) ? s.roleChipActive : {}) }}
                  >
                    {visibleTo.includes(r.key) ? <Check size={12} /> : null}
                    {r.label}
                  </button>
                ))}
                <button
                  onClick={() => setVisibleTo([])}
                  style={{ ...s.roleChip, ...(!visibleTo.length ? s.roleChipActive : {}) }}
                >
                  {!visibleTo.length ? <Check size={12} /> : null}
                  All staff
                </button>
              </div>
            </div>

            <div style={s.pinRow}>
              <input type="checkbox" id="pin" checked={pinned} onChange={e => setPinned(e.target.checked)} />
              <label htmlFor="pin" style={{ color: t.textSecondary, fontSize: 13, cursor: 'pointer' }}>
                Pin to top
              </label>
            </div>

            <div style={s.modalActions}>
              <button onClick={() => setShowForm(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={save} disabled={saving} style={s.primaryBtn}>
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Post'}
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
  muted: { color: t.textMuted, fontSize: 14, padding: '20px 0' },

  annRow: {
    padding: '16px 0', borderBottom: `1px solid ${t.border}`,
  },
  pinnedRow: { background: 'rgba(56,189,248,0.04)', margin: '0 -20px', padding: '16px 20px' },
  annMain: {},
  annHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  annTitleRow: { display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 },
  unreadDot: { width: 8, height: 8, borderRadius: '50%', background: t.accent, flexShrink: 0 },
  annTitle: { color: t.text, fontSize: 15, fontWeight: 600 },
  annActions: { display: 'flex', gap: 4, flexShrink: 0 },
  annBody: { color: t.textSecondary, fontSize: 14, lineHeight: 1.6, margin: '8px 0', whiteSpace: 'pre-wrap' },
  annMeta: { display: 'flex', alignItems: 'center', gap: 6, color: t.textMuted, fontSize: 12 },
  audiencePill: {
    background: t.bgHover, color: t.textSecondary,
    padding: '2px 8px', borderRadius: 20, fontSize: 11,
  },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  modal: { background: t.bgCard, borderRadius: t.radiusLg, padding: 28, width: '100%', maxWidth: 520 },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { color: t.text, fontSize: 18, fontWeight: 700, margin: 0 },
  closeBtn: { background: 'transparent', color: t.textSecondary, padding: 4, display: 'flex', alignItems: 'center' },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { color: t.textSecondary, fontSize: 13, fontWeight: 500 },
  error: { background: 'rgba(248,113,113,0.12)', color: t.danger, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 },
  roleGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  roleChip: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '5px 12px', borderRadius: 20,
    background: t.bgHover, color: t.textSecondary,
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    border: `1px solid ${t.border}`,
  },
  roleChipActive: { background: t.bgActive, color: t.accent, borderColor: t.accent },
  pinRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
};
