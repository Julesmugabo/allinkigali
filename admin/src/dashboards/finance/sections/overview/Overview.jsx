/**
 * Overview.jsx — period KPIs, things needing attention, quick actions and
 * the most recent transactions.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, TrendingUp, TrendingDown, ArrowLeftRight, BookOpen } from 'lucide-react';
import { t } from '../../../../theme';
import Button from '../../../../components/common/Button';
import { useFinance, useFinanceData } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { FIN } from '../../constants';
import { Panel, Kpi, KpiGrid, Loading, ErrorText, formatRWF } from '../../components/ui';
import TransactionsTable from '../transactions/TransactionsTable';

function alertLines(a) {
  if (!a) return [];
  const out = [];
  if (a.overdueReceivables?.count > 0) out.push(`${a.overdueReceivables.count} overdue receivable(s) totalling ${formatRWF(a.overdueReceivables.total)}`);
  if (a.overduePayables?.count > 0) out.push(`${a.overduePayables.count} overdue payable(s) totalling ${formatRWF(a.overduePayables.total)}`);
  if (a.pendingApprovals > 0) out.push(`${a.pendingApprovals} transaction(s) waiting for approval`);
  return out;
}

export default function Overview() {
  const navigate = useNavigate();
  const go = (key) => navigate(`/finance/${key}`);
  const { openTxn, openTransfer, openJournal } = useFinance();
  const { data, loading, error } = useFinanceData(async (r) => {
    const [summary, alerts] = await Promise.all([financeApi.summary(r), financeApi.alerts()]);
    return { cards: summary?.cards || {}, recent: summary?.recentTransactions || [], alerts: alertLines(alerts) };
  });

  if (loading && !data) return <Loading />;
  const c = data?.cards || {};
  const net = (c.income || 0) - (c.expenses || 0);

  return (
    <>
      <ErrorText>{error}</ErrorText>
      <KpiGrid>
        <Kpi label="Cash & bank balance" value={formatRWF(c.cashBank)} color={FIN.primary} />
        <Kpi label="Income received" value={formatRWF(c.income)} color={FIN.income} onClick={() => go('income')} />
        <Kpi label="Expenses recorded" value={formatRWF(c.expenses)} color={FIN.expense} onClick={() => go('expenses')} />
        <Kpi label="Net movement" value={formatRWF(net)} color={net >= 0 ? FIN.income : FIN.expense} />
        <Kpi label="Receivables outstanding" value={formatRWF(c.receivables)} color={FIN.warning} onClick={() => go('invoices')} />
        <Kpi label="Payables outstanding" value={formatRWF(c.payables)} color={FIN.expense} onClick={() => go('invoices')} />
      </KpiGrid>

      <div style={s.two}>
        <Panel title="Needs attention" style={{ marginBottom: 0 }}>
          {data?.alerts.length ? data.alerts.map((a) => (
            <div key={a} style={s.alert}><AlertCircle size={15} color={FIN.warning} /> {a}</div>
          )) : (
            <div style={s.clear}><CheckCircle2 size={18} color={FIN.income} /> All clear</div>
          )}
          {data?.alerts.length > 0 && (
            <Button size="sm" variant="info" style={{ marginTop: 10 }} onClick={() => go('approvals')}>Open approvals</Button>
          )}
        </Panel>
        <Panel title="Quick actions" style={{ marginBottom: 0 }}>
          <div style={s.quick}>
            <Button variant="success" icon={TrendingUp} onClick={() => openTxn('income')}>Record income</Button>
            <Button variant="danger" icon={TrendingDown} onClick={() => openTxn('expense')}>Record expense</Button>
            <Button variant="info" icon={ArrowLeftRight} onClick={openTransfer}>Transfer funds</Button>
            <Button variant="info" icon={BookOpen} onClick={openJournal}>Journal entry</Button>
          </div>
        </Panel>
      </div>

      <Panel title="Recent transactions" actions={<Button size="sm" variant="ghost" onClick={() => go('transactions')}>View all</Button>} style={{ marginTop: 20 }}>
        <TransactionsTable rows={(data?.recent || []).slice(0, 8)} showActions={false} emptyText="No transactions yet — record your first income or expense." />
      </Panel>
    </>
  );
}

const s = {
  two: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 },
  alert: { display: 'flex', alignItems: 'center', gap: 8, color: t.text, fontSize: 14, padding: '6px 0' },
  clear: { display: 'flex', alignItems: 'center', gap: 8, color: t.textSecondary, fontSize: 14 },
  quick: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
};
