/**
 * ClientActivity.jsx — Sales Partners › Clients › Support activity: every
 * time the team opened a client's dashboard, switched on changes, changed
 * something, gave an owner login or a new password (the same list each
 * client sees for their own place).
 */
import React, { useEffect, useState } from 'react';
import { t } from '../../../../theme';
import { DataTable, Badge } from '../../../../components/PageShell';
import { Panel, ErrorText, Loading } from '../../../../components/ui';
import { KIND, clientsApi } from './clientsApi';

const ACTION = {
  view: ['Opened (view only)', t.accent],
  enable_changes: ['Switched on changes', t.warning],
  change: ['Changed', '#F5C518'],
  onboard: ['Owner login given', t.success],
  reset_password: ['New owner password', t.warning],
  remove_owner: ['Owner removed', t.danger],
};
const when = (d) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function ClientActivity() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { clientsApi.activity().then(setRows).catch((e) => setError(e.message)); }, []);
  if (!rows) return error ? <ErrorText>{error}</ErrorText> : <Loading />;
  const columns = [
    { key: 'at', label: 'When', render: (r) => when(r.at) },
    { key: 'place', label: 'Client', render: (r) => <>{r.place}<div style={{ color: t.textMuted, fontSize: 12 }}>{KIND[r.placeType]}</div></> },
    { key: 'who', label: 'Who', render: (r) => <>{r.who || '—'}<div style={{ color: t.textMuted, fontSize: 12 }}>{r.role}</div></> },
    { key: 'action', label: 'What', render: (r) => { const [label, color] = ACTION[r.action] || [r.action, t.textSecondary]; return <Badge color={color}>{label}</Badge>; } },
    { key: 'detail', label: 'Detail', render: (r) => <span style={{ color: t.textMuted, fontSize: 12 }}>{r.detail || ''}</span> },
  ];
  return (
    <Panel title="Support activity">
      <DataTable columns={columns} rows={rows.map((r, i) => ({ ...r, id: i }))} emptyText="Nobody has opened a client's dashboard yet." />
    </Panel>
  );
}
