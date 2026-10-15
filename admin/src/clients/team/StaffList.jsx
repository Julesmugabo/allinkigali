/**
 * StaffList.jsx — Team › Staff: everyone who signs in for this place. Owners
 * and managers with an email account; waiters, kitchen staff and cashiers
 * with their phone and a PIN. Switching someone off locks them out within
 * seconds; a new PIN also unlocks someone who typed a wrong PIN too often.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { t } from '../../theme';
import { Panel, RowActions, ErrorText, Loading } from '../../components/ui';
import { DataTable, Badge } from '../../components/PageShell';
import Button from '../../components/common/Button';
import { ROLE_LABEL } from '../session';
import { kumezaApi } from '../kumeza/kumezaApi';
import { day } from '../common/format';
import { teamApi } from './teamApi';
import StaffForm from './StaffForm';
import SignInCard from './SignInCard';

const mayManage = (myRole, role) => role !== 'owner' && (myRole === 'owner' || role !== 'manager');

export default function StaffList({ me, show }) {
  const [people, setPeople] = useState(null);
  const [sections, setSections] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // person, or 'new'
  const [added, setAdded] = useState(null); // sign-in details to hand over once

  const load = useCallback(() => teamApi.members().then(setPeople).catch((e) => setError(e.message)), []);
  useEffect(() => {
    load();
    kumezaApi.setup().then((d) => setSections(d.sections)).catch(() => {});
  }, [load]);

  const save = async (body, form) => {
    if (editing === 'new') {
      await teamApi.addMember(body);
      setAdded({ name: form.name, phone: form.phone, pin: form.pin });
    } else {
      await teamApi.updateMember(editing.id, body);
      if (body.pin) setAdded({ name: form.name, phone: form.phone, pin: body.pin });
      else show('Saved');
    }
    setEditing(null);
    load();
  };
  const toggle = async (p) => {
    if (p.active && !window.confirm(`Switch off ${p.name}? They are signed out within seconds and can't sign in until you switch them on.`)) return;
    try { await teamApi.updateMember(p.id, { active: !p.active }); show(p.active ? `${p.name} is switched off` : `${p.name} can sign in again`); } catch (e) { show(e.message, true); }
    load();
  };

  if (!people) return error ? <ErrorText>{error}</ErrorText> : <Loading />;
  const sectionName = (id) => sections.find((x) => x.id === id)?.name;
  const columns = [
    {
      key: 'name', label: 'Person', render: (p) => (
        <div style={{ opacity: p.active ? 1 : 0.5 }}>
          <div style={{ fontWeight: 600 }}>{p.name}</div>
          <div style={s.muted}>{p.hasAccount ? 'Signs in with email' : p.phone ? `0${p.phone} · PIN` : ''}</div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: (p) => <>{ROLE_LABEL[p.role]}{p.role === 'waiter' && sectionName(p.sectionId) ? <span style={s.muted}> · {sectionName(p.sectionId)}</span> : null}</> },
    { key: 'last', label: 'Last sign-in', render: (p) => <span style={s.muted}>{p.lastLoginAt ? day(p.lastLoginAt) : 'never'}</span> },
    {
      key: 'status', label: 'Status', render: (p) => (!p.active ? <Badge color={t.textMuted}>switched off</Badge>
        : p.locked ? <Badge color={t.warning}>locked — give a new PIN</Badge> : <Badge color={t.success}>active</Badge>),
    },
    {
      key: 'a', label: '', render: (p) => (mayManage(me.role, p.role) ? (
        <RowActions>
          <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>Change</Button>
          <Button size="sm" variant={p.active ? 'danger' : 'success'} onClick={() => toggle(p)}>{p.active ? 'Switch off' : 'Switch on'}</Button>
        </RowActions>
      ) : null),
    },
  ];

  return (
    <Panel title="Staff" actions={<Button icon={UserPlus} onClick={() => setEditing('new')}>Add a person</Button>}>
      {added && <SignInCard person={added} onDone={() => setAdded(null)} />}
      <DataTable columns={columns} rows={people} emptyText="Nobody yet." />
      {editing && (
        <StaffForm person={editing === 'new' ? null : editing} myRole={me.role} sections={sections} onSave={save} onClose={() => setEditing(null)} />
      )}
    </Panel>
  );
}

const s = {
  muted: { color: t.textMuted, fontSize: 12 },
};
