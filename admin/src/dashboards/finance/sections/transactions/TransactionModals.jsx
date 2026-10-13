/**
 * TransactionModals.jsx — renders whichever transaction form FinanceContext
 * says is open, so any section (Overview quick actions, Income, Expenses,
 * the transactions table's Edit) can open them with one call.
 */
import React from 'react';
import { useFinance } from '../../FinanceContext';
import TransactionModal from './TransactionModal';
import TransferModal from './TransferModal';
import JournalModal from './JournalModal';

export default function TransactionModals() {
  const { modal, closeModal } = useFinance();
  if (!modal) return null;
  if (modal.kind === 'txn') return <TransactionModal key={modal.editing?.id || modal.txnType} txnType={modal.txnType} editing={modal.editing} onClose={closeModal} />;
  if (modal.kind === 'transfer') return <TransferModal onClose={closeModal} />;
  if (modal.kind === 'journal') return <JournalModal onClose={closeModal} />;
  return null;
}
