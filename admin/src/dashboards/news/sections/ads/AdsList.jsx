/**
 * AdsList.jsx — the App ads page or the Web ads page: every ad of that
 * channel with its status, dates, views and clicks; add, edit, switch
 * on/off, delete.
 */
import React, { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { t } from '../../../../theme';
import { DataTable, Badge } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { Panel, RowActions, Muted, fmtNum } from '../../../../components/ui';
import { useNews } from '../../NewsContext';
import { newsApi } from '../../newsApi';
import { CHANNELS, adStatus } from './channels';
import AdModal from './AdModal';

// Old ads made in the phone app stored a local file path nobody else can load.
export const isDeviceOnly = (uri) => typeof uri === 'string' && /^(file|content|ph|assets-library|blob):/i.test(uri);

export default function AdsList({ channel }) {
  const { ads, changed, notify } = useNews();
  const [editing, setEditing] = useState(null);
  const list = ads.filter((a) => a.channel === channel);
  const info = CHANNELS[channel];

  const toggle = async (ad) => {
    try { await newsApi.updateAd(ad.id, { isActive: !ad.isActive }); notify(ad.isActive ? 'Ad switched off' : 'Ad switched on'); changed(); } catch (e) { alert(e.message); }
  };
  const remove = async (ad) => {
    if (!window.confirm(`Delete "${ad.title || 'this ad'}"? Its view and click counts go too.`)) return;
    try { await newsApi.deleteAd(ad.id); notify('Ad deleted'); changed(); } catch (e) { alert(e.message); }
  };

  const columns = [
    {
      key: 'media', label: 'Ad', render: (ad) => (isDeviceOnly(ad.mediaUri)
        ? <span style={s.broken}><AlertTriangle size={14} /> Broken file — re-upload</span>
        : ad.type === 'video' ? <video src={ad.mediaUri} style={s.thumb} muted /> : <img src={ad.mediaUri} alt="" style={s.thumb} />),
    },
    { key: 'title', label: 'Name', render: (ad) => <div><div style={{ fontWeight: 600 }}>{ad.title || '—'}</div><div style={s.sub}>{ad.linkUrl || 'No link'}</div></div> },
    { key: 'dates', label: 'Runs', render: (ad) => `${ad.startsOn || 'now'} → ${ad.endsOn || 'no end'}` },
    { key: 'status', label: 'Status', render: (ad) => { const st = adStatus(ad); return <Badge color={st.color}>{st.label}</Badge>; } },
    { key: 'views', label: 'Views', render: (ad) => fmtNum(ad.views) },
    { key: 'clicks', label: 'Clicks', render: (ad) => `${fmtNum(ad.clicks)}${ad.views ? ` (${((ad.clicks / ad.views) * 100).toFixed(1)}%)` : ''}` },
    {
      key: 'a', label: '', render: (ad) => (
        <RowActions>
          <Button size="sm" variant="info" onClick={() => setEditing(ad)}>Edit</Button>
          <Button size="sm" variant={ad.isActive ? 'warning' : 'success'} onClick={() => toggle(ad)}>{ad.isActive ? 'Switch off' : 'Switch on'}</Button>
          <Button size="sm" variant="danger" onClick={() => remove(ad)}>Delete</Button>
        </RowActions>
      ),
    },
  ];

  return (
    <Panel title={info.title}>
      <Muted>{info.where}</Muted>
      <div style={{ margin: '14px 0' }}><Button icon={Plus} onClick={() => setEditing({})}>New {channel} ad</Button></div>
      <DataTable columns={columns} rows={list} emptyText={`No ${channel} ads yet.`} />
      {editing && <AdModal channel={channel} ad={editing.id ? editing : null} onClose={() => setEditing(null)} />}
    </Panel>
  );
}

const s = {
  thumb: { width: 90, height: 56, objectFit: 'cover', borderRadius: 6, background: t.bg },
  sub: { color: t.textMuted, fontSize: 12, marginTop: 2 },
  broken: { display: 'inline-flex', gap: 6, alignItems: 'center', color: t.warning, fontSize: 12 },
};
