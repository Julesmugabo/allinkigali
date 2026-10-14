/**
 * Settings.jsx — the place's public profile: details, opening hours,
 * delivery, the tags readers filter by, and photos.
 */
import React, { useState } from 'react';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField, TextAreaField, CheckboxField } from '../../../../components/form/Fields';
import ChipPicker from '../../../../components/form/ChipPicker';
import PhotosEditor from '../../../../components/form/PhotosEditor';
import { Panel, ErrorText } from '../../../../components/ui';
import { PLACE_TYPES } from '../../../places/placeTypes';
import { useOwner } from '../../OwnerContext';

// profile rows come back snake_case; the save API takes camelCase
const SNAKE = { coffeeTypes: 'coffee_types', brewingMethods: 'brewing_methods' };

function toForm(p, tags) {
  const f = {
    name: p.name || '', description: p.description || '', location: p.location || '', district: p.district || '',
    phone: p.phone || '', website: p.website || '', openStatus: p.open_status || 'Open now', openHours: p.open_hours || '',
    price: String(p.price ?? 2), deliveryEnabled: !!p.delivery_enabled, deliveryFee: p.delivery_fee ?? '', minOrder: p.min_order ?? '',
    estimatedTime: p.estimated_time || '', deliveryZones: p.delivery_zones || '',
    photos: (p.photos || []).map((x) => ({ url: x.url, label: x.label || '' })),
  };
  tags.forEach((g) => { f[g.key] = p[SNAKE[g.key] || g.key] || []; });
  return f;
}

export default function Settings() {
  const { profile, kind, api, changed, notify } = useOwner();
  const type = PLACE_TYPES[kind];
  const [form, setForm] = useState(() => toForm(profile, type.tags));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const num = (v) => (v === '' || v == null ? null : Number(v));

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (form.photos.some((p) => (p.url || '').startsWith('data:'))) { setError('A photo is a blurry search preview — upload it or use its real link.'); return; }
    setSaving(true); setError('');
    try {
      await api.saveProfile({ ...form, price: parseInt(form.price, 10) || 2, deliveryFee: num(form.deliveryFee), minOrder: num(form.minOrder), photos: form.photos.filter((p) => p.url) });
      notify('Profile saved — readers see the changes now'); changed();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <>
      <ErrorText>{error}</ErrorText>
      <Panel title="Details">
        <FormGrid>
          <Field label="Name *" value={form.name} onChange={set('name')} full />
          <Field label="Location" value={form.location} onChange={set('location')} />
          <Field label="District" value={form.district} onChange={set('district')} />
          <Field label="Phone" value={form.phone} onChange={set('phone')} />
          <Field label="Website" value={form.website} onChange={set('website')} />
          <SelectField label="Right now" value={form.openStatus} onChange={set('openStatus')} options={[{ value: 'Open now', label: 'Open now' }, { value: 'Closed', label: 'Closed' }]} />
          <SelectField label="Price level" value={form.price} onChange={set('price')} options={['1', '2', '3', '4'].map((v) => ({ value: v, label: '$'.repeat(Number(v)) }))} />
          <TextAreaField label="Opening hours" value={form.openHours} onChange={set('openHours')} rows={2} />
          <TextAreaField label="Description" value={form.description} onChange={set('description')} rows={3} />
        </FormGrid>
      </Panel>
      <Panel title="Delivery">
        <FormGrid>
          <CheckboxField label="We deliver" checked={form.deliveryEnabled} onChange={set('deliveryEnabled')} full />
          <Field label="Delivery fee (RWF)" type="number" min="0" value={form.deliveryFee} onChange={set('deliveryFee')} />
          <Field label="Minimum order (RWF)" type="number" min="0" value={form.minOrder} onChange={set('minOrder')} />
          <Field label="Delivery time" value={form.estimatedTime} onChange={set('estimatedTime')} placeholder="e.g. 30-45 min" />
          <Field label="Areas we deliver to" value={form.deliveryZones} onChange={set('deliveryZones')} placeholder="Kiyovu, Kimihurura, Gisozi…" full />
        </FormGrid>
      </Panel>
      <Panel title="Tags readers filter by">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {type.tags.filter((g) => g.key !== 'attributes').map((g) => <ChipPicker key={g.key} label={g.label} options={g.options} value={form[g.key]} onChange={set(g.key)} />)}
        </div>
      </Panel>
      <Panel title="Photos"><PhotosEditor value={form.photos} onChange={set('photos')} /></Panel>
      <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</Button>
    </>
  );
}
