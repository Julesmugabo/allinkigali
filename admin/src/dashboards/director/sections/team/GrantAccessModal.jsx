/**
 * GrantAccessModal.jsx — give someone a role. For restaurant / coffee-shop
 * owners, also pick the place they own (the link is what lets their
 * dashboard open). If the email has no account yet, create it here.
 */
import React, { useEffect, useState } from 'react';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField } from '../../../../components/form/Fields';
import { ErrorText } from '../../../../components/ui';
import { directorApi } from '../../directorApi';

export const ROLES = [
  { value: 'news', label: 'News admin' },
  { value: 'sellers', label: 'Sales Partners admin' },
  { value: 'finance', label: 'Finance officer' },
  { value: 'restaurant', label: 'Restaurant owner' },
  { value: 'coffeeshop', label: 'Coffee shop owner' },
];

export default function GrantAccessModal({ onDone, onClose }) {
  const [form, setForm] = useState({ email: '', role: 'news', placeId: '', firstName: '', lastName: '', password: '' });
  const [needsAccount, setNeedsAccount] = useState(false);
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const isOwner = form.role === 'restaurant' || form.role === 'coffeeshop';

  useEffect(() => { directorApi.places().then(setPlaces).catch(() => {}); }, []);
  const placeOptions = places.filter((p) => p.type === form.role).map((p) => ({ value: String(p.id), label: `${p.name}${p.location ? ` — ${p.location}` : ''}` }));

  const save = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email) { setError('Email is required.'); return; }
    if (isOwner && !form.placeId) { setError(`Pick the ${form.role === 'restaurant' ? 'restaurant' : 'coffee shop'} they own.`); return; }
    if (needsAccount && (!form.firstName.trim() || form.password.length < 8)) { setError('First name and a temporary password of at least 8 characters are needed.'); return; }
    setSaving(true); setError('');
    try {
      const body = { email, role: form.role };
      if (needsAccount) Object.assign(body, { firstName: form.firstName.trim(), lastName: form.lastName.trim(), password: form.password });
      const res = await directorApi.assignRole(body);
      if (isOwner) await directorApi.linkPlace(email, form.role, form.placeId);
      onDone(res.created ? `Account created for ${email} — share the temporary password with them` : `${email} now has access`);
      onClose();
    } catch (e) {
      if (e.code === 'ACCOUNT_NOT_FOUND') { setNeedsAccount(true); setError(''); } else setError(e.message);
    }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title={needsAccount ? 'Create account & give access' : 'Give access'} width={520}>
      <ErrorText>{error}</ErrorText>
      {needsAccount && <p style={{ fontSize: 13, margin: '0 0 12px', color: '#94A3B8' }}>No account uses {form.email}. Add their name and a temporary password to create one.</p>}
      <FormGrid>
        <Field label="Email" type="email" value={form.email} onChange={(v) => { set('email')(v); setNeedsAccount(false); }} full disabled={needsAccount} />
        <SelectField label="Role" value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v, placeId: '' }))} options={ROLES} full />
        {isOwner && <SelectField label={form.role === 'restaurant' ? 'Their restaurant' : 'Their coffee shop'} value={form.placeId} onChange={set('placeId')} options={placeOptions} placeholder="— Pick —" full />}
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
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : needsAccount ? 'Create account & give access' : 'Give access'}</Button>
      </ModalActions>
    </Modal>
  );
}
