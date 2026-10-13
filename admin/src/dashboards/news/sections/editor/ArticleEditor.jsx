/**
 * ArticleEditor.jsx — write or edit an article (/news/write, /news/write?id=…).
 * The save button names exactly what will happen, so "I clicked publish but
 * it stayed a draft" can't happen.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, PenLine } from 'lucide-react';
import { t } from '../../../../theme';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField } from '../../../../components/form/Fields';
import MediaUpload from '../../../../components/form/MediaUpload';
import { Panel, Loading, ErrorText } from '../../../../components/ui';
import { useNews } from '../../NewsContext';
import { newsApi } from '../../newsApi';
import MarkdownPreview from '../../components/MarkdownPreview';
import EditorToolbar from './EditorToolbar';
import Checklist from './Checklist';
import PublishOptions from './PublishOptions';
import SeoFields from './SeoFields';
import useDraftAutosave, { clearDraft } from './useDraftAutosave';
import { emptyForm, formFromArticle, validate, toPayload, wordCount } from './articleForm';

const BUTTON = { draft: 'Save draft', pending: 'Submit for approval', published: 'Publish now', schedule: 'Schedule' };

function Editor({ existing }) {
  const navigate = useNavigate();
  const { categories, stories, authors, changed, notify } = useNews();
  const [form, setForm] = useState(() => (existing ? formFromArticle(existing) : emptyForm(categories)));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const bodyRef = useRef(null);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const draft = useDraftAutosave(!existing, form);
  const words = wordCount(form.body);

  // New articles start from the newsroom's default status (Settings).
  useEffect(() => {
    if (existing) return;
    newsApi.workflowSettings()
      .then((w) => { if (w?.default_publish_status) setForm((f) => ({ ...f, destination: w.default_publish_status })); })
      .catch(() => {});
  }, [existing]);

  const save = async () => {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      let storyId = form.storyId;
      if (storyId === 'new') storyId = (await newsApi.createStory(form.newStoryTitle.trim())).id;
      const payload = toPayload(form, { existing, storyId });
      if (existing) await newsApi.updateArticle(existing.id, payload);
      else await newsApi.createArticle(payload);
      if (!existing) clearDraft();
      notify(form.destination === 'published' ? 'Article published' : form.destination === 'schedule'
        ? `Scheduled for ${new Date(form.publishAt).toLocaleString('en-GB')}` : form.destination === 'pending' ? 'Sent for approval' : 'Draft saved');
      changed();
      navigate('/news/articles');
    } catch (err) { setErrors({ save: err.message }); }
    setSaving(false);
  };

  const bad = (k) => errors[k] && <div style={s.fieldErr}>{errors[k]}</div>;

  return (
    <div style={{ ...s.layout, ...(window.innerWidth < 1000 ? { gridTemplateColumns: '1fr' } : {}) }}>
      <div style={{ minWidth: 0 }}>
        {draft.restorable && (
          <div style={s.restore}>
            You have an unsaved draft “{draft.restorable.title || 'Untitled'}” from {new Date(draft.restorable.at).toLocaleString('en-GB')}.
            <Button size="sm" variant="info" onClick={() => { setForm({ ...emptyForm(categories), ...draft.restorable }); draft.dismissRestore(); }}>Restore it</Button>
            <Button size="sm" variant="ghost" onClick={draft.discard}>Discard</Button>
          </div>
        )}
        <ErrorText>{errors.save}</ErrorText>
        <Panel>
          <input value={form.title} onChange={(e) => set('title')(e.target.value)} placeholder="Headline" style={s.headline} />
          {bad('title')}
          <div style={{ height: 14 }} />
          <FormGrid>
            <SelectField label="Category *" value={form.category} onChange={set('category')} options={categories.map((c) => ({ value: c.key, label: c.label }))} placeholder="— Select —" />
            <Field label="Source *" value={form.source} onChange={set('source')} placeholder="e.g. IGIHE, RBA, AllInKigali" />
            <Field label="Source link" value={form.sourceUrl} onChange={set('sourceUrl')} placeholder="https://…" full />
            <MediaUpload label="Cover photo" value={form.imageUrl} onChange={set('imageUrl')} />
          </FormGrid>
          {bad('category')}{bad('source')}{bad('imageUrl')}
        </Panel>

        <Panel
          title="Article"
          actions={(
            <>
              <span style={s.count}>{words} words · {Math.max(1, Math.round(words / 200))} min read{draft.savedAt ? ` · draft kept ${draft.savedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
              <Button size="sm" variant="ghost" icon={preview ? PenLine : Eye} onClick={() => setPreview((v) => !v)}>{preview ? 'Write' : 'Preview'}</Button>
            </>
          )}
        >
          {preview ? <MarkdownPreview text={form.body} /> : (
            <>
              <EditorToolbar textareaRef={bodyRef} body={form.body} setBody={set('body')} />
              <textarea ref={bodyRef} value={form.body} onChange={(e) => set('body')(e.target.value)} rows={18}
                placeholder="Write the story… Use the buttons for bold, italic, headings, quotes and lists."
                style={s.body} />
            </>
          )}
          {bad('body')}
        </Panel>

        <Panel title="SEO & sharing">
          <SeoFields form={form} set={set} />
          {bad('ogImage')}
        </Panel>
      </div>

      <div style={s.side}>
        <PublishOptions form={form} set={set} stories={stories} authors={authors} />
        {bad('publishAt')}{bad('story')}
        <Checklist {...form} />
        <Button onClick={save} disabled={saving} style={{ justifyContent: 'center', padding: '12px 16px' }}>
          {saving ? 'Saving...' : BUTTON[form.destination]}
        </Button>
        <Button variant="ghost" onClick={() => navigate('/news/articles')} style={{ justifyContent: 'center' }}>Cancel</Button>
      </div>
    </div>
  );
}

export default function ArticleEditor() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const { articles, loading } = useNews();
  const existing = useMemo(() => (id ? articles.find((a) => String(a.id) === id) : null), [articles, id]);
  if (loading) return <Loading />;
  if (id && !existing) return <ErrorText>That article wasn't found — it may have been deleted.</ErrorText>;
  return <Editor key={id || 'new'} existing={existing} />;
}

const s = {
  layout: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 20, alignItems: 'start' },
  side: { display: 'flex', flexDirection: 'column', gap: 12 },
  headline: { width: '100%', fontSize: 22, fontWeight: 700, background: 'transparent', border: 'none', borderBottom: `1px solid ${t.borderLight}`, borderRadius: 0, padding: '6px 0' },
  body: { width: '100%', resize: 'vertical', fontSize: 15, lineHeight: 1.6, borderRadius: '0 0 8px 8px' },
  count: { color: t.textMuted, fontSize: 12 },
  fieldErr: { color: t.danger, fontSize: 12, marginTop: 6 },
  restore: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: t.bgActive, color: t.text, fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 14 },
};
