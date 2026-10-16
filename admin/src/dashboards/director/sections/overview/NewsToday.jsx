/**
 * NewsToday.jsx — the director's news block on the Overview: what went out
 * today, what waits for approval (approve it right here), what is scheduled
 * or still being written. Each number opens that exact list in News › Articles.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Eye } from 'lucide-react';
import { t } from '../../../../theme';
import Button from '../../../../components/common/Button';
import { Panel, Kpi, KpiGrid, fmtNum } from '../../../../components/ui';
import { displayStatus } from '../../../news/constants';
import { articleActions } from '../../../news/sections/articles/articleActions';
import { articleDay, articleTime, todayKey } from '../../../news/sections/articles/articleDays';

const SHOWN = 6;

function ago(d) {
  const min = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000));
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} day(s) ago`;
}

export default function NewsToday({ articles, categoryLabel, onChanged, notify }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);
  const today = todayKey();
  const live = articles.filter((a) => !a.isArchived);
  const publishedToday = live.filter((a) => a.status === 'published' && articleDay(a) === today);
  const pending = live.filter((a) => a.status === 'pending').sort((a, b) => new Date(articleTime(a)) - new Date(articleTime(b)));
  const scheduled = live.filter((a) => displayStatus(a) === 'scheduled').length;
  const drafts = live.filter((a) => displayStatus(a) === 'draft').length;
  const open = (q) => navigate(`/news/articles?${q}`);

  const approve = async (a) => {
    setBusy(a.id);
    try { await articleActions.approve(a); notify(`Published: ${a.title}`); onChanged(); } catch (e) { alert(e.message); }
    setBusy(null);
  };

  return (
    <>
      <div style={s.head}>
        <h3 style={s.title}>News today</h3>
        <Button size="sm" variant="info" onClick={() => open(`day=${today}`)}>See today's articles</Button>
      </div>
      <KpiGrid>
        <Kpi label="Published today" value={publishedToday.length} color={t.success} hint={`${fmtNum(publishedToday.reduce((n, a) => n + (a.views || 0), 0))} reads so far`} onClick={() => open(`day=${today}&tab=published`)} />
        <Kpi label="Waiting for your approval" value={pending.length} color={t.warning} hint={pending.length ? `oldest written ${ago(articleTime(pending[0]))}` : 'nothing waiting'} onClick={() => open('day=all&tab=pending')} />
        <Kpi label="Scheduled to go live" value={scheduled} color="#A78BFA" onClick={() => open('day=all&tab=scheduled')} />
        <Kpi label="Drafts being written" value={drafts} color="#94A3B8" onClick={() => open('day=all&tab=drafts')} />
      </KpiGrid>
      {pending.length > 0 && (
        <Panel title="Waiting for your approval">
          {pending.slice(0, SHOWN).map((a) => (
            <div key={a.id} style={s.row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.headline}>{a.title}</div>
                <div style={s.meta}>{categoryLabel(a.category)} · {a.source || '—'} · written {ago(articleTime(a))}</div>
              </div>
              <Button size="sm" variant="info" icon={Eye} onClick={() => navigate(`/news/write?id=${a.id}`)}>Read</Button>
              <Button size="sm" variant="success" icon={Check} disabled={busy === a.id} onClick={() => approve(a)}>Approve</Button>
            </div>
          ))}
          {pending.length > SHOWN && <button style={s.more} onClick={() => open('day=all&tab=pending')}>See all {pending.length} waiting</button>}
        </Panel>
      )}
    </>
  );
}

const s = {
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '4px 0 12px' },
  title: { color: t.text, fontSize: 16, fontWeight: 600, margin: 0 },
  row: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: `1px solid ${t.border}` },
  headline: { color: t.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  meta: { color: t.textMuted, fontSize: 12, marginTop: 2 },
  more: { background: 'transparent', color: t.accent, fontWeight: 600, fontSize: 13, padding: '10px 0 0' },
};
