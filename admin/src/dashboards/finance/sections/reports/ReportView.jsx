/**
 * ReportView.jsx — renders one financial statement from the server's data.
 * Each report kind has its own small renderer below.
 */
import React from 'react';
import { t } from '../../../../theme';
import { DataTable } from '../../../../components/PageShell';
import { FIN } from '../../constants';
import { Money, formatRWF, fmtDate } from '../../components/ui';

function Line({ label, amount, bold, color }) {
  return (
    <div style={{ ...s.line, ...(bold ? s.lineBold : {}) }}>
      <span>{label}</span>
      <span style={{ color: color || t.text }}>{formatRWF(amount)}</span>
    </div>
  );
}

const Sub = ({ children }) => <div style={s.sub}>{children}</div>;
const rowsOf = (d) => (Array.isArray(d) ? d : d?.rows || []);
const withIds = (rows) => rows.map((r, i) => ({ id: i, ...r }));

function IncomeExpenditure({ data }) {
  const { income = [], expenses = [], totalIncome = 0, totalExpenses = 0 } = data;
  const net = totalIncome - totalExpenses;
  return (
    <>
      <Sub>Income</Sub>
      {income.map((r) => <Line key={`i${r.code}`} label={`${r.code} ${r.name}`} amount={r.total} />)}
      <Line label="Total income" amount={totalIncome} bold />
      <Sub>Expenses</Sub>
      {expenses.map((r) => <Line key={`e${r.code}`} label={`${r.code} ${r.name}`} amount={r.total} />)}
      <Line label="Total expenses" amount={totalExpenses} bold />
      <Line label="Net surplus / (deficit)" amount={net} bold color={net >= 0 ? FIN.income : FIN.expense} />
    </>
  );
}

function TrialBalance({ data }) {
  const rows = rowsOf(data);
  const td = rows.reduce((sum, r) => sum + Number(r.total_debit || 0), 0);
  const tc = rows.reduce((sum, r) => sum + Number(r.total_credit || 0), 0);
  return (
    <>
      <DataTable
        columns={[
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Account' },
          { key: 'total_debit', label: 'Debit', render: (r) => (Number(r.total_debit) ? <Money value={r.total_debit} /> : '') },
          { key: 'total_credit', label: 'Credit', render: (r) => (Number(r.total_credit) ? <Money value={r.total_credit} /> : '') },
        ]}
        rows={withIds(rows)}
        emptyText="No posted entries yet."
      />
      <Line label="Total debits" amount={td} bold />
      <Line label={Math.abs(td - tc) < 0.01 ? 'Total credits (balanced)' : 'Total credits (NOT balanced)'} amount={tc} bold
        color={Math.abs(td - tc) < 0.01 ? FIN.income : FIN.expense} />
    </>
  );
}

function Aging({ data }) {
  return (
    <DataTable
      columns={[
        { key: 'contact_name', label: 'Contact' },
        { key: 'invoice_number', label: 'Invoice #' },
        { key: 'due_date', label: 'Due', render: (r) => fmtDate(r.due_date) },
        { key: 'outstanding', label: 'Outstanding', render: (r) => <Money value={r.outstanding} /> },
        { key: 'aging_bucket', label: 'Age', render: (r) => String(r.aging_bucket || '').replace(/_/g, ' ') },
      ]}
      rows={withIds(rowsOf(data))}
      emptyText="Nothing outstanding."
    />
  );
}

function BalanceSheet({ data }) {
  const { assets = [], liabilities = [], equity = [], totalAssets = 0, totalLiabilities = 0, totalEquity = 0 } = data;
  const balanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;
  return (
    <>
      <Sub>Assets</Sub>
      {assets.map((r) => <Line key={`a${r.code}`} label={`${r.code} ${r.name}`} amount={r.balance} />)}
      <Line label="Total assets" amount={totalAssets} bold />
      <Sub>Liabilities</Sub>
      {liabilities.map((r) => <Line key={`l${r.code}`} label={`${r.code} ${r.name}`} amount={r.balance} />)}
      <Line label="Total liabilities" amount={totalLiabilities} bold />
      <Sub>Equity</Sub>
      {equity.map((r) => <Line key={`q${r.code}`} label={`${r.code} ${r.name}`} amount={r.balance} />)}
      <Line label="Total equity" amount={totalEquity} bold />
      <Line label="Liabilities + equity" amount={totalLiabilities + totalEquity} bold color={balanced ? FIN.income : FIN.expense} />
    </>
  );
}

function CashFlow({ data }) {
  const { totalInflows = 0, totalOutflows = 0, netCashFlow = 0, byPaymentMethod = [] } = data;
  return (
    <>
      <Line label="Cash inflows" amount={totalInflows} color={FIN.income} />
      <Line label="Cash outflows" amount={totalOutflows} color={FIN.expense} />
      <Line label="Net cash flow" amount={netCashFlow} bold color={netCashFlow >= 0 ? FIN.income : FIN.expense} />
      {byPaymentMethod.length > 0 && <Sub>By payment method</Sub>}
      {byPaymentMethod.map((r, i) => <Line key={i} label={`${String(r.method || 'unspecified').replace(/_/g, ' ')} (${r.txn_type})`} amount={r.total} />)}
    </>
  );
}

const RENDERERS = {
  'income-expenditure': IncomeExpenditure,
  'trial-balance': TrialBalance,
  'receivables-aging': Aging,
  'payables-aging': Aging,
  'balance-sheet': BalanceSheet,
  'cash-flow': CashFlow,
};

export default function ReportView({ kind, data }) {
  const R = RENDERERS[kind];
  return R ? <R data={data} /> : null;
}

const s = {
  line: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${t.border}`, color: t.textSecondary, fontSize: 14 },
  lineBold: { color: t.text, fontWeight: 700 },
  sub: { color: t.accent, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', margin: '18px 0 4px' },
};
