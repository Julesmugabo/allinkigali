/**
 * TempPassword.jsx — an owner's sign-in details, shown once (after giving a
 * place its owner login, or a new password): where to sign in, the email,
 * and the temporary password, with Copy.
 */
import React from 'react';
import { KeyRound } from 'lucide-react';
import { t } from '../../../../theme';
import Button from '../../../../components/common/Button';
import { CLIENTS_URL } from '../../../../utils/openClientDashboard';

export default function TempPassword({ title, email, password, onDone }) {
  const site = CLIENTS_URL.replace(/^https?:\/\//, '');
  const text = password
    ? `Sign in at ${site} with ${email} and the temporary password ${password}`
    : `Sign in at ${site} with ${email} and your usual allinkigali password`;
  return (
    <div style={s.card}>
      <KeyRound size={22} color={t.success} />
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ fontWeight: 700 }}>{title}</div>
        <div style={s.line}>
          Sign in at <b>{site}</b> · <b>{email}</b>
          {password ? <> · temporary password <b style={s.pw}>{password}</b></> : ' · their usual allinkigali password'}
        </div>
        {password && <div style={s.note}>Shown only now. Send it privately (SMS or WhatsApp to the owner, not a group).</div>}
      </div>
      <Button size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(text).catch(() => {})}>Copy</Button>
      <Button size="sm" variant="success" onClick={onDone}>Done</Button>
    </div>
  );
}

const s = {
  card: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: 'rgba(74,222,128,0.1)', border: `1px solid ${t.success}55`, borderRadius: 10, padding: '12px 14px', marginBottom: 16, color: t.text },
  line: { color: t.textSecondary, fontSize: 14, marginTop: 2 },
  pw: { color: t.success, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 15 },
  note: { color: t.textMuted, fontSize: 12, marginTop: 4 },
};
