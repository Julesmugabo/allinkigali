import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  FileText, Eye, Clock, Archive, Pencil, Trash2, Check, X,
  Plus, Star, Zap, Bold, Italic, Heading, List, Link2, Upload,
  ArchiveRestore, AlertTriangle,
} from 'lucide-react';
import { apiFetch, getToken } from '../api';
import { t } from '../theme';
import { PageHeader, StatCard, Card, DataTable, Badge, Tabs } from '../components/PageShell';

const API_URL = import.meta.env.VITE_API_URL;

const STATUS_COLORS = {
  published: t.success, draft: t.warning, pending: '#F59E0B', archived: t.textMuted,
};

// Google Images (and similar) inline their result thumbnails as data: URLs,
// so "Copy image address" on a search result yields a ~200px preview instead
// of a link to the real photo.
const isEmbeddedPreview = (url) => typeof url === 'string' && url.trim().startsWith('data:');

export default function NewsDashboard() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState({
    title: '', body: '', category: '', source: '', sourceUrl: '',
    imageUrl: '', status: 'draft', isBreaking: false,
  });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const bodyRef = useRef(null);
  const fileRef = useRef(null);

  async function load() {
    try {
      const [arts, cats] = await Promise.all([
        apiFetch('/news/articles'),
        apiFetch('/news/categories'),
      ]);
      setArticles(arts || []);
      setCategories(cats || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const published = articles.filter(a => a.status === 'published' && !a.isArchived).length;
    const drafts = articles.filter(a => a.status === 'draft').length;
    const pending = articles.filter(a => a.status === 'pending').length;
    const archived = articles.filter(a => a.isArchived).length;
    const breaking = articles.filter(a => a.isBreaking).length;
    return { total: articles.length, published, drafts, pending, archived, breaking };
  }, [articles]);

  const filtered = useMemo(() => {
    let list = articles;
    if (tab === 'published') list = list.filter(a => a.status === 'published' && !a.isArchived);
    else if (tab === 'drafts') list = list.filter(a => a.status === 'draft');
    else if (tab === 'pending') list = list.filter(a => a.status === 'pending');
    else if (tab === 'archived') list = list.filter(a => a.isArchived);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => a.title?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q));
    }
    return list;
  }, [articles, tab, search]);

  const openNew = () => {
    setEditId(null);
    setForm({
      title: '', body: '', category: categories[0]?.key || '',
      source: '', sourceUrl: '', imageUrl: '', status: 'draft', isBreaking: false,
    });
    setShowEditor(true);
  };

  const openEdit = (art) => {
    setEditId(art.id);
    setForm({
      title: art.title || '', body: art.body || '', category: art.category || '',
      source: art.source || '', sourceUrl: art.sourceUrl || '',
      imageUrl: art.imageUrl || '', status: art.status || 'draft',
      isBreaking: art.isBreaking || false,
    });
    setShowEditor(true);
  };

  const save = async () => {
    if (!form.title.trim()) { alert('Title is required.'); return; }
    if (!form.category) { alert('Select a category.'); return; }
    if (isEmbeddedPreview(form.imageUrl)) {
      alert('The cover image is a small search-page preview, not the real photo. Replace it with the full image link or upload the photo.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (form.status === 'published' && !editId) {
        payload.publishedAt = new Date().toISOString();
      }
      if (editId) {
        await apiFetch(`/news/articles/${editId}`, { method: 'PATCH', body: payload });
      } else {
        await apiFetch('/news/articles', { method: 'POST', body: payload });
      }
      setShowEditor(false);
      await load();
    } catch (err) { alert(err.message); }
    setSaving(false);
  };

  const deleteArticle = async (id) => {
    if (!confirm('Delete this article?')) return;
    try {
      await apiFetch(`/news/articles/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) { alert(err.message); }
  };

  const toggleFeatured = async (art) => {
    try {
      await apiFetch(`/news/articles/${art.id}`, {
        method: 'PATCH',
        body: { isFeatured: !art.isFeatured },
      });
      await load();
    } catch (err) { alert(err.message); }
  };

  const toggleBreaking = async (art) => {
    try {
      await apiFetch(`/news/articles/${art.id}`, {
        method: 'PATCH',
        body: { isBreaking: !art.isBreaking },
      });
      await load();
    } catch (err) { alert(err.message); }
  };

  const toggleArchive = async (art) => {
    try {
      await apiFetch(`/news/articles/${art.id}`, {
        method: 'PATCH',
        body: { isArchived: !art.isArchived },
      });
      await load();
    } catch (err) { alert(err.message); }
  };

  const approveArticle = async (art) => {
    try {
      await apiFetch(`/news/articles/${art.id}`, {
        method: 'PATCH',
        body: { status: 'published', publishedAt: new Date().toISOString() },
      });
      await load();
    } catch (err) { alert(err.message); }
  };

  // Rich text helpers — wrap selected text in the textarea
  const wrapSelection = (before, after) => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = form.body;
    const selected = text.substring(start, end);
    const newText = text.substring(0, start) + before + selected + after + text.substring(end);
    setForm({ ...form, body: newText });
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertAtCursor = (text) => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const newText = form.body.substring(0, start) + text + form.body.substring(start);
    setForm({ ...form, body: newText });
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  // Upload image file
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = getToken();
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm(f => ({ ...f, imageUrl: data.url }));
    } catch (err) { alert(err.message); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  if (loading) return <div style={{ padding: 40, color: t.textSecondary }}>Loading...</div>;

  const tabs = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'published', label: 'Published', count: stats.published },
    { key: 'drafts', label: 'Drafts', count: stats.drafts },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'archived', label: 'Archived', count: stats.archived },
  ];

  return (
    <div>
      <PageHeader
        title="News Dashboard"
        subtitle="Manage articles, categories, and stories"
        actions={
          <button onClick={openNew} style={s.primaryBtn}>
            <Plus size={16} /> New Article
          </button>
        }
      />

      <div style={s.statGrid}>
        <StatCard label="Total" value={stats.total} icon={FileText} color={t.accent} />
        <StatCard label="Published" value={stats.published} icon={Eye} color={t.success} />
        <StatCard label="Drafts" value={stats.drafts} icon={Clock} color={t.warning} />
        <StatCard label="Breaking" value={stats.breaking} icon={Zap} color={t.danger} />
      </div>

      <Card style={{ marginTop: 24 }}>
        <div style={s.toolbar}>
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
          <input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.searchInput}
          />
        </div>

        <DataTable
          columns={[
            { key: 'title', label: 'Title', render: (r) => (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: t.text, fontWeight: 500 }}>{r.title}</span>
                  {r.isBreaking && <span style={{ color: t.danger, fontSize: 11, fontWeight: 700 }}>BREAKING</span>}
                  {r.isFeatured && <Star size={12} color="#FBBF24" fill="#FBBF24" />}
                </div>
                <div style={{ color: t.textMuted, fontSize: 12 }}>{r.source || '—'}</div>
              </div>
            )},
            { key: 'category', label: 'Category', render: (r) => (
              <Badge>{r.category}</Badge>
            )},
            { key: 'status', label: 'Status', render: (r) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Badge color={STATUS_COLORS[r.status]}>{r.status}</Badge>
                {r.isArchived && <Badge color={t.textMuted}>archived</Badge>}
              </div>
            )},
            { key: 'views', label: 'Views', render: (r) => (
              <span style={{ color: t.textSecondary }}>{r.views || 0}</span>
            )},
            { key: 'actions', label: '', width: 180, render: (r) => (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {r.status === 'pending' && (
                  <button onClick={() => approveArticle(r)} style={s.iconBtn} title="Approve & Publish">
                    <Check size={14} color={t.success} />
                  </button>
                )}
                <button onClick={() => toggleFeatured(r)} style={s.iconBtn} title="Toggle featured">
                  <Star size={14} color={r.isFeatured ? '#FBBF24' : t.textMuted} fill={r.isFeatured ? '#FBBF24' : 'none'} />
                </button>
                <button onClick={() => toggleBreaking(r)} style={s.iconBtn} title="Toggle breaking">
                  <Zap size={14} color={r.isBreaking ? t.danger : t.textMuted} fill={r.isBreaking ? t.danger : 'none'} />
                </button>
                <button onClick={() => toggleArchive(r)} style={s.iconBtn} title={r.isArchived ? 'Unarchive' : 'Archive'}>
                  {r.isArchived
                    ? <ArchiveRestore size={14} color={t.success} />
                    : <Archive size={14} color={t.textMuted} />
                  }
                </button>
                <button onClick={() => openEdit(r)} style={s.iconBtn} title="Edit">
                  <Pencil size={14} color={t.accent} />
                </button>
                <button onClick={() => deleteArticle(r.id)} style={s.iconBtn} title="Delete">
                  <Trash2 size={14} color={t.danger} />
                </button>
              </div>
            )},
          ]}
          rows={filtered}
        />
      </Card>

      {/* Categories */}
      <Card style={{ marginTop: 24 }}>
        <h3 style={s.sectionTitle}>Categories ({categories.length})</h3>
        <div style={s.catGrid}>
          {categories.map((cat) => (
            <div key={cat.key} style={s.catChip}>
              <span style={{ color: t.text }}>{cat.label}</span>
              <span style={{ color: t.textMuted, fontSize: 12 }}>
                {articles.filter(a => a.category === cat.key).length} articles
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Article editor modal */}
      {showEditor && (
        <div style={s.modalOverlay} onClick={() => setShowEditor(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>{editId ? 'Edit Article' : 'New Article'}</h2>
            <div style={s.formGrid}>
              <div style={{ ...s.field, gridColumn: '1 / -1' }}>
                <label style={s.label}>Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={s.input} placeholder="Article headline..." />
              </div>
              <div style={s.field}>
                <label style={s.label}>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={s.input}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={s.input}>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending Review</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Source</label>
                <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} style={s.input} placeholder="e.g. Rwanda Today" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Source URL</label>
                <input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} style={s.input} placeholder="https://..." />
              </div>

              {/* Image upload */}
              <div style={{ ...s.field, gridColumn: '1 / -1' }}>
                <label style={s.label}>Cover Image</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      style={s.input}
                      placeholder="Image URL or upload below"
                    />
                    {isEmbeddedPreview(form.imageUrl) && (
                      <div style={s.imageWarning}>
                        This is a small preview copied from a search page (like Google Images), not the
                        real photo — it will look blurry. Click the image in Google to open it, then
                        right-click the large version and choose "Copy image address", or save the
                        photo and use Upload Image.
                      </div>
                    )}
                    <div style={{ marginTop: 8 }}>
                      <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        style={{ ...s.uploadBtn }}
                      >
                        <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Image'}
                      </button>
                    </div>
                  </div>
                  {form.imageUrl && (
                    <img src={form.imageUrl} alt="preview" style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 6, border: `1px solid ${t.border}` }} />
                  )}
                </div>
              </div>

              {/* Breaking toggle */}
              <div style={{ ...s.field, gridColumn: '1 / -1' }}>
                <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.isBreaking}
                    onChange={(e) => setForm({ ...form, isBreaking: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: t.danger }}
                  />
                  <Zap size={14} color={t.danger} />
                  Mark as Breaking News
                </label>
              </div>

              {/* Rich text body editor */}
              <div style={{ ...s.field, gridColumn: '1 / -1' }}>
                <label style={s.label}>Article Body</label>
                <div style={s.editorToolbar}>
                  <button onClick={() => wrapSelection('**', '**')} style={s.toolBtn} title="Bold">
                    <Bold size={16} />
                  </button>
                  <button onClick={() => wrapSelection('*', '*')} style={s.toolBtn} title="Italic">
                    <Italic size={16} />
                  </button>
                  <button onClick={() => wrapSelection('\n## ', '\n')} style={s.toolBtn} title="Heading">
                    <Heading size={16} />
                  </button>
                  <button onClick={() => insertAtCursor('\n- ')} style={s.toolBtn} title="List item">
                    <List size={16} />
                  </button>
                  <button onClick={() => {
                    const url = prompt('Enter URL:');
                    if (url) wrapSelection('[', `](${url})`);
                  }} style={s.toolBtn} title="Insert link">
                    <Link2 size={16} />
                  </button>
                  <span style={{ flex: 1 }} />
                  <span style={{ color: t.textMuted, fontSize: 11 }}>
                    {form.body.length} chars
                  </span>
                </div>
                <textarea
                  ref={bodyRef}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={12}
                  style={{ ...s.input, resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.6 }}
                  placeholder="Write your article here... Use **bold**, *italic*, ## headings"
                />
              </div>
            </div>
            <div style={s.modalActions}>
              <button onClick={() => setShowEditor(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={save} disabled={saving} style={s.primaryBtn}>
                {saving ? 'Saving...' : editId ? 'Update Article' : 'Create Article'}
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
  toolbar: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 },
  searchInput: { maxWidth: 300 },
  sectionTitle: { color: t.text, fontSize: 16, fontWeight: 600, margin: '0 0 16px' },
  catGrid: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  catChip: {
    background: t.bgHover, borderRadius: 8, padding: '8px 14px',
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  iconBtn: {
    background: 'transparent', padding: 6, borderRadius: 6,
    display: 'flex', alignItems: 'center',
  },
  primaryBtn: {
    background: t.accent, color: t.bg, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  cancelBtn: { background: t.bgHover, color: t.text },
  imageWarning: {
    marginTop: 6, padding: '8px 10px', borderRadius: 6,
    background: 'rgba(251,191,36,0.12)', color: t.warning, fontSize: 12, lineHeight: 1.5,
  },
  uploadBtn: {
    background: t.bgHover, color: t.textSecondary, fontSize: 13,
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
  },
  editorToolbar: {
    display: 'flex', alignItems: 'center', gap: 2,
    padding: '6px 8px', background: t.bgHover, borderRadius: '8px 8px 0 0',
    borderBottom: `1px solid ${t.border}`,
  },
  toolBtn: {
    background: 'transparent', color: t.textSecondary, padding: 6,
    borderRadius: 4, display: 'flex', alignItems: 'center',
  },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, padding: 16,
  },
  modal: {
    background: t.bgCard, borderRadius: t.radiusLg, padding: 28,
    width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto',
  },
  modalTitle: { color: t.text, fontSize: 20, fontWeight: 700, margin: '0 0 20px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { color: t.textSecondary, fontSize: 13, fontWeight: 500 },
  input: { width: '100%' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
};
