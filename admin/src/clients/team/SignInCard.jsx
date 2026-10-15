/**
 * SignInCard.jsx — shown once after adding someone (or giving a new PIN):
 * exactly what to tell them. The PIN isn't shown again afterwards.
 */
import React from 'react';
import { KeyRound } from 'lucide-react';
import { t } from '../../theme';
import Button from '../../components/common/Button';

export default function SignInCard({ person, onDone }) {
  const site = window.location.host;
  const text = `${person.name}: sign in at ${site} → Staff, phone ${person.phone}, PIN ${person.pin}`;
  const copy = () => navigator.clipboard?.writeText(text).catch(() => {});
  return (
    <div style={s.card}>
      <KeyRound size={22} color={t.lime} />
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={s.title}>Tell {person.name} how to sign in</div>
        <div style={s.line}>Open <b>{site}</b> → <b>Staff</b> · phone <b>{person.phone}</b> · PIN <b style={s.pin}>{person.pin}</b></div>
        <div style={s.note}>The PIN is shown only now. You can always give a new one with “Change”.</div>
      </div>
      <Button size="sm" variant="ghost" onClick={copy}>Copy</Button>
      <Button size="sm" variant="success" onClick={onDone}>Done</Button>
    </div>
  );
}

const s = {
  card: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: 'rgba(145,213,31,0.14)', border: `1px solid ${t.lime}`, borderRadius: 10, padding: '12px 14px', marginBottom: 16 },
  title: { fontWeight: 700, color: t.text },
  line: { color: t.textSecondary, fontSize: 14, marginTop: 2 },
  pin: { color: t.text, letterSpacing: 2, fontSize: 16, background: '#FFFFFF', borderRadius: 6, padding: '1px 8px' },
  note: { color: t.textMuted, fontSize: 12, marginTop: 4 },
};
