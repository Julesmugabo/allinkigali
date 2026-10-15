/**
 * JournalModal.jsx — manual double-entry journal. Needs at least two lines
 * and debits must equal credits before it can be saved.
 */
import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { t } from '../../../../theme';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField, TextAreaField } from '../../../../components/form/Fields';
import { useFinance } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { today } from '../../constants';
import { ErrorText, formatRWF } from '../../components/ui';

const blankLine = () => ({ account_id: '', debit: '', credit: '', description: '' });

export default function JournalModal({ onClose }) {
  const { accounts, changed, notify } = useFinance();
  const [form, setForm] = useState({ txn_date: today(), description: '', notes: '', status: 'draft' });
  const [lines, setLines] = useState([blankLine(), blankLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setLine = (i, k, v) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));

  const totalD = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalC = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const balanced = totalD > 0 && Math.abs(totalD - totalC) < 0.01;
  const accountOpts = accounts.map((a) => ({ value: String(a.id), label: `${a.code} — ${a.name}` }));

  const save = async () => {
    if (!form.description.trim()) { setError('Description is required.'); return; }
    const used = lines.filter((l) => l.account_id && (parseFloat(l.debit) || parseFloat(l.credit)));
    if (used.length < 2) { setError('At least two lines with an account and an amount are required.'); return; }
    if (!balanced) { setError('Debits and credits must be equal.'); return; }
    setSaving(true); setError('');
    try {
      await financeApi.createJournal({
        ...form,
        lines: used.map((l) => ({ ...l, debit: parseFloat(l.debit) || 0, credit: parseFloat(l.credit) || 0 })),
      });
      notify('Journal entry created');
      changed();
      onClose();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title="Journal Entry" width={760}>
      <ErrorText>{error}</ErrorText>
      <FormGrid>
        <Field label="Date" type="date" value={form.txn_date} onChange={set('txn_date')} />
        <SelectField label="Save as" value={form.status} onChange={set('status')}
          options={[{ value: 'draft', label: 'Draft' }, { value: 'pending_approval', label: 'Submit for approval' }]} />
        <Field label="Description *" value={form.description} onChange={set('description')} full />
      </FormGrid>

      <div style={s.linesHead}>
        <span style={s.label}>Lines</span>
        <Button size="sm" variant="info" icon={Plus} onClick={() => setLines((ls) => [...ls, blankLine()])}>Add line</Button>
      </div>
      {lines.map((l, i) => (
        <div key={i} style={s.line}>
          <select value={l.account_id} onChange={(e) => setLine(i, 'account_id', e.target.value)} style={{ flex: 2, minWidth: 0 }}>
            <option value="">— Account —</option>
            {accountOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input type="number" min="0" placeholder="Debit" value={l.debit} onChange={(e) => setLine(i, 'debit', e.target.value)} style={s.num} />
          <input type="number" min="0" placeholder="Credit" value={l.credit} onChange={(e) => setLine(i, 'credit', e.target.value)} style={s.num} />
          <input placeholder="Line note" value={l.description} onChange={(e) => setLine(i, 'description', e.target.value)} style={{ flex: 1.5, minWidth: 0 }} />
          {lines.length > 2 && (
            <button onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} style={s.remove} title="Remove line"><X size={14} /></button>
          )}
        </div>
      ))}
      <div style={s.totals}>
        <span>Debits: <b>{formatRWF(totalD)}</b></span>
        <span>Credits: <b>{formatRWF(totalC)}</b></span>
        <span style={{ color: balanced ? t.success : t.danger }}>{balanced ? 'Balanced' : `Off by ${formatRWF(Math.abs(totalD - totalC))}`}</span>
      </div>

      <div style={{ marginTop: 14 }}>
        <TextAreaField label="Notes" value={form.notes} onChange={set('notes')} rows={2} />
      </div>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving || !balanced}>{saving ? 'Saving...' : 'Create journal'}</Button>
      </ModalActions>
    </Modal>
  );
}

const s = {
  label: { color: t.textSecondary, fontSize: 13, fontWeight: 500 },
  linesHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '18px 0 10px' },
  line: { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' },
  num: { width: 110 },
  remove: { background: 'transparent', color: t.inkStatus || t.danger, padding: 6 },
  totals: { display: 'flex', gap: 20, flexWrap: 'wrap', color: t.textSecondary, fontSize: 13, marginTop: 6 },
};
