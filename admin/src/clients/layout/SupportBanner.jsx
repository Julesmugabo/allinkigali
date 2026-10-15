/**
 * SupportBanner.jsx — shown across the top when someone from allinkigali is
 * looking at a client's dashboard: read-only until they press "Make changes"
 * (Finance can only look). The client sees these visits in Settings ›
 * allinkigali activity.
 */
import React, { useState } from 'react';
import { Eye, Pencil, X } from 'lucide-react';
import { t } from '../../theme';
import { session } from '../session';

export default function SupportBanner({ me, onChanged }) {
  const [busy, setBusy] = useState(false);
  const s = me.support;
  const makeChanges = async () => {
    if (!window.confirm(`Switch on changes for ${me.place.name}? Everything you change is recorded and the client can see it.`)) return;
    setBusy(true);
    try { await session.makeChanges(); onChanged(); } catch (e) { alert(e.message); }
    setBusy(false);
  };
  const exit = () => { session.signOut(); window.close(); onChanged(); };
  return (
    <div style={st.bar}>
      <Eye size={16} color={t.gold} />
      <span>Viewing <b>{me.place.name}</b> as allinkigali — {s.name} · {s.readOnly ? 'read-only' : <b>changes on (recorded)</b>}</span>
      <span style={{ flex: 1 }} />
      {s.readOnly && s.staffRole !== 'finance' ? (
        <button type="button" onClick={makeChanges} disabled={busy} style={st.btn}><Pencil size={14} /> Make changes</button>
      ) : null}
      <button type="button" onClick={exit} style={{ ...st.btn, ...st.ghost }}><X size={14} /> Exit</button>
    </div>
  );
}

const st = {
  bar: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#FBF3D9', color: t.text, borderBottom: `2px solid ${t.gold}`, padding: '10px 20px', fontSize: 13.5, position: 'sticky', top: 0, zIndex: 20 },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 6, background: t.gold, color: t.text, border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' },
  ghost: { background: 'transparent', color: t.text, border: '1px solid rgba(17,17,17,0.25)' },
};
