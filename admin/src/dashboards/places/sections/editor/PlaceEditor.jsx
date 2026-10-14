/**
 * PlaceEditor.jsx — add or edit a listing (…/add, …/add?id=…): details,
 * price level, rating, every tag group of its kind, and the photo gallery.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField, TextAreaField } from '../../../../components/form/Fields';
import ChipPicker from '../../../../components/form/ChipPicker';
import PhotosEditor from '../../../../components/form/PhotosEditor';
import { Panel, Loading, ErrorText } from '../../../../components/ui';
import { usePlaces } from '../../PlacesContext';
import { placesApi } from '../../placesApi';

const PRICE = [{ value: '1', label: '$ — budget' }, { value: '2', label: '$$ — moderate' }, { value: '3', label: '$$$ — upscale' }, { value: '4', label: '$$$$ — fine dining' }];

export default function PlaceEditor() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get('id');
  const { type, changed, notify } = usePlaces();
  const [form, setForm] = useState(id ? null : type.fromPlace(null));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!id) { setForm(type.fromPlace(null)); return; }
    placesApi.get(type, id).then((p) => setForm(type.fromPlace(p))).catch((e) => setError(e.message));
  }, [id, type]);

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (form.photos.some((p) => p.url && p.url.startsWith('data:'))) { setError('A photo is a blurry search preview — upload it or use its real link.'); return; }
    setSaving(true); setError('');
    try {
      const body = type.toBody(form);
      if (id) await placesApi.update(type, id, body);
      else await placesApi.create(type, body);
      notify(id ? `${form.name} saved` : `${form.name} added`);
      changed();
      navigate(`${type.base}/list`);
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  if (!form) return error ? <ErrorText>{error}</ErrorText> : <Loading />;
  return (
    <>
      <ErrorText>{error}</ErrorText>
      <Panel title="Details">
        <FormGrid>
          <Field label={`${type.one} name *`} value={form.name} onChange={set('name')} full />
          <Field label="Location" value={form.location} onChange={set('location')} placeholder="e.g. KN 4 Ave, Kiyovu" />
          <Field label="District" value={form.district} onChange={set('district')} placeholder="e.g. Nyarugenge" />
          <Field label="Phone" value={form.phone} onChange={set('phone')} placeholder="+250 7…" />
          <Field label="Website" value={form.website} onChange={set('website')} placeholder="https://…" />
          <SelectField label="Price level" value={form.price} onChange={set('price')} options={PRICE} />
          <Field label="Rating (1–5)" type="number" min="1" max="5" step="0.1" value={form.rating} onChange={set('rating')} />
          <SelectField label="Right now" value={form.openStatus} onChange={set('openStatus')} options={[{ value: 'Open now', label: 'Open now' }, { value: 'Closed', label: 'Closed' }]} />
          <TextAreaField label="Description" value={form.description} onChange={set('description')} rows={3} />
          {type.key === 'restaurant' && <Field label="Signature dishes (comma-separated)" value={form.foods} onChange={set('foods')} placeholder="Brochettes, Isombe, Tilapia" full />}
          {type.key === 'coffeeshop' && <Field label="Services (comma-separated)" value={form.services} onChange={set('services')} placeholder="Takeaway, Catering, Events" full />}
        </FormGrid>
      </Panel>
      <Panel title="Tags readers filter by">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {type.tags.map((g) => <ChipPicker key={g.key} label={g.label} options={g.options} value={form[g.key]} onChange={set(g.key)} />)}
        </div>
      </Panel>
      <Panel title="Photos">
        <PhotosEditor value={form.photos} onChange={set('photos')} />
      </Panel>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : id ? 'Save changes' : `Add ${type.one.toLowerCase()}`}</Button>
        <Button variant="ghost" onClick={() => navigate(`${type.base}/list`)}>Cancel</Button>
      </div>
    </>
  );
}
