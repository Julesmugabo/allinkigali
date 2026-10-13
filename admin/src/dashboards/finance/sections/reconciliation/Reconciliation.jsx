/**
 * Reconciliation.jsx — match a bank account's statement against the ledger:
 * import statement lines (CSV), review suggested matches, accept one or all,
 * and see what's still unmatched on either side.
 *
 * CSV header row: date,description,debit,credit,reference
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Upload, Wand2, RefreshCw } from 'lucide-react';
import { DataTable } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { SelectField, TextAreaField } from '../../../../components/form/Fields';
import { useFinance } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { FIN } from '../../constants';
import { Panel, Kpi, KpiGrid, Loading, ErrorText, Money, formatRWF, fmtDate, Muted } from '../../components/ui';

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('Paste a header row and at least one data row.');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const vals = line.split(',');
    const row = {};
    headers.forEach((h, i) => { row[h] = (vals[i] || '').trim(); });
    return {
      date: row.date,
      description: row.description || row.desc || row.narration || '',
      debit: row.debit || '',
      credit: row.credit || '',
      reference: row.reference || row.ref || '',
    };
  });
}

export default function Reconciliation() {
  const { bankAccounts, notify } = useFinance();
  const [bank, setBank] = useState('');
  const [csv, setCsv] = useState('');
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!bank) return;
    setLoading(true); setError('');
    try {
      const [d, s] = await Promise.all([financeApi.reconUnmatched(bank), financeApi.reconSummary(bank)]);
      setData(d); setSummary(s);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [bank]);

  useEffect(() => { setData(null); setSummary(null); load(); }, [load]);

  const importCsv = async () => {
    try {
      const rows = parseCsv(csv);
      const r = await financeApi.reconImport(bank, rows);
      notify(`Imported ${r.imported} line(s), ${r.skipped_duplicates} duplicate(s) skipped`);
      setCsv(''); load();
    } catch (e) { setError(e.message); }
  };

  const match = async (matches) => {
    try {
      const r = await financeApi.reconMatch(matches);
      notify(`${r.matched} match(es) accepted`);
      load();
    } catch (e) { setError(e.message); }
  };

  return (
    <>
      <Panel title="Bank reconciliation" actions={bank && <Button variant="ghost" icon={RefreshCw} onClick={load}>Refresh</Button>}>
        <div style={{ maxWidth: 360 }}>
          <SelectField label="Bank account" value={bank} onChange={setBank}
            options={bankAccounts.map((b) => ({ value: String(b.id), label: b.name }))} placeholder="— Select a bank account —" />
        </div>
      </Panel>
      <ErrorText>{error}</ErrorText>
      {bank && loading && !data && <Loading />}
      {bank && summary && (
        <KpiGrid>
          <Kpi label="Ledger balance" value={formatRWF(summary.ledger_balance)} color={FIN.primary} />
          <Kpi label="Statement balance" value={formatRWF(summary.statement_balance)} color={FIN.purple} />
          <Kpi label="Difference" value={formatRWF(summary.difference)} color={Math.abs(summary.difference) < 0.01 ? FIN.income : FIN.expense} />
          <Kpi label="Unmatched statement lines" value={summary.unmatched_statement_lines ?? 0} color={FIN.warning} />
        </KpiGrid>
      )}
      {bank && (
        <Panel title="Import bank statement (CSV)" actions={<Button icon={Upload} onClick={importCsv} disabled={!csv.trim()}>Import</Button>}>
          <TextAreaField value={csv} onChange={setCsv} rows={5} mono
            placeholder={'date,description,debit,credit,reference\n2026-10-01,Client payment,,150000,TRX123'} />
        </Panel>
      )}
      {data && (
        <>
          <Panel
            title={`Suggested matches (${data.suggestions?.length || 0})`}
            actions={data.suggestions?.length > 0 && <Button variant="success" icon={Wand2} onClick={() => match(data.suggestions)}>Accept all</Button>}
          >
            <DataTable
              columns={[
                { key: 'pair', label: 'Statement → ledger', render: (r) => `Statement #${r.statement_line_id} → Transaction #${r.transaction_id}` },
                { key: 'confidence', label: 'Confidence', render: (r) => <span style={{ color: r.confidence === 'high' ? FIN.income : FIN.warning }}>{r.confidence}</span> },
                { key: 'reason', label: 'Why' },
                { key: 'a', label: '', render: (r) => <Button size="sm" variant="success" onClick={() => match([r])}>Accept</Button> },
              ]}
              rows={(data.suggestions || []).map((r, i) => ({ id: i, ...r }))}
              emptyText="No suggested matches."
            />
          </Panel>
          <Panel title={`Unmatched statement lines (${data.statementLines?.length || 0})`}>
            <DataTable
              columns={[
                { key: 'stmt_date', label: 'Date', render: (r) => fmtDate(r.stmt_date) },
                { key: 'description', label: 'Description' },
                { key: 'amount', label: 'Amount', render: (r) => <Money value={r.amount} /> },
              ]}
              rows={data.statementLines || []}
              emptyText="All statement lines are matched."
            />
          </Panel>
          <Panel title={`Unmatched ledger transactions (${data.ledgerTransactions?.length || 0})`}>
            <DataTable
              columns={[
                { key: 'txn_date', label: 'Date', render: (r) => fmtDate(r.txn_date) },
                { key: 'txn_ref', label: 'Ref' },
                { key: 'description', label: 'Description' },
                { key: 'amount', label: 'Amount', render: (r) => <Money value={r.amount} type={r.txn_type} /> },
              ]}
              rows={data.ledgerTransactions || []}
              emptyText="All posted transactions are matched."
            />
            <Muted>Only posted transactions on this bank account can be matched.</Muted>
          </Panel>
        </>
      )}
    </>
  );
}
