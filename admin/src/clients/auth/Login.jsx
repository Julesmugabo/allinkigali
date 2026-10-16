/**
 * Login.jsx — the client dashboard's door. Owners and managers sign in with
 * the email their account uses; waiters, kitchen staff and cashiers with
 * their phone number and the PIN the owner gave them. Tablets connect with a
 * one-time code (see DeviceConnect).
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../../theme';
import { session, ROLE_LABEL } from '../session';
import PasswordInput from '../../components/common/PasswordInput';

export default function Login({ onSignedIn }) {
  const [tab, setTab] = useState('owner');
  const [form, setForm] = useState({ email: '', password: '', phone: '', pin: '' });
  const [choices, setChoices] = useState(null); // PIN works at several places
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e, memberId) => {
    e?.preventDefault();
    setBusy(true); setError('');
    try {
      if (tab === 'owner') { await session.ownerLogin(form.email, form.password); onSignedIn(); }
      else {
        const d = await session.staffLogin(form.phone, form.pin, memberId);
        if (d.choose) setChoices(d.choose); else onSignedIn();
      }
    } catch (err) { setError(err.message); }
    setBusy(false);
  };

  return (
    <div style={s.page}>
      <form onSubmit={submit} style={s.card}>
        <img src="/logo-wordmark-dark.png" alt="AllinKigali" style={{ height: 28, alignSelf: 'center' }} />
        <div style={s.title}>Business dashboard</div>
        <div style={s.tabs}>
          {[['owner', 'Owner / manager'], ['staff', 'Staff']].map(([k, label]) => (
            <button key={k} type="button" onClick={() => { setTab(k); setError(''); setChoices(null); }} style={{ ...s.tab, ...(tab === k ? s.tabOn : {}) }}>{label}</button>
          ))}
        </div>
        {choices ? (
          <>
            <div style={s.hint}>Your PIN works at more than one place. Where are you working now?</div>
            {choices.map((c) => (
              <button key={c.memberId} type="button" onClick={() => submit(null, c.memberId)} style={s.choice}>{c.placeName} · {ROLE_LABEL[c.role]}</button>
            ))}
          </>
        ) : tab === 'owner' ? (
          <>
            <label style={s.label}>Email<input type="email" value={form.email} onChange={set('email')} style={s.input} autoComplete="username" required /></label>
            <label style={s.label}>Password<PasswordInput value={form.password} onChange={set('password')} style={s.input} autoComplete="current-password" required /></label>
          </>
        ) : (
          <>
            <label style={s.label}>Phone number<input type="tel" value={form.phone} onChange={set('phone')} placeholder="07…" style={s.input} required /></label>
            <label style={s.label}>PIN<PasswordInput inputMode="numeric" maxLength={6} value={form.pin} onChange={set('pin')} style={{ ...s.input, letterSpacing: 6 }} required /></label>
          </>
        )}
        {error ? <div style={s.error}>{error}</div> : null}
        {!choices && <button type="submit" disabled={busy} style={s.submit}>{busy ? 'Signing in…' : 'Sign in'}</button>}
        <Link to="/device" style={s.link}>Connect a kitchen or bar tablet</Link>
        <div style={s.foot}>Not a client yet? Contact allinkigali to list your restaurant, café or venue.</div>
      </form>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg, fontFamily: t.font, padding: 16 },
  card: { width: 380, maxWidth: '100%', background: t.bgCard, border: `1px solid ${t.borderLight}`, borderTop: `4px solid ${t.lime}`, borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 14, color: t.text, boxShadow: t.shadowLg },
  title: { textAlign: 'center', color: t.textSecondary, fontWeight: 600, marginTop: -4 },
  tabs: { display: 'flex', background: t.bg, borderRadius: 10, padding: 4 },
  tab: { flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: 'transparent', color: t.textSecondary, fontWeight: 600, cursor: 'pointer' },
  tabOn: { background: t.bgCard, color: t.text, boxShadow: t.shadow },
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: t.textSecondary },
  input: { background: t.bg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '11px 12px', color: t.text, fontSize: 15 },
  error: { color: t.text, fontSize: 13, background: 'rgba(229,72,77,0.10)', borderLeft: `3px solid ${t.danger}`, borderRadius: 6, padding: '8px 10px' },
  submit: { background: t.accent, color: t.onAccent, border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 800, fontSize: 15, cursor: 'pointer' },
  hint: { color: t.textSecondary, fontSize: 14 },
  choice: { background: t.bgCard, color: t.text, border: `1px solid ${t.borderLight}`, borderRadius: 10, padding: 12, textAlign: 'left', cursor: 'pointer', fontWeight: 600 },
  link: { color: t.text, fontSize: 13, textAlign: 'center' },
  foot: { color: t.textMuted, fontSize: 12, textAlign: 'center' },
};
