/**
 * ImportExport.jsx — bulk-import transactions from CSV, and download the
 * period's transactions / statements as CSV.
 *
 * Import CSV header: date,type,description,amount,payment_method,reference
 */
import React, { useState } from 'react';
import { Upload, Download } from 'lucide-react';
import { t } from '../../../../theme';
import Button from '../../../../components/common/Button';
import { TextAreaField, CheckboxField } from '../../../../components/form/Fields';
import { useFinance } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { Panel, ErrorText, Muted } from '../../components/ui';

function parse(text, autoPost) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('Paste a header row and at least one data row.');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  for (const need of ['date', 'description', 'amount']) {
    if (!headers.includes(need)) throw new Error(`Missing "${need}" column in the header row.`);
  }
  return lines.slice(1).map((line) => {
    const vals = line.split(',');
    const row = {};
    headers.forEach((h, i) => { row[h] = (vals[i] || '').trim(); });
    return { ...row, type: row.type || row.txn_type || 'expense', auto_post: autoPost };
  });
}

export default function ImportExport() {
  const { range, changed, notify } = useFinance();
  const [csv, setCsv] = useState('');
  const [autoPost, setAutoPost] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const doImport = async () => {
    setError('');
    let rows;
    try { rows = parse(csv, autoPost); } catch (e) { setError(e.message); return; }
    if (!window.confirm(`Import ${rows.length} transaction(s)${autoPost ? ' as POSTED' : ' as drafts'}?`)) return;
    setBusy(true);
    try {
      const r = await financeApi.importTransactions(rows);
      notify(`Imported ${r.imported} transaction(s)`);
      setCsv('');
      changed();
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const download = async (fn) => {
    try { await fn(); } catch (e) { alert(e.message); }
  };

  return (
    <>
      <Panel title="Import transactions (CSV)" actions={<Button icon={Upload} onClick={doImport} disabled={busy || !csv.trim()}>{busy ? 'Importing...' : 'Import'}</Button>}>
        <ErrorText>{error}</ErrorText>
        <TextAreaField value={csv} onChange={setCsv} rows={7} mono
          placeholder={'date,type,description,amount,payment_method,reference\n2026-10-01,expense,Office supplies,45000,cash,RCPT-88\n2026-10-02,income,Ad sale - Bralirwa,300000,bank_transfer,INV-12'} />
        <div style={{ marginTop: 10 }}>
          <CheckboxField label="Post immediately (otherwise they're saved as drafts for review)" checked={autoPost} onChange={setAutoPost} />
        </div>
        <Muted>Rows with an amount of zero or less are skipped. Type is income or expense (defaults to expense).</Muted>
      </Panel>

      <Panel title={`Export · ${range.from} → ${range.to}`}>
        <div style={s.row}>
          <Button variant="info" icon={Download} onClick={() => download(() => financeApi.exportTransactions(range))}>Transactions</Button>
          <Button variant="info" icon={Download} onClick={() => download(() => financeApi.exportReport('income-expenditure', range))}>Income &amp; Expenditure</Button>
          <Button variant="info" icon={Download} onClick={() => download(() => financeApi.exportReport('trial-balance', range))}>Trial Balance</Button>
        </div>
        <p style={{ color: t.textMuted, fontSize: 12, marginTop: 10 }}>Uses the period selected at the top of the page.</p>
      </Panel>
    </>
  );
}

const s = { row: { display: 'flex', gap: 10, flexWrap: 'wrap' } };
