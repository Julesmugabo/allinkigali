/**
 * FeedAds.jsx — photo/video ads shown in the reader feed right after a
 * chosen article.
 */
import React, { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { t } from '../../../../theme';
import { DataTable } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { RowActions } from '../../../../components/ui';
import { useNews } from '../../NewsContext';
import { newsApi } from '../../newsApi';
import { fmtDate } from '../../constants';
import AdModal from './AdModal';

// Ads made in the old app stored the phone's local file path instead of an
// uploaded file, so nobody else can load them.
export const isDeviceOnly = (uri) => typeof uri === 'string' && /^(file|content|ph|assets-library|blob):/i.test(uri);

export default function FeedAds() {
  const { ads, articles, changed, notify } = useNews();
  const [editing, setEditing] = useState(null);
  const titleOf = (id) => articles.find((a) => a.id === id)?.title || 'Article no longer available';

  const remove = async (ad) => {
    if (!window.confirm('Remove this ad from the feed?')) return;
    try { await newsApi.deleteAd(ad.id); notify('Ad removed'); changed(); } catch (e) { alert(e.message); }
  };

  const columns = [
    {
      key: 'media', label: 'Ad', render: (ad) => (isDeviceOnly(ad.mediaUri)
        ? <span style={s.broken}><AlertTriangle size={14} /> Broken file — re-upload</span>
        : ad.type === 'video'
          ? <video src={ad.mediaUri} style={s.thumb} muted />
          : <img src={ad.mediaUri} alt="" style={s.thumb} />),
    },
    { key: 'type', label: 'Type' },
    { key: 'after', label: 'Shown after', render: (ad) => titleOf(ad.afterArticleId) },
    { key: 'createdAt', label: 'Added', render: (ad) => fmtDate(ad.createdAt) },
    {
      key: 'a', label: '', render: (ad) => (
        <RowActions>
          <Button size="sm" variant="info" onClick={() => setEditing(ad)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => remove(ad)}>Delete</Button>
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 14 }}><Button icon={Plus} onClick={() => setEditing({})}>New ad</Button></div>
      <DataTable columns={columns} rows={ads} emptyText="No feed ads yet. An ad appears right after the article you pick." />
      {editing && <AdModal ad={editing.id ? editing : null} onClose={() => setEditing(null)} />}
    </>
  );
}

const s = {
  thumb: { width: 90, height: 56, objectFit: 'cover', borderRadius: 6, background: t.bg },
  broken: { display: 'inline-flex', gap: 6, alignItems: 'center', color: t.warning, fontSize: 12 },
};
