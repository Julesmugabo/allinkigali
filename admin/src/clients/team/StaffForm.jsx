/**
 * StaffForm.jsx — add a person, or change one: name, role, phone (how they
 * sign in), the PIN (4–6 digits; leave empty when editing to keep it) and,
 * for waiters, their section. Owners can add managers; managers add
 * waiters, kitchen staff and cashiers.
 */
import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Modal, { ModalActions } from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { FormGrid, Field, SelectField } from '../../components/form/Fields';
import { ErrorText } from '../../components/ui';
import { ROLE_LABEL } from '../session';
import { randomPin } from './teamApi';

const ROLE_HINT = {
  manager: 'Everything except managing other managers',
  waiter: 'The waiter board',
  kitchen: 'The kitchen screen',
  cashier: 'The waiter board (bills) and the sales report',
};

export default function StaffForm({ person, myRole, sections, onSave, onClose }) {
  const editing = !!person;
  const [f, setF] = useState({
    name: person?.name || '', phone: person?.phone ? `0${person.phone}` : '', role: person?.role || 'waiter',
    sectionId: person?.sectionId || '', pin: editing ? '' : randomPin(),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const roles = (myRole === 'owner' ? ['manager'] : []).concat(['waiter', 'kitchen', 'cashier']);

  const save = async () => {
    setBusy(true); setError('');
    const body = { name: f.name, role: f.role, sectionId: f.role === 'waiter' ? f.sectionId || null : null };
    if (!editing) Object.assign(body, { phone: f.phone, pin: f.pin });
    else if (f.pin) body.pin = f.pin;
    try { await onSave(body, f); } catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={editing ? `Change ${person.name}` : 'Add a person'} width={520}>
      <FormGrid>
        <Field label="Name" value={f.name} onChange={set('name')} placeholder="e.g. Aline Uwase" full />
        <SelectField label="Role" value={f.role} onChange={set('role')} options={roles.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} hint={ROLE_HINT[f.role]} />
        {f.role === 'waiter' && sections.length > 0 ? (
          <SelectField label="Section" value={f.sectionId} onChange={set('sectionId')} placeholder="All tables" options={sections.map((x) => ({ value: x.id, label: x.name }))} />
        ) : <div />}
        <Field label="Phone number" value={f.phone} onChange={set('phone')} placeholder="078…" disabled={editing} hint={editing ? 'To change the phone, add the person again.' : 'They sign in with this number.'} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Field label={editing ? 'New PIN (optional)' : 'PIN'} value={f.pin} onChange={(v) => set('pin')(v.replace(/\D/g, '').slice(0, 6))} placeholder={editing ? 'Keep the current PIN' : '4–6 digits'} inputMode="numeric" />
          </div>
          <Button variant="ghost" type="button" onClick={() => set('pin')(randomPin())} icon={RefreshCw} style={{ marginBottom: 2 }}>New</Button>
        </div>
      </FormGrid>
      <ErrorText>{error}</ErrorText>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={busy || !f.name.trim() || (!editing && (!f.phone || f.pin.length < 4))}>{busy ? 'Saving…' : editing ? 'Save' : 'Add'}</Button>
      </ModalActions>
    </Modal>
  );
}
