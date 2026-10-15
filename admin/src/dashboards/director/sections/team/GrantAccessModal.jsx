/**
 * GrantAccessModal.jsx — give someone access, or change it. Office staff can
 * get several dashboards at once (tick News, Sales Partners and/or Finance);
 * a restaurant or coffee-shop owner has that one role plus the place they
 * own. If the email has no account yet, create it here.
 */
import React, { useEffect, useState } from 'react';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField } from '../../../../components/form/Fields';
import { ErrorText } from '../../../../components/ui';
import { t } from '../../../../theme';
import { directorApi } from '../../directorApi';

export const ROLES = [
  { value: 'news', label: 'News admin' },
  { value: 'sellers', label: 'Sales Partners admin' },
  { value: 'finance', label: 'Finance officer' },
  { value: 'restaurant', label: 'Restaurant owner' },
  { value: 'coffeeshop', label: 'Coffee shop owner' },
];
const STAFF = ['news', 'sellers', 'finance'];
const OWNERS = ['restaurant', 'coffeeshop'];

export default function GrantAccessModal({ member, onDone, onClose }) {
  const [form, setForm] = useState({
    email: member?.email || '', roles: member?.roles || (member?.role ? [member.role] : []),
    placeId: '', firstName: '', lastName: '', password: '',
  });
  const [needsAccount, setNeedsAccount] = useState(false);
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const owner = form.roles.find((r) => OWNERS.includes(r));

  // Staff dashboards combine; an owner role stands alone.
  const toggle = (r) => setForm((f) => {
    if (OWNERS.includes(r)) return { ...f, roles: f.roles.includes(r) ? [] : [r], placeId: '' };
    const staff = f.roles.filter((x) => STAFF.includes(x));
    return { ...f, roles: staff.includes(r) ? staff.filter((x) => x !== r) : [...staff, r] };
  });

  useEffect(() => { directorApi.places().then(setPlaces).catch(() => {}); }, []);
  const placeOptions = places.filter((p) => p.type === owner).map((p) => ({ value: String(p.id), label: `${p.name}${p.location ? ` — ${p.location}` : ''}` }));

  const save = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email) { setError('Email is required.'); return; }
    if (!form.roles.length) { setError('Tick at least one dashboard.'); return; }
    if (owner && !form.placeId) { setError(`Pick the ${owner === 'restaurant' ? 'restaurant' : 'coffee shop'} they own.`); return; }
    if (needsAccount && (!form.firstName.trim() || form.password.length < 8)) { setError('First name and a temporary password of at least 8 characters are needed.'); return; }
    setSaving(true); setError('');
    try {
      const body = { email, roles: form.roles };
      if (needsAccount) Object.assign(body, { firstName: form.firstName.trim(), lastName: form.lastName.trim(), password: form.password });
      const res = await directorApi.assignRole(body);
      if (owner) await directorApi.linkPlace(email, owner, form.placeId);
      onDone(res.created ? `Account created for ${email} — share the temporary password with them` : `${email} now has access`);
      onClose();
    } catch (e) {
      if (e.code === 'ACCOUNT_NOT_FOUND') { setNeedsAccount(true); setError(''); } else setError(e.message);
    }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title={member ? `Change access — ${member.email}` : needsAccount ? 'Create account & give access' : 'Give access'} width={520}>
      <ErrorText>{error}</ErrorText>
      {needsAccount && <p style={{ fontSize: 13, margin: '0 0 12px', color: t.textSecondary }}>No account uses {form.email}. Add their name and a temporary password to create one.</p>}
      <FormGrid>
        <Field label="Email" type="email" value={form.email} onChange={(v) => { set('email')(v); setNeedsAccount(false); }} full disabled={needsAccount || !!member} />
        <div style={s.picker}>
          <span style={s.label}>Dashboards — tick all they need</span>
          {ROLES.map((r) => {
            const on = form.roles.includes(r.value);
            const isOwnerRole = OWNERS.includes(r.value);
            return (
              <label key={r.value} style={{ ...s.option, ...(on ? s.optionOn : {}), ...(isOwnerRole && r.value === 'restaurant' ? s.ownersStart : {}) }}>
                <input type="checkbox" checked={on} onChange={() => toggle(r.value)} />
                <span>{r.label}</span>
                {isOwnerRole && <span style={s.note}>owner — on its own</span>}
              </label>
            );
          })}
        </div>
        {owner && <SelectField label={owner === 'restaurant' ? 'Their restaurant' : 'Their coffee shop'} value={form.placeId} onChange={set('placeId')} options={placeOptions} placeholder="— Pick —" full hint="They sign in at business.allinkigali.rw with this email (the business dashboard)." />}
        {needsAccount && (
          <>
            <Field label="First name *" value={form.firstName} onChange={set('firstName')} />
            <Field label="Last name" value={form.lastName} onChange={set('lastName')} />
            <Field label="Temporary password * (8+ characters)" value={form.password} onChange={set('password')} full />
          </>
        )}
      </FormGrid>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : needsAccount ? 'Create account & give access' : member ? 'Save' : 'Give access'}</Button>
      </ModalActions>
    </Modal>
  );
}

const s = {
  picker: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 },
  label: { color: t.textSecondary, fontSize: 13, fontWeight: 500, marginBottom: 2 },
  option: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: `1px solid ${t.borderLight}`, cursor: 'pointer', color: t.text, fontSize: 14 },
  optionOn: { background: t.bgActive, borderColor: t.accent },
  ownersStart: { marginTop: 8 },
  note: { marginLeft: 'auto', color: t.textMuted, fontSize: 12 },
};
