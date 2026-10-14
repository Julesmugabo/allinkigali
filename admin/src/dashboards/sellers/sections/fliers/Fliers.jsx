/**
 * Fliers.jsx — the scrolling flier strip on the app's shop tab: each flier
 * is an image that opens a seller's shop.
 */
import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { t } from '../../../../theme';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { SelectField } from '../../../../components/form/Fields';
import MediaUpload, { isEmbeddedPreview } from '../../../../components/form/MediaUpload';
import { Panel, Loading, ErrorText } from '../../../../components/ui';
import { useSellers } from '../../SellersContext';
import { sellersApi } from '../../sellersApi';

function FlierModal({ flier, businesses, onSaved, onClose }) {
  const [imageUri, setImageUri] = useState(flier?.imageUri || '');
  const [businessId, setBusinessId] = useState(flier?.businessId || '');
  const [error, setError] = useState('');
  const save = async () => {
    if (!imageUri || isEmbeddedPreview(imageUri)) { setError('Upload the flier image first.'); return; }
    if (!businessId) { setError('Pick the shop this flier opens.'); return; }
    try {
      if (flier) await sellersApi.updateFlier(flier.id, { imageUri, businessId });
      else await sellersApi.createFlier({ imageUri, businessId });
      onSaved(flier ? 'Flier updated' : 'Flier added'); onClose();
    } catch (e) { setError(e.message); }
  };
  return (
    <Modal open onClose={onClose} title={flier ? 'Edit flier' : 'New flier'} width={560}>
      <ErrorText>{error}</ErrorText>
      <div style={{ display: 'grid', gap: 14 }}>
        <MediaUpload label="Flier image (wide, e.g. 1200×500)" value={imageUri} onChange={setImageUri} />
        <SelectField label="Opens this shop" value={businessId} onChange={setBusinessId} placeholder="— Pick a shop —"
          options={businesses.map((b) => ({ value: b.id, label: `${b.name}${b.category ? ` (${b.category})` : ''}` }))} />
      </div>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save}>Save</Button>
      </ModalActions>
    </Modal>
  );
}

export default function Fliers() {
  const { notify } = useSellers();
  const [fliers, setFliers] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const load = () => Promise.all([sellersApi.fliers(), sellersApi.businesses()])
    .then(([f, b]) => { setFliers(f); setBusinesses(b); }).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  const shopName = (id) => businesses.find((b) => b.id === id)?.name || 'Shop no longer listed';

  const remove = async (f) => {
    if (!window.confirm('Remove this flier from the shop tab?')) return;
    try { await sellersApi.deleteFlier(f.id); notify('Flier removed'); load(); } catch (e) { setError(e.message); }
  };

  return (
    <Panel title="Shop fliers" actions={<Button icon={Plus} onClick={() => setEditing({})}>New flier</Button>}>
      <ErrorText>{error}</ErrorText>
      {!fliers ? <Loading /> : fliers.length === 0 ? <div style={{ color: t.textMuted }}>No fliers yet — they scroll across the top of the shop tab.</div> : (
        <div style={s.grid}>
          {fliers.map((f) => (
            <div key={f.id} style={s.card}>
              <img src={f.imageUri} alt="" style={s.img} />
              <div style={s.meta}>Opens: <b style={{ color: t.text }}>{shopName(f.businessId)}</b></div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button size="sm" variant="info" onClick={() => setEditing(f)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => remove(f)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && <FlierModal flier={editing.id ? editing : null} businesses={businesses} onSaved={(m) => { notify(m); load(); }} onClose={() => setEditing(null)} />}
    </Panel>
  );
}

const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 },
  card: { background: t.bg, borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 },
  img: { width: '100%', aspectRatio: '12 / 5', objectFit: 'cover', borderRadius: 8, background: t.bgCard },
  meta: { color: t.textSecondary, fontSize: 13 },
};
