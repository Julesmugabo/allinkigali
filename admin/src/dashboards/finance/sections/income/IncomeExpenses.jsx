/**
 * IncomeExpenses.jsx — one view for both the Income and Expenses sections:
 * period totals + outstanding receivables/payables, and that type's
 * transactions with a quick "Record" button.  type = 'income' | 'expense'
 */
import React from 'react';
import { Plus } from 'lucide-react';
import Button from '../../../../components/common/Button';
import { useFinance, useFinanceData } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { FIN } from '../../constants';
import { Panel, Kpi, KpiGrid, Loading, ErrorText, formatRWF } from '../../components/ui';
import TransactionsTable from '../transactions/TransactionsTable';

export default function IncomeExpenses({ type }) {
  const { openTxn } = useFinance();
  const isIncome = type === 'income';
  const { data, loading, error } = useFinanceData(async (r) => {
    const [summary, list] = await Promise.all([
      financeApi.summary(r),
      financeApi.transactions({ type, from: r.from, to: r.to, limit: 500 }),
    ]);
    return { cards: summary?.cards || {}, rows: list?.transactions || [] };
  }, [type]);

  const c = data?.cards || {};
  return (
    <>
      <KpiGrid>
        <Kpi label={isIncome ? 'Income received (posted)' : 'Expenses recorded (posted)'}
          value={formatRWF(isIncome ? c.income : c.expenses)} color={isIncome ? FIN.income : FIN.expense} />
        <Kpi label={isIncome ? 'Receivables outstanding' : 'Payables outstanding'}
          value={formatRWF(isIncome ? c.receivables : c.payables)} color={FIN.warning} />
      </KpiGrid>
      <Panel
        title={isIncome ? 'Income transactions' : 'Expense transactions'}
        actions={<Button icon={Plus} onClick={() => openTxn(type)}>{isIncome ? 'Record income' : 'Record expense'}</Button>}
      >
        <ErrorText>{error}</ErrorText>
        {loading ? <Loading /> : <TransactionsTable rows={data?.rows} emptyText={isIncome ? 'No income in this period.' : 'No expenses in this period.'} />}
      </Panel>
    </>
  );
}
