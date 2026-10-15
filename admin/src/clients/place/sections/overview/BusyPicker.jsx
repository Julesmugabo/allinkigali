/**
 * BusyPicker.jsx — a coffee shop tells readers how busy it is right now.
 */
import React, { useState } from 'react';
import { t } from '../../../../theme';
import { Panel } from '../../../../components/ui';
import { useOwner } from '../../OwnerContext';

const LEVELS = [
  { key: 'quiet', label: 'Quiet', color: t.lime },
  { key: 'moderate', label: 'Moderate', color: t.gold },
  { key: 'full', label: 'Full', color: t.danger },
];

export default function BusyPicker() {
  const { profile, api, changed, notify } = useOwner();
  const [busy, setBusy] = useState(profile.busy_now || null);
  const pick = async (level) => {
    const next = busy === level ? null : level;
    try { await api.setBusy(next); setBusy(next); notify(next ? `Readers now see "${next}"` : 'Busy status cleared'); changed(); }
    catch (e) { alert(e.message); }
  };
  return (
    <Panel title="How busy are you right now?">
      <div style={{ display: 'flex', gap: 10 }}>
        {LEVELS.map((l) => (
          <button key={l.key} onClick={() => pick(l.key)}
            style={{ ...s.btn, borderColor: busy === l.key ? l.color : t.borderLight, color: busy === l.key ? t.text : t.textSecondary, fontWeight: busy === l.key ? 700 : 500, background: busy === l.key ? `${l.color}33` : 'transparent' }}>
            {l.label}
          </button>
        ))}
      </div>
      {profile.busy_updated_at && <div style={s.when}>Last updated {new Date(profile.busy_updated_at).toLocaleString('en-GB')}</div>}
    </Panel>
  );
}

const s = {
  btn: { flex: 1, padding: '12px 0', borderRadius: 10, border: '2px solid', fontWeight: 700 },
  when: { color: t.textMuted, fontSize: 12, marginTop: 8 },
};
