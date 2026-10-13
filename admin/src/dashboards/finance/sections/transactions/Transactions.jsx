/**
 * Transactions.jsx — every transaction in the period: status/type tabs,
 * search, new income/expense/transfer/journal, and CSV export.
 */
import React, { useState } from 'react';
import { Plus, Download, ArrowLeftRight, BookOpen } from 'lucide-react';
import { Tabs } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { useFinance, useFinanceData } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { TXN_TABS } from '../../constants';
import { Panel, Loading, ErrorText } from '../../components/ui';
import TransactionsTable from './TransactionsTable';

function filtersFor(tab, search, range) {
  const f = { from: range.from, to: range.to, limit: 500 };
  if (['income', 'expense', 'transfer'].includes(tab)) f.type = tab;
  if (tab === 'draft') f.status = 'draft';
  if (tab === 'pending') f.status = 'pending_approval';
  if (tab === 'posted') f.status = 'posted';
  if (search) f.search = search;
  return f;
}

export default function Transactions() {
  const { openTxn, openTransfer, openJournal, range } = useFinance();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const { data, loading, error } = useFinanceData(
    (r) => financeApi.transactions(filtersFor(tab, applied, r)).then((d) => d?.transactions || []),
    [tab, applied]
  );

  const exportCsv = async () => {
    try { await financeApi.exportTransactions(range); } catch (e) { alert(e.message); }
  };

  return (
    <Panel
      title="Transactions"
      actions={(
        <>
          <Button icon={Plus} onClick={() => openTxn('income')}>New</Button>
          <Button variant="info" icon={ArrowLeftRight} onClick={openTransfer}>Transfer</Button>
          <Button variant="info" icon={BookOpen} onClick={openJournal}>Journal</Button>
          <Button variant="ghost" icon={Download} onClick={exportCsv}>Export CSV</Button>
        </>
      )}
    >
      <Tabs tabs={TXN_TABS} active={tab} onChange={setTab} />
      <form onSubmit={(e) => { e.preventDefault(); setApplied(search.trim()); }} style={{ marginBottom: 14 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search description or reference, press Enter"
          style={{ width: '100%', maxWidth: 380 }}
        />
      </form>
      <ErrorText>{error}</ErrorText>
      {loading ? <Loading /> : <TransactionsTable rows={data} />}
    </Panel>
  );
}
