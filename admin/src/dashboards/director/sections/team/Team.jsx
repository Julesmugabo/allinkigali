/**
 * Team.jsx — everyone with access to the portal, what they can open, and
 * (for owners) which place. Give or remove access here.
 */
import React, { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { t } from '../../../../theme';
import { DataTable, Badge } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { Panel, Loading, ErrorText } from '../../../../components/ui';
import { directorApi } from '../../directorApi';
import GrantAccessModal, { ROLES } from './GrantAccessModal';

const COLORS = { director: '#F59E0B', news: '#38BDF8', sellers: '#4ADE80', finance: '#EC4899', restaurant: '#FB923C', coffeeshop: '#A78BFA' };
const roleLabel = (r) => (r === 'director' ? 'Director' : ROLES.find((x) => x.value === r)?.label || r);

export default function Team({ notify }) {
  const [team, setTeam] = useState(null);
  const [error, setError] = useState('');
  const [granting, setGranting] = useState(false);
  const load = () => directorApi.team().then(setTeam).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const revoke = async (m) => {
    if (!window.confirm(`Remove ${roleLabel(m.role)} access from ${m.email}? Their account stays; they just can't open the dashboard.`)) return;
    try { await directorApi.assignRole({ email: m.email, role: null }); notify(`Access removed from ${m.email}`); load(); } catch (e) { setError(e.message); }
  };

  const columns = [
    { key: 'name', label: 'Person', render: (m) => <div><div style={{ fontWeight: 500 }}>{[m.firstName, m.lastName].filter(Boolean).join(' ') || '—'}</div><div style={{ color: t.textMuted, fontSize: 12 }}>{m.email}</div></div> },
    { key: 'role', label: 'Access', render: (m) => <Badge color={COLORS[m.role]}>{roleLabel(m.role)}</Badge> },
    {
      key: 'place', label: 'Place', render: (m) => (m.role === 'restaurant' || m.role === 'coffeeshop'
        ? (m.placeName || <span style={{ color: t.warning }}>Not linked — their dashboard can't open</span>)
        : '—'),
    },
    { key: 'createdAt', label: 'Since', render: (m) => (m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-GB') : '—') },
    { key: 'x', label: '', render: (m) => (m.role === 'director' ? null : <Button size="sm" variant="danger" onClick={() => revoke(m)}>Remove access</Button>) },
  ];

  return (
    <Panel title="Team & access" actions={<Button icon={UserPlus} onClick={() => setGranting(true)}>Give access</Button>}>
      <ErrorText>{error}</ErrorText>
      {!team ? <Loading /> : <DataTable columns={columns} rows={team} emptyText="Nobody else has access yet." />}
      {granting && <GrantAccessModal onDone={(m) => { notify(m); load(); }} onClose={() => setGranting(false)} />}
    </Panel>
  );
}
