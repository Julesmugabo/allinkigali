/**
 * Intents.jsx — a coffee shop chooses which visitor intents it wants to
 * appear for ("work remotely", "date"...). Ticking an intent switches on its
 * attributes; each attribute can also be set on its own.
 */
import React, { useState } from 'react';
import { t } from '../../../../theme';
import Button from '../../../../components/common/Button';
import ChipPicker from '../../../../components/form/ChipPicker';
import { Panel } from '../../../../components/ui';
import { COFFEE_INTENTS, COFFEE_ATTRIBUTES } from '../../../places/placeTypes';
import { useOwner } from '../../OwnerContext';

export default function Intents() {
  const { profile, api, changed, notify } = useOwner();
  const [attrs, setAttrs] = useState(profile.attributes || []);
  const [saving, setSaving] = useState(false);
  const matches = (i) => i.attrs.some((a) => attrs.includes(a));
  const toggleIntent = (i) => setAttrs((cur) => (matches(i) ? cur.filter((a) => !i.attrs.includes(a)) : [...new Set([...cur, ...i.attrs])]));

  const save = async () => {
    setSaving(true);
    try { await api.saveProfile({ attributes: attrs }); notify('Visitor intents saved'); changed(); } catch (e) { alert(e.message); }
    setSaving(false);
  };

  return (
    <>
      <Panel title="Show my coffee shop to people who want to…" actions={<Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>}>
        <div style={s.grid}>
          {COFFEE_INTENTS.map((i) => (
            <button key={i.key} onClick={() => toggleIntent(i)} style={{ ...s.intent, ...(matches(i) ? s.on : {}) }}>{i.label}</button>
          ))}
        </div>
      </Panel>
      <Panel title="Fine-tune the attributes">
        <ChipPicker options={COFFEE_ATTRIBUTES} value={attrs} onChange={setAttrs} />
      </Panel>
    </>
  );
}

const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 },
  intent: { padding: '14px 12px', borderRadius: 10, background: t.bg, color: t.textSecondary, border: `2px solid ${t.borderLight}`, fontSize: 14, textAlign: 'left' },
  on: { borderColor: t.accent, color: t.text, background: t.bgActive },
};
