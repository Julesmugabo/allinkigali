/**
 * OrgProfile.jsx — the organisation's legal details used on finance records.
 */
import React, { useEffect, useState } from 'react';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField, TextAreaField } from '../../../../components/form/Fields';
import { useFinance, useFinanceData } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { Panel, Loading, ErrorText } from '../../components/ui';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  .map((m, i) => ({ value: String(i + 1), label: m }));

export default function OrgProfile() {
  const { notify } = useFinance();
  const { data, loading, error } = useFinanceData(() => financeApi.organization());
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  useEffect(() => { if (data) setForm(data); }, [data]);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true); setSaveError('');
    try {
      setForm(await financeApi.saveOrganization({ ...form, fiscal_year_start_month: parseInt(form.fiscal_year_start_month, 10) || 1 }));
      notify('Organisation profile saved');
    } catch (e) { setSaveError(e.message); }
    setSaving(false);
  };

  if (loading || !form) return <Loading />;
  return (
    <Panel title="Organisation profile" actions={<Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>}>
      <ErrorText>{error || saveError}</ErrorText>
      <FormGrid>
        <Field label="Legal name" value={form.legal_name} onChange={set('legal_name')} />
        <Field label="Display name" value={form.display_name} onChange={set('display_name')} />
        <Field label="Phone" value={form.phone} onChange={set('phone')} />
        <Field label="Email" value={form.email} onChange={set('email')} />
        <Field label="Primary currency" value={form.primary_currency || 'RWF'} onChange={set('primary_currency')} />
        <SelectField label="Fiscal year starts in" value={String(form.fiscal_year_start_month || 1)} onChange={set('fiscal_year_start_month')} options={MONTHS} />
        <TextAreaField label="Address" value={form.address} onChange={set('address')} rows={2} />
      </FormGrid>
    </Panel>
  );
}
