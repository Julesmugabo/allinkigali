/**
 * BudgetModal.jsx — new budget: name, fiscal year, department and one line
 * per expense account with its approved amount.
 */
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { t } from '../../../../theme';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField } from '../../../../components/form/Fields';
import { useFinance } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { ErrorText, formatRWF } from '../../components/ui';

export default function BudgetModal({ onClose }) {
  const { accounts, departments, changed, notify } = useFinance();
  const [form, setForm] = useState({ name: '', fiscal_year: String(new Date().getFullYear()), department_id: '' });
  const [lines, setLines] = useState([{ account_id: '', approved_amount: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setLine = (i, k, v) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  const expenseAccounts = accounts.filter((a) => a.account_type === 'expense');
  const total = lines.reduce((sum, l) => sum + (parseFloat(l.approved_amount) || 0), 0);

  const save = async () => {
    if (!form.name.trim() || !form.fiscal_year) { setError('Name and fiscal year are required.'); return; }
    const used = lines.filter((l) => l.account_id && l.approved_amount);
    setSaving(true); setError('');
    try {
      await financeApi.createBudget({
        name: form.name.trim(),
        fiscal_year: parseInt(form.fiscal_year, 10),
        department_id: form.department_id || null,
        lines: used.map((l) => ({ account_id: parseInt(l.account_id, 10), approved_amount: parseFloat(l.approved_amount) })),
      });
      notify('Budget created');
      changed();
      onClose();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title="New Budget" width={640}>
      <ErrorText>{error}</ErrorText>
      <FormGrid>
        <Field label="Budget name *" value={form.name} onChange={set('name')} placeholder="e.g. 2026 Operations" full />
        <Field label="Fiscal year *" type="number" value={form.fiscal_year} onChange={set('fiscal_year')} />
        <SelectField label="Department" value={form.department_id} onChange={set('department_id')}
          options={departments.map((d) => ({ value: String(d.id), label: d.name }))} placeholder="All departments" />
      </FormGrid>
      <div style={s.head}>
        <span style={s.label}>Lines (expense accounts)</span>
        <Button size="sm" variant="info" icon={Plus} onClick={() => setLines((ls) => [...ls, { account_id: '', approved_amount: '' }])}>Add line</Button>
      </div>
      {lines.map((l, i) => (
        <div key={i} style={s.line}>
          <select value={l.account_id} onChange={(e) => setLine(i, 'account_id', e.target.value)} style={{ flex: 2, minWidth: 0 }}>
            <option value="">— Account —</option>
            {expenseAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
          </select>
          <input type="number" min="0" placeholder="Approved amount" value={l.approved_amount} onChange={(e) => setLine(i, 'approved_amount', e.target.value)} style={{ flex: 1, minWidth: 0 }} />
          {lines.length > 1 && <button onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} style={s.remove}><X size={14} /></button>}
        </div>
      ))}
      <div style={{ color: t.textSecondary, fontSize: 13 }}>Total: <b style={{ color: t.text }}>{formatRWF(total)}</b></div>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Create budget'}</Button>
      </ModalActions>
    </Modal>
  );
}

const s = {
  label: { color: t.textSecondary, fontSize: 13, fontWeight: 500 },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '18px 0 10px' },
  line: { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' },
  remove: { background: 'transparent', color: t.inkStatus || t.danger, padding: 6 },
};
