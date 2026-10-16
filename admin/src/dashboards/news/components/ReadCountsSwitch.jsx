/**
 * ReadCountsSwitch.jsx — the on/off switch for whether readers (app and
 * website) see how many people read each article. It only hides the number
 * from readers: the dashboard always shows every article's reads.
 */
import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { t } from '../../../theme';
import { useNews } from '../NewsContext';
import { newsApi } from '../newsApi';

export default function ReadCountsSwitch() {
  const { notify } = useNews();
  const [on, setOn] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    newsApi.readerSettings().then((r) => setOn(!!r.showViewCounts)).catch((e) => setError(e.message));
  }, []);

  const flip = async () => {
    setBusy(true); setError('');
    try {
      const r = await newsApi.setShowViewCounts(!on);
      setOn(!!r.showViewCounts);
      notify(r.showViewCounts ? 'Readers now see how many people read each article' : 'Read counts hidden from readers — you still see them here');
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const Icon = on === false ? EyeOff : Eye;
  return (
    <div style={s.bar}>
      <Icon size={18} color={t.textSecondary} style={{ flex: 'none' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.title}>Show read counts to readers</div>
        <div style={s.hint}>
          {error || (on === null ? 'Checking…' : on
            ? 'On: every article in the app and on the website shows how many people read it.'
            : 'Off: readers don\'t see the numbers. You still see them in the Reads column.')}
        </div>
      </div>
      <button
        type="button" role="switch" aria-checked={!!on} aria-label="Show read counts to readers"
        disabled={on === null || busy} onClick={flip}
        style={{ ...s.track, background: on ? t.success : t.borderLight, opacity: on === null || busy ? 0.6 : 1 }}
      >
        <span style={{ ...s.knob, transform: `translateX(${on ? 20 : 0}px)` }} />
      </button>
      <span style={{ ...s.state, color: on ? t.success : t.textMuted }}>{on === null ? '' : on ? 'On' : 'Off'}</span>
    </div>
  );
}

const s = {
  bar: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', marginBottom: 18, borderRadius: 10, background: t.bg, border: `1px solid ${t.border}` },
  title: { color: t.text, fontSize: 14, fontWeight: 600 },
  hint: { color: t.textMuted, fontSize: 12, marginTop: 2 },
  track: { position: 'relative', flex: 'none', width: 44, height: 24, borderRadius: 12, padding: 0, border: 'none', cursor: 'pointer', transition: 'background 0.15s' },
  knob: { position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: 10, background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'transform 0.15s' },
  state: { width: 24, fontSize: 13, fontWeight: 700 },
};
