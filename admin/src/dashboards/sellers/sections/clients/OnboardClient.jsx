/**
 * OnboardClient.jsx — Sales Partners › Clients › Onboard a client: give a
 * restaurant, coffee shop or wedding venue its owner login for the client
 * dashboard. A new email gets an account with a temporary password (shown
 * once); an email that already has an allinkigali account is simply linked.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Panel, ErrorText, Loading } from '../../../../components/ui';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField } from '../../../../components/form/Fields';
import { clientsApi, KIND } from './clientsApi';
import TempPassword from './TempPassword';

const EMPTY = { firstName: '', lastName: '', email: '', phone: '' };

export default function OnboardClient() {
  const [params] = useSearchParams();
  const [places, setPlaces] = useState(null);
  const [placeType, setPlaceType] = useState(params.get('type') || 'restaurant');
  const [placeId, setPlaceId] = useState(params.get('id') || '');
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => { clientsApi.places().then(setPlaces).catch((e) => setError(e.message)); }, []);

  const options = useMemo(() => (places || []).filter((p) => p.type === placeType)
    .map((p) => ({ value: p.id, label: `${p.name}${p.owners.length ? ` — has ${p.owners.length} owner login${p.owners.length === 1 ? '' : 's'}` : ''}` })), [places, placeType]);

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const r = await clientsApi.onboard({ placeType, placeId, ...f });
      const place = places.find((p) => p.type === placeType && p.id === placeId);
      setDone({ ...r, place: place?.name });
      setF(EMPTY);
      clientsApi.places().then(setPlaces).catch(() => {});
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  if (!places) return error ? <ErrorText>{error}</ErrorText> : <Loading />;
  return (
    <Panel title="Onboard a client">
      {done && (
        <TempPassword
          title={done.existingAccount ? `${done.name} now owns ${done.place} (existing account)` : `${done.place}: owner login ready for ${done.name}`}
          email={done.email} password={done.temporaryPassword} onDone={() => setDone(null)}
        />
      )}
      <FormGrid>
        <SelectField label="Kind of place" value={placeType} onChange={(v) => { setPlaceType(v); setPlaceId(''); }} options={Object.entries(KIND).map(([value, label]) => ({ value, label }))} />
        <SelectField label="Place" value={placeId} onChange={setPlaceId} placeholder="Choose…" options={options} />
        <Field label="Owner's first name" value={f.firstName} onChange={set('firstName')} />
        <Field label="Last name" value={f.lastName} onChange={set('lastName')} />
        <Field label="Owner's email" type="email" value={f.email} onChange={set('email')} hint="They sign in with it. If it already has an allinkigali account, that account is linked." />
        <Field label="Phone (optional)" value={f.phone} onChange={set('phone')} placeholder="078…" />
      </FormGrid>
      <ErrorText>{error}</ErrorText>
      <div style={{ marginTop: 16 }}>
        <Button onClick={submit} disabled={busy || !placeId || !f.email.trim()}>{busy ? 'Saving…' : 'Give owner login'}</Button>
      </div>
    </Panel>
  );
}
