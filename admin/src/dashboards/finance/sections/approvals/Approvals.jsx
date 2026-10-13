/**
 * Approvals.jsx — the sign-off queue: waiting for approval, approved but not
 * yet posted, and drafts. Approving your own transaction is refused by the
 * server (a second person must sign off).
 */
import React from 'react';
import { useFinanceData } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { FIN } from '../../constants';
import { Panel, Kpi, KpiGrid, Loading, ErrorText } from '../../components/ui';
import TransactionsTable from '../transactions/TransactionsTable';

export default function Approvals() {
  const { data, loading, error } = useFinanceData(() => financeApi.approvals());
  if (loading && !data) return <Loading />;
  const all = data || [];
  const pending = all.filter((a) => a.status === 'pending_approval');
  const approved = all.filter((a) => a.status === 'approved');
  const drafts = all.filter((a) => a.status === 'draft');

  return (
    <>
      <ErrorText>{error}</ErrorText>
      <KpiGrid>
        <Kpi label="Waiting for approval" value={pending.length} color={FIN.warning} />
        <Kpi label="Approved — ready to post" value={approved.length} color={FIN.primary} />
        <Kpi label="Drafts" value={drafts.length} color={FIN.muted} />
      </KpiGrid>
      <Panel title="Waiting for approval">
        <TransactionsTable rows={pending} emptyText="Nothing waiting for approval." />
      </Panel>
      <Panel title="Approved — ready to post">
        <TransactionsTable rows={approved} emptyText="Nothing waiting to be posted." />
      </Panel>
      <Panel title="Drafts">
        <TransactionsTable rows={drafts} emptyText="No drafts." />
      </Panel>
    </>
  );
}
