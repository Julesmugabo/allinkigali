/**
 * Departments.jsx — departments used to split budgets and spending.
 */
import React, { useState } from 'react';
import { DataTable } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { useFinance } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { Panel, ErrorText } from '../../components/ui';

export default function Departments() {
  const { departments, changed, notify } = useFinance();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try { await financeApi.createDepartment({ name: name.trim(), code: code.trim() || null }); setName(''); setCode(''); notify('Department added'); changed(); }
    catch (err) { setError(err.message); }
    setSaving(false);
  };

  return (
    <Panel title="Departments">
      <ErrorText>{error}</ErrorText>
      <form onSubmit={add} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Department name" style={{ flex: 2, minWidth: 180 }} />
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (optional)" style={{ flex: 1, minWidth: 120 }} />
        <Button type="submit" disabled={saving}>Add</Button>
      </form>
      <DataTable columns={[{ key: 'code', label: 'Code', render: (d) => d.code || '—' }, { key: 'name', label: 'Name' }]}
        rows={departments} emptyText="No departments yet." />
    </Panel>
  );
}
