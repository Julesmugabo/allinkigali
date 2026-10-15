/**
 * DeviceConnect.jsx — connecting a kitchen/bar tablet: type the 6-digit code
 * the owner sees in Team › Tablets. The tablet then stays signed in (only
 * the kitchen screen) until the owner disconnects it.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../../theme';
import { session } from '../session';

export default function DeviceConnect({ onSignedIn }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await session.connectDevice(code); onSignedIn(); } catch (err) { setError(err.message); }
    setBusy(false);
  };
  return (
    <div style={s.page}>
      <form onSubmit={submit} style={s.card}>
        <div style={s.title}>Connect this tablet</div>
        <div style={s.hint}>On the owner's dashboard: Team › Tablets › Add a tablet. Type the 6-digit code shown there.</div>
        <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="••••••" style={s.input} autoFocus />
        {error ? <div style={s.error}>{error}</div> : null}
        <button type="submit" disabled={busy || code.length !== 6} style={{ ...s.submit, opacity: code.length === 6 ? 1 : 0.5 }}>{busy ? 'Connecting…' : 'Connect'}</button>
        <Link to="/" style={{ color: t.text, fontSize: 13, textAlign: 'center' }}>Back to sign in</Link>
      </form>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg, fontFamily: t.font, padding: 16 },
  card: { width: 380, maxWidth: '100%', background: t.bgCard, border: `1px solid ${t.borderLight}`, borderTop: `4px solid ${t.lime}`, borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 14, color: t.text, boxShadow: t.shadowLg },
  title: { fontSize: 20, fontWeight: 800, textAlign: 'center' },
  hint: { color: t.textSecondary, fontSize: 14, textAlign: 'center' },
  input: { background: t.bg, border: `1px solid ${t.borderLight}`, borderRadius: 10, padding: 14, color: t.text, fontSize: 28, letterSpacing: 10, textAlign: 'center' },
  submit: { background: t.accent, color: t.onAccent, border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 800, fontSize: 15, cursor: 'pointer' },
  error: { color: t.text, fontSize: 13, background: 'rgba(229,72,77,0.10)', borderLeft: `3px solid ${t.danger}`, borderRadius: 6, padding: '8px 10px' },
};
