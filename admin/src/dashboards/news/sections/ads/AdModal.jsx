/**
 * AdModal.jsx — create or edit a feed ad: photo or video (uploaded to the
 * server so every reader can load it) and the article it follows.
 */
import React, { useState } from 'react';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, SelectField } from '../../../../components/form/Fields';
import MediaUpload, { isEmbeddedPreview } from '../../../../components/form/MediaUpload';
import { ErrorText } from '../../../../components/ui';
import { useNews } from '../../NewsContext';
import { newsApi } from '../../newsApi';
import { isDeviceOnly } from './FeedAds';

export default function AdModal({ ad, onClose }) {
  const { articles, ads, changed, notify } = useNews();
  const [type, setType] = useState(ad?.type || 'photo');
  const [mediaUri, setMediaUri] = useState(ad && !isDeviceOnly(ad.mediaUri) ? ad.mediaUri : '');
  const [afterArticleId, setAfterArticleId] = useState(ad?.afterArticleId || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Only articles readers can actually scroll past, and only one ad per article.
  const taken = new Set(ads.filter((x) => x.id !== ad?.id).map((x) => x.afterArticleId));
  const eligible = articles.filter((a) => a.status === 'published' && !a.isArchived && !taken.has(a.id));

  const save = async () => {
    if (!mediaUri || isEmbeddedPreview(mediaUri)) { setError(`Upload the ${type === 'video' ? 'video' : 'photo'} first.`); return; }
    if (!afterArticleId) { setError('Pick the article this ad follows.'); return; }
    setSaving(true); setError('');
    try {
      const body = { type, mediaUri, afterArticleId };
      if (ad) await newsApi.updateAd(ad.id, body);
      else await newsApi.createAd(body);
      notify(ad ? 'Ad updated' : 'Ad added to the feed'); changed(); onClose();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title={ad ? 'Edit Ad' : 'New Feed Ad'} width={600}>
      <ErrorText>{error}</ErrorText>
      <FormGrid>
        <SelectField label="Type" value={type} onChange={(v) => { setType(v); setMediaUri(''); }}
          options={[{ value: 'photo', label: 'Photo' }, { value: 'video', label: 'Video' }]} />
        <SelectField label="Show right after" value={afterArticleId} onChange={setAfterArticleId} placeholder="— Pick a published article —"
          options={eligible.map((a) => ({ value: a.id, label: a.title }))} />
        <MediaUpload label={type === 'video' ? 'Video (max 10 MB)' : 'Photo'} kind={type === 'video' ? 'video' : 'image'} value={mediaUri} onChange={setMediaUri} />
      </FormGrid>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : ad ? 'Save changes' : 'Add ad'}</Button>
      </ModalActions>
    </Modal>
  );
}
