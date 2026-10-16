/**
 * PublishOptions.jsx — the editor's side panel: where the article goes
 * (draft / approval / publish / schedule), live story, byline, the web ad
 * shown with it, flags and labels.
 */
import React from 'react';
import { t } from '../../../../theme';
import { SelectField, Field, CheckboxField } from '../../../../components/form/Fields';
import { EDITOR_LABELS } from '../../constants';

const DESTINATIONS = [
  { key: 'draft', label: 'Save as draft', hint: 'Only staff can see it.' },
  { key: 'pending', label: 'Submit for approval', hint: 'An editor publishes it after review.' },
  { key: 'published', label: 'Publish now', hint: 'Readers see it immediately.' },
  { key: 'schedule', label: 'Schedule', hint: 'Goes live automatically at the time you pick.' },
];

export default function PublishOptions({ form, set, stories, authors, webAds = [] }) {
  const toggleLabel = (key) => set('labels')(form.labels.includes(key) ? form.labels.filter((l) => l !== key) : [...form.labels, key]);
  const pickableStories = stories.filter((st) => st.isLive || st.id === form.storyId);

  return (
    <div style={s.wrap}>
      <div style={s.group}>
        <div style={s.h}>Where it goes</div>
        {DESTINATIONS.map((d) => (
          <label key={d.key} style={{ ...s.dest, ...(form.destination === d.key ? s.destActive : {}) }}>
            <input type="radio" name="dest" checked={form.destination === d.key} onChange={() => set('destination')(d.key)} />
            <span>
              <span style={{ fontWeight: 600, color: t.text }}>{d.label}</span>
              <span style={s.hint}>{d.hint}</span>
            </span>
          </label>
        ))}
        {form.destination === 'schedule' && (
          <Field label="Publish at" type="datetime-local" value={form.publishAt} onChange={set('publishAt')} />
        )}
      </div>

      <div style={s.group}>
        <div style={s.h}>Live story</div>
        <SelectField value={form.storyId} onChange={set('storyId')} placeholder="Not part of a story"
          options={[...pickableStories.map((st) => ({ value: st.id, label: st.title })), { value: 'new', label: '+ Start a new live story' }]} />
        {form.storyId === 'new' && <Field value={form.newStoryTitle} onChange={set('newStoryTitle')} placeholder="Story headline" />}
      </div>

      <div style={s.group}>
        <div style={s.h}>Byline</div>
        <SelectField value={form.authorId} onChange={set('authorId')} placeholder="No author"
          options={authors.filter((a) => a.is_active || a.id === form.authorId).map((a) => ({ value: a.id, label: `${a.name} (${a.role})` }))} />
      </div>

      <div style={s.group}>
        <div style={s.h}>Ad on this article (website)</div>
        <SelectField value={form.webAdId} onChange={set('webAdId')} placeholder="Automatic — ads take turns"
          options={webAds.filter((a) => a.isActive || a.id === form.webAdId).map((a) => ({ value: a.id, label: a.title || 'Untitled ad' }))} />
        <span style={s.hint}>Shown under "Bisomwa cyane" on the website's article page. The app doesn't show it.</span>
      </div>

      <div style={s.group}>
        <div style={s.h}>Flags</div>
        <CheckboxField label="Breaking (expires automatically)" checked={form.isBreaking} onChange={set('isBreaking')} />
        <CheckboxField label="Main story — top of the news page until you choose another" checked={form.isFeatured} onChange={set('isFeatured')} />
        <CheckboxField label="Trending" checked={form.isTrending} onChange={set('isTrending')} />
      </div>

      <div style={s.group}>
        <div style={s.h}>Labels</div>
        <div style={s.chips}>
          {EDITOR_LABELS.map((l) => {
            const on = form.labels.includes(l.key);
            return (
              <button key={l.key} type="button" onClick={() => toggleLabel(l.key)}
                style={{ ...s.chip, ...(on ? { background: l.color, color: '#fff', borderColor: l.color } : {}) }}>
                {l.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 14 },
  group: { background: t.bgCard, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 },
  h: { color: t.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' },
  dest: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', border: '1px solid transparent' },
  destActive: { borderColor: t.accent, background: t.bgActive },
  hint: { display: 'block', color: t.textMuted, fontSize: 12, marginTop: 2 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  chip: { padding: '5px 10px', borderRadius: 20, fontSize: 12, background: 'transparent', color: t.textSecondary, border: `1px solid ${t.borderLight}` },
};
