/**
 * Tablets.jsx — Team › Tablets: screens that stay signed in on their own,
 * like the kitchen's or the bar's tablet. Add one, then type the 6-digit
 * code on the tablet (allinclients… → "Connect a kitchen or bar tablet").
 * The code works once, for 10 minutes. Disconnect a lost tablet here.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { MonitorSmartphone } from 'lucide-react';
import { t } from '../../theme';
import { Panel, RowActions, ErrorText, Loading } from '../../components/ui';
import { DataTable } from '../../components/PageShell';
import Button from '../../components/common/Button';
import { ago } from '../common/format';
import { teamApi } from './teamApi';

const SHOWS = { kitchen: 'Kitchen screen', waiter: 'Waiter board' };

export default function Tablets({ show }) {
  const [tablets, setTablets] = useState(null);
  const [error, setError] = useState('');
  const [code, setCode] = useState(null); // { label, code }
  const [form, setForm] = useState({ label: 'Kitchen', role: 'kitchen' });

  const load = useCallback(() => teamApi.devices().then(setTablets).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault();
    try { const d = await teamApi.addDevice(form); setCode({ label: d.label, code: d.code }); } catch (err) { show(err.message, true); }
    load();
  };
  const newCode = async (d) => {
    try { const r = await teamApi.newDeviceCode(d.id); setCode({ label: d.label, code: r.code }); } catch (err) { show(err.message, true); }
  };
  const remove = async (d) => {
    if (!window.confirm(`Disconnect "${d.label}"? It is signed out within seconds.`)) return;
    try { await teamApi.removeDevice(d.id); show('Disconnected'); } catch (err) { show(err.message, true); }
    load();
  };

  if (!tablets) return error ? <ErrorText>{error}</ErrorText> : <Loading />;
  const columns = [
    { key: 'label', label: 'Tablet', render: (d) => <b>{d.label}</b> },
    { key: 'role', label: 'Shows', render: (d) => SHOWS[d.role] },
    { key: 'seen', label: 'Last seen', render: (d) => <span style={{ color: t.textMuted, fontSize: 13 }}>{d.last_seen_at ? `${ago(d.last_seen_at)} ago` : 'not connected yet'}</span> },
    {
      key: 'a', label: '', render: (d) => (
        <RowActions>
          <Button size="sm" variant="info" onClick={() => newCode(d)}>Connect code</Button>
          <Button size="sm" variant="danger" onClick={() => remove(d)}>Disconnect</Button>
        </RowActions>
      ),
    },
  ];

  return (
    <Panel title="Tablets">
      {code && (
        <div style={s.code}>
          <MonitorSmartphone size={26} color={t.accent} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 700 }}>Connect “{code.label}”</div>
            <div style={s.hint}>On the tablet open <b>{window.location.host}/device</b> and type this code within 10 minutes:</div>
          </div>
          <div style={s.digits}>{code.code}</div>
          <Button size="sm" variant="ghost" onClick={() => setCode(null)}>Done</Button>
        </div>
      )}
      <form onSubmit={add} style={s.add}>
        <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Name, e.g. Kitchen or Bar" maxLength={40} style={{ flex: 1, minWidth: 160 }} />
        <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
          <option value="kitchen">shows the Kitchen screen</option>
          <option value="waiter">shows the Waiter board</option>
        </select>
        <Button type="submit">Add a tablet</Button>
      </form>
      <DataTable columns={columns} rows={tablets} emptyText="No tablets yet. A kitchen tablet stays signed in, so nobody types a PIN during service." />
    </Panel>
  );
}

const s = {
  code: { display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', background: t.bgActive, border: `1px solid ${t.accent}55`, borderRadius: 10, padding: '12px 14px', marginBottom: 16 },
  hint: { color: t.textSecondary, fontSize: 13.5, marginTop: 2 },
  digits: { fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 30, fontWeight: 800, letterSpacing: 6, color: t.accent },
  add: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
};
