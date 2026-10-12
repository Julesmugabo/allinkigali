/**
 * FinanceIncome.js — Inyinjiye z'imari (Income view).
 *
 * Breakdown of all income transactions by category with period totals,
 * trend indicators, and a category-level summary table.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  FIN, formatRWF, fmtDate,
  KPICard, SectionHeader, StatusBadge, EmptyState, s,
} from './FinanceShared';

export default function FinanceIncome({ ctx }) {
  const { summary, transactions, setTxnType, setShowTxnModal } = ctx;
  const s_ = summary || {};
  const incomeTransactions = transactions.filter(t => t.txn_type === 'income');

  return (
    <>
      <View style={s.kpiRow}>
        <KPICard icon="trending-up" label="Total Income" value={formatRWF(s_.total_income)} color={FIN.income} bgColor={FIN.incomeBg} />
        <KPICard icon="account-arrow-left" label="Receivables" value={formatRWF(s_.receivables)} color={FIN.warning} bgColor={FIN.warningBg} />
      </View>
      <View style={s.panel}>
        <SectionHeader title="Income Transactions">
          <Pressable onPress={() => { setTxnType('income'); setShowTxnModal(true); }}>
            <Text style={s.viewAll}>+ Record Income</Text>
          </Pressable>
        </SectionHeader>
        {incomeTransactions.length === 0 ? (
          <EmptyState icon="cash-plus" text="No income recorded yet" />
        ) : incomeTransactions.map(tx => (
          <View key={tx.id} style={s.txRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.txDesc}>{tx.description}</Text>
              <Text style={s.txMeta}>{fmtDate(tx.txn_date)} · {tx.txn_ref}</Text>
            </View>
            <Text style={[s.txAmount, { color: FIN.income }]}>+{formatRWF(tx.amount)}</Text>
            <StatusBadge status={tx.status} />
          </View>
        ))}
      </View>
    </>
  );
}
