/**
 * FinanceExpenses.js — Ibyakoreshejwe (Expenses view).
 *
 * Breakdown of all expense transactions by category with period totals,
 * trend indicators, and a category-level summary table.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  FIN, formatRWF, fmtDate,
  KPICard, SectionHeader, StatusBadge, EmptyState, s,
} from './FinanceShared';

export default function FinanceExpenses({ ctx }) {
  const { summary, transactions, setTxnType, setShowTxnModal } = ctx;
  const s_ = summary || {};
  const expenseTransactions = transactions.filter(t => t.txn_type === 'expense');

  return (
    <>
      <View style={s.kpiRow}>
        <KPICard icon="trending-down" label="Total Expenses" value={formatRWF(s_.total_expenses)} color={FIN.expense} bgColor={FIN.expenseBg} />
        <KPICard icon="account-arrow-right" label="Payables" value={formatRWF(s_.payables)} color={FIN.expense} bgColor={FIN.expenseBg} />
      </View>
      <View style={s.panel}>
        <SectionHeader title="Expense Transactions">
          <Pressable onPress={() => { setTxnType('expense'); setShowTxnModal(true); }}>
            <Text style={s.viewAll}>+ Record Expense</Text>
          </Pressable>
        </SectionHeader>
        {expenseTransactions.length === 0 ? (
          <EmptyState icon="cash-minus" text="No expenses recorded yet" />
        ) : expenseTransactions.map(tx => (
          <View key={tx.id} style={s.txRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.txDesc}>{tx.description}</Text>
              <Text style={s.txMeta}>{fmtDate(tx.txn_date)} · {tx.txn_ref}</Text>
            </View>
            <Text style={[s.txAmount, { color: FIN.expense }]}>-{formatRWF(tx.amount)}</Text>
            <StatusBadge status={tx.status} />
          </View>
        ))}
      </View>
    </>
  );
}
