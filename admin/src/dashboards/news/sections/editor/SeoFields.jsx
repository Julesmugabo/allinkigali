/**
 * SeoFields.jsx — slug, search description and share image.
 */
import React from 'react';
import { FormGrid, Field, TextAreaField } from '../../../../components/form/Fields';

export default function SeoFields({ form, set }) {
  const len = (form.metaDescription || '').length;
  return (
    <FormGrid>
      <Field label="URL slug" value={form.slug} onChange={set('slug')} placeholder="Made from the headline if left empty" full />
      <TextAreaField label={`Search description (${len}/160)`} value={form.metaDescription} onChange={(v) => set('metaDescription')(v.slice(0, 160))} rows={2} />
      <Field label="Share image link (defaults to the cover)" value={form.ogImage} onChange={set('ogImage')} placeholder="https://…" full />
    </FormGrid>
  );
}
