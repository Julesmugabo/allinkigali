/**
 * SupportActivity.jsx — Settings › allinkigali activity: every time someone
 * from allinkigali opened this dashboard, switched on changes, or changed
 * something — who, when, what. Nothing is hidden from the client.
 */
import React, { useEffect, useState } from 'react';
import { t } from '../../theme';
import { apiFetch } from '../../api';
import { PageHeader, DataTable, Badge } from '../../components/PageShell';
import { Panel, ErrorText, Loading } from '../../components/ui';
import { day, clock } from '../common/format';

const ACTION = {
  view: ['Opened your dashboard (view only)', t.accent],
  enable_changes: ['Switched on changes', t.warning],
  change: ['Changed something', '#F472B6'],
  onboard: ['Gave an owner their sign-in', t.success],
  reset_password: ['Gave an owner a new password', t.warning],
  remove_owner: ['Removed an owner’s sign-in', t.danger],
};
const ROLE = { director: 'Director', sellers: 'Sales Partner', finance: 'Finance' };

// "PUT /my-restaurant/menu/12" → "menu"; keeps the log readable.
const what = (detail) => {
  const m = String(detail || '').match(/^(\w+)\s+\/(?:my-restaurant|clients\/\w+)?\/?([\w-]*)/);
  return m ? `${m[1] === 'DELETE' ? 'removed' : 'saved'} · ${m[2] || 'profile'}` : detail || '';
};

export default function SupportActivity({ me }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { apiFetch('/clients/support/activity').then(setRows).catch((e) => setError(e.message)); }, []);

  const columns = [
    { key: 'at', label: 'When', render: (r) => `${day(r.at)} · ${clock(r.at)}` },
    { key: 'who', label: 'Who', render: (r) => <>{r.who}<div style={{ color: t.textMuted, fontSize: 12 }}>{ROLE[r.role] || r.role}</div></> },
    { key: 'action', label: 'What', render: (r) => { const [label, color] = ACTION[r.action] || [r.action, t.textSecondary]; return <Badge color={color}>{label}</Badge>; } },
    { key: 'detail', label: '', render: (r) => <span style={{ color: t.textMuted, fontSize: 12 }}>{r.action === 'change' ? what(r.detail) : ['onboard', 'reset_password', 'remove_owner'].includes(r.action) ? r.detail : ''}</span> },
  ];
  return (
    <div>
      <PageHeader title="allinkigali activity" subtitle={`When our team looked into ${me.place.name}'s dashboard, and what they did`} />
      <Panel>
        <p style={s.note}>
          Our team only opens your dashboard to help you — read-only unless they switch on changes, and every visit and change is listed here.
        </p>
        {rows ? <DataTable columns={columns} rows={rows.map((r, i) => ({ ...r, id: i }))} emptyText="Nobody from allinkigali has opened your dashboard." /> : error ? <ErrorText>{error}</ErrorText> : <Loading />}
      </Panel>
    </div>
  );
}

const s = {
  note: { color: t.textSecondary, fontSize: 13.5, marginBottom: 14, lineHeight: 1.5 },
};
