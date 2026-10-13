/**
 * Thresholds.jsx — approval limits: transactions in an amount range need
 * sign-off before they can be posted.
 */
import React, { useState } from 'react';
import { DataTable } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField } from '../../../../components/form/Fields';
import { useFinance, useFinanceData } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { Panel, Loading, ErrorText, StatusBadge, Money, RowActions } from '../../components/ui';

const TYPES = [
  { value: 'all', label: 'All transactions' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];
const ROLES = [
  { value: 'finance', label: 'Finance officer' },
  { value: 'director', label: 'Director' },
];
const blank = { txn_type: 'all', min_amount: '', max_amount: '', required_role: 'finance', description: '' };

export default function Thresholds() {
  const { changed, notify } = useFinance();
  const { data, loading, error } = useFinanceData(() => financeApi.thresholds());
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const add = async () => {
    if (form.min_amount === '') { setFormError('Minimum amount is required.'); return; }
    setFormError('');
    try {
      await financeApi.createThreshold({ ...form, min_amount: parseFloat(form.min_amount), max_amount: form.max_amount ? parseFloat(form.max_amount) : null });
      setForm(blank); notify('Approval limit added'); changed();
    } catch (e) { setFormError(e.message); }
  };

  const toggle = async (th) => {
    try { await financeApi.updateThreshold(th.id, { ...th, is_active: !th.is_active }); changed(); }
    catch (e) { alert(e.message); }
  };
  const remove = async (th) => {
    if (!window.confirm('Delete this approval limit?')) return;
    try { await financeApi.deleteThreshold(th.id); notify('Approval limit deleted'); changed(); }
    catch (e) { alert(e.message); }
  };

  return (
    <>
      <Panel title="Add approval limit" actions={<Button onClick={add}>Add</Button>}>
        <ErrorText>{formError}</ErrorText>
        <FormGrid>
          <SelectField label="Applies to" value={form.txn_type} onChange={set('txn_type')} options={TYPES} />
          <Field label="From amount (RWF) *" type="number" min="0" value={form.min_amount} onChange={set('min_amount')} />
          <Field label="Up to amount (RWF)" type="number" min="0" value={form.max_amount} onChange={set('max_amount')} hint="Empty = no upper limit" />
          <SelectField label="Must be approved by" value={form.required_role} onChange={set('required_role')} options={ROLES} />
          <Field label="Note" value={form.description} onChange={set('description')} full />
        </FormGrid>
      </Panel>
      <Panel title="Approval limits">
        <ErrorText>{error}</ErrorText>
        {loading ? <Loading /> : (
          <DataTable
            columns={[
              { key: 'txn_type', label: 'Applies to' },
              { key: 'range', label: 'Amount range', render: (th) => <><Money value={th.min_amount} /> → {th.max_amount != null ? <Money value={th.max_amount} /> : 'no limit'}</> },
              { key: 'required_role', label: 'Approved by' },
              { key: 'description', label: 'Note', render: (th) => th.description || '—' },
              { key: 'is_active', label: 'Status', render: (th) => <StatusBadge status={th.is_active ? 'active' : 'inactive'} /> },
              {
                key: 'a', label: '', render: (th) => (
                  <RowActions>
                    <Button size="sm" variant="ghost" onClick={() => toggle(th)}>{th.is_active ? 'Disable' : 'Enable'}</Button>
                    <Button size="sm" variant="danger" onClick={() => remove(th)}>Delete</Button>
                  </RowActions>
                ),
              },
            ]}
            rows={data || []}
            emptyText="No approval limits — any amount can be posted without sign-off."
          />
        )}
      </Panel>
    </>
  );
}
