/**
 * TransactionsTable.jsx — the transaction list with its workflow actions:
 *   draft            → Edit, Submit (sends for approval)
 *   pending_approval → Approve (server refuses if you created it — a second
 *                      person must sign off)
 *   approved         → Post
 *   posted           → Void (asks for a reason)
 * Shared by Transactions, Income and Expenses.
 */
import React, { useState } from 'react';
import { DataTable } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { useFinance } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { Money, StatusBadge, RowActions, fmtDate } from '../../components/ui';

export default function TransactionsTable({ rows, emptyText, showActions = true }) {
  const { openTxn, changed, notify } = useFinance();
  const [busy, setBusy] = useState(null);

  const act = async (tx, action) => {
    let reason;
    if (action === 'void') {
      reason = window.prompt(`Void ${tx.txn_ref}? This reverses a posted transaction.\nReason:`);
      if (!reason) return;
    }
    setBusy(tx.id);
    try {
      if (action === 'submit') await financeApi.submitTransaction(tx.id);
      if (action === 'approve') await financeApi.approveTransaction(tx.id);
      if (action === 'post') await financeApi.postTransaction(tx.id);
      if (action === 'void') await financeApi.voidTransaction(tx.id, reason);
      notify(`${tx.txn_ref} ${{ submit: 'submitted for approval', approve: 'approved', post: 'posted', void: 'voided' }[action]}`);
      changed();
    } catch (e) { alert(e.message); }
    setBusy(null);
  };

  const columns = [
    { key: 'txn_date', label: 'Date', render: (r) => fmtDate(r.txn_date) },
    { key: 'txn_ref', label: 'Ref', render: (r) => <span style={{ color: '#38BDF8' }}>{r.txn_ref}</span> },
    { key: 'txn_type', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', render: (r) => <Money value={r.amount} type={r.txn_type} /> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];
  if (showActions) {
    columns.push({
      key: 'actions', label: '', render: (r) => (
        <RowActions>
          {r.status === 'draft' && r.txn_type !== 'journal' && r.txn_type !== 'transfer' && (
            <Button size="sm" variant="info" onClick={() => openTxn(r.txn_type, r)}>Edit</Button>
          )}
          {r.status === 'draft' && <Button size="sm" variant="info" disabled={busy === r.id} onClick={() => act(r, 'submit')}>Submit</Button>}
          {r.status === 'pending_approval' && <Button size="sm" variant="success" disabled={busy === r.id} onClick={() => act(r, 'approve')}>Approve</Button>}
          {r.status === 'approved' && <Button size="sm" variant="success" disabled={busy === r.id} onClick={() => act(r, 'post')}>Post</Button>}
          {r.status === 'posted' && <Button size="sm" variant="danger" disabled={busy === r.id} onClick={() => act(r, 'void')}>Void</Button>}
        </RowActions>
      ),
    });
  }
  return <DataTable columns={columns} rows={rows || []} emptyText={emptyText || 'No transactions found.'} />;
}
