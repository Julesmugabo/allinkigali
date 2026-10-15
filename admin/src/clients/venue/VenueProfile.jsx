/**
 * VenueProfile.jsx — what couples see in the app: name, description,
 * where, capacity, price level, facilities, views, privacy, photo spots
 * and photos.
 */
import React, { useState } from 'react';
import { Panel, ErrorText } from '../../components/ui';
import Button from '../../components/common/Button';
import { FormGrid, Field, SelectField, TextAreaField } from '../../components/form/Fields';
import ChipPicker from '../../components/form/ChipPicker';
import PhotosEditor from '../../components/form/PhotosEditor';
import { venueApi } from './venueApi';
import { FACILITIES, VIEWS, PRIVACY, PHOTOGRAPHY, PRICES, DISTRICTS } from './venueOptions';

const pick = (v) => ({
  name: v.name || '', description: v.description || '', location: v.location || '', district: v.district || '', phone: v.phone || '',
  capacity: String(v.capacity || ''), price: String(v.price || 2), facilities: v.facilities || [], views: v.views || [],
  privacy: v.privacy || [], photography: v.photography || [], photos: v.photos || [],
});

export default function VenueProfile({ venue, onSaved, show }) {
  const [f, setF] = useState(() => pick(venue));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    setBusy(true); setError('');
    try {
      const saved = await venueApi.save({ ...f, capacity: Number(f.capacity) || 0, price: Number(f.price) || 2, photos: f.photos.filter((p) => p.url) });
      onSaved(saved);
      show('Saved — couples see it in the app now');
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <Panel title="Venue profile" actions={<Button onClick={save} disabled={busy || !f.name.trim()}>{busy ? 'Saving…' : 'Save'}</Button>}>
      <FormGrid>
        <Field label="Name" value={f.name} onChange={set('name')} full />
        <TextAreaField label="Description" value={f.description} onChange={set('description')} rows={4} />
        <Field label="Location" value={f.location} onChange={set('location')} placeholder="e.g. Kicukiro, Kigali" />
        <SelectField label="District" value={f.district} onChange={set('district')} placeholder="Choose…" options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
        <Field label="Phone for couples" value={f.phone} onChange={set('phone')} placeholder="+250 7…" />
        <Field label="Guests (capacity)" type="number" value={f.capacity} onChange={set('capacity')} />
        <SelectField label="Price level" value={f.price} onChange={set('price')} options={PRICES} />
        <ChipPicker label="Facilities" options={FACILITIES} value={f.facilities} onChange={set('facilities')} />
        <ChipPicker label="Views" options={VIEWS} value={f.views} onChange={set('views')} />
        <ChipPicker label="Privacy" options={PRIVACY} value={f.privacy} onChange={set('privacy')} />
        <ChipPicker label="Photography" options={PHOTOGRAPHY} value={f.photography} onChange={set('photography')} />
        <PhotosEditor value={f.photos} onChange={set('photos')} />
      </FormGrid>
      <ErrorText>{error}</ErrorText>
    </Panel>
  );
}
