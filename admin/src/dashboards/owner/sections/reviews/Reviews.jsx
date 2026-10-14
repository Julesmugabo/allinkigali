/**
 * Reviews.jsx — what guests said, with a public reply from the place.
 */
import React, { useState } from 'react';
import { t } from '../../../../theme';
import Button from '../../../../components/common/Button';
import { Panel, Kpi, KpiGrid } from '../../../../components/ui';
import { useOwner } from '../../OwnerContext';

export default function Reviews() {
  const { reviews, api, changed, notify } = useOwner();
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState(null);
  const avg = reviews.length ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1) : '—';
  const unanswered = reviews.filter((r) => !r.ownerReply).length;

  const reply = async (r) => {
    const text = (drafts[r.id] || '').trim();
    if (!text) return;
    setBusy(r.id);
    try { await api.reply(r.id, text); setDrafts((d) => ({ ...d, [r.id]: '' })); notify('Reply posted'); changed(); }
    catch (e) { alert(e.message); }
    setBusy(null);
  };

  return (
    <>
      <KpiGrid>
        <Kpi label="Average rating" value={avg === '—' ? avg : `★ ${avg}`} color="#FBBF24" />
        <Kpi label="Reviews" value={reviews.length} />
        <Kpi label="Waiting for a reply" value={unanswered} color={unanswered ? t.warning : t.success} />
      </KpiGrid>
      <Panel title="Reviews">
        {reviews.length === 0 && <div style={{ color: t.textMuted, fontSize: 14 }}>No reviews yet.</div>}
        {reviews.map((r) => (
          <div key={r.id} style={s.review}>
            <div style={s.head}>
              <b>{r.guestName || 'Guest'}</b>
              <span style={{ color: '#FBBF24' }}>{'★'.repeat(Math.round(r.rating || 0))}<span style={{ color: t.border }}>{'★'.repeat(5 - Math.round(r.rating || 0))}</span></span>
              <span style={{ color: t.textMuted, fontSize: 12 }}>{r.date}</span>
            </div>
            {r.text && <p style={s.text}>{r.text}</p>}
            {r.ownerReply ? (
              <div style={s.reply}><b>Your reply:</b> {r.ownerReply}</div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={drafts[r.id] || ''} onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))} placeholder="Write a public reply…" style={{ flex: 1 }} />
                <Button size="sm" disabled={busy === r.id || !(drafts[r.id] || '').trim()} onClick={() => reply(r)}>Reply</Button>
              </div>
            )}
          </div>
        ))}
      </Panel>
    </>
  );
}

const s = {
  review: { padding: '14px 0', borderBottom: `1px solid ${t.border}` },
  head: { display: 'flex', gap: 12, alignItems: 'center', color: t.text, fontSize: 14 },
  text: { color: t.textSecondary, fontSize: 14, margin: '6px 0 10px', lineHeight: 1.5 },
  reply: { background: t.bgActive, color: t.text, fontSize: 13, padding: '8px 12px', borderRadius: 8 },
};
