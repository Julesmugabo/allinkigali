/**
 * AdModal.jsx — create or edit an app or web ad: name, photo or video
 * (uploaded so every reader can load it), the link it opens, and optional
 * start/end dates.
 */
import React, { useState } from 'react';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField, CheckboxField } from '../../../../components/form/Fields';
import MediaUpload, { isEmbeddedPreview } from '../../../../components/form/MediaUpload';
import { ErrorText, Muted } from '../../../../components/ui';
import { useNews } from '../../NewsContext';
import { newsApi } from '../../newsApi';
import { CHANNELS } from './channels';
import { isDeviceOnly } from './AdsList';

export default function AdModal({ channel, ad, onClose }) {
  const { changed, notify } = useNews();
  const [form, setForm] = useState({
    title: ad?.title || '', type: ad?.type || 'photo',
    mediaUri: ad && !isDeviceOnly(ad.mediaUri) ? ad.mediaUri : '',
    linkUrl: ad?.linkUrl || '', startsOn: ad?.startsOn || '', endsOn: ad?.endsOn || '',
    isActive: ad ? ad.isActive : true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) { setError('Give the ad a name (e.g. the advertiser and offer).'); return; }
    if (!form.mediaUri || isEmbeddedPreview(form.mediaUri)) { setError(`Upload the ${form.type === 'video' ? 'video' : 'photo'} first.`); return; }
    if (form.startsOn && form.endsOn && form.endsOn < form.startsOn) { setError('The end date is before the start date.'); return; }
    setSaving(true); setError('');
    try {
      const body = { ...form, channel };
      if (ad) await newsApi.updateAd(ad.id, body); else await newsApi.createAd(body);
      notify(ad ? 'Ad updated' : `${CHANNELS[channel].title.slice(0, -1)} added`); changed(); onClose();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title={`${ad ? 'Edit' : 'New'} ${channel} ad`} width={620}>
      <ErrorText>{error}</ErrorText>
      <Muted>{CHANNELS[channel].size}</Muted>
      <FormGrid>
        <Field label="Name (shown on the ad)" value={form.title} onChange={set('title')} placeholder="e.g. MTN MoMo — send money free" />
        <SelectField label="Type" value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v, mediaUri: '' }))}
          options={[{ value: 'photo', label: 'Photo' }, { value: 'video', label: 'Video' }]} />
        <MediaUpload label={form.type === 'video' ? 'Video (max 10 MB)' : 'Photo'} kind={form.type === 'video' ? 'video' : 'image'} value={form.mediaUri} onChange={set('mediaUri')} />
        <Field label="Opens this link when clicked" value={form.linkUrl} onChange={set('linkUrl')} placeholder="https://… or wa.me/2507…" />
        <Field label="Start date (optional)" type="date" value={form.startsOn} onChange={set('startsOn')} />
        <Field label="End date (optional)" type="date" value={form.endsOn} onChange={set('endsOn')} />
        <CheckboxField label="Switched on" checked={form.isActive} onChange={set('isActive')} />
      </FormGrid>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : ad ? 'Save changes' : 'Add ad'}</Button>
      </ModalActions>
    </Modal>
  );
}
