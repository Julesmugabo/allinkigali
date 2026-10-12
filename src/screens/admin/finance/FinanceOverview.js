/**
 * FinanceOverview.js — Incamake y'imari (Finance overview section).
 *
 * Top-level KPI cards (total income, expenses, net, bank balance), alert
 * banners, quick-action buttons, and a recent-transactions list. This is
 * the default view when the finance dashboard first loads.
 */
import React from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../../theme';
import {
  FIN, PERIOD_OPTIONS, QUICK_ACTIONS,
  formatRWF, fmtDate,
  KPICard, SectionHeader, Chip, StatusBadge, EmptyState, s,
} from './FinanceShared';

export default function FinanceOverview({ ctx }) {
  const {
    summary, alerts, transactions, period, setPeriod,
    customFrom, setCustomFrom, customTo, setCustomTo,
    setSegment, setTxnType, setShowTxnModal,
    setShowTransferModal, setShowJournalModal,
    fetchSummary, fetchTransactions, buildTxnFilters,
  } = ctx;
  const s_ = summary || {};

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xl }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {PERIOD_OPTIONS.map(p => (
            <Chip key={p.key} label={p.label} active={period === p.key} onPress={() => setPeriod(p.key)} />
          ))}
        </View>
      </ScrollView>
      {period === 'custom' && (
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, alignItems: 'center' }}>
          <TextInput style={[s.inputBox, { flex: 1, color: '#fff' }]} value={customFrom} onChangeText={setCustomFrom} placeholder="From: YYYY-MM-DD" placeholderTextColor="rgba(255,255,255,0.4)" />
          <Text style={{ color: colors.textMuted }}>→</Text>
          <TextInput style={[s.inputBox, { flex: 1, color: '#fff' }]} value={customTo} onChangeText={setCustomTo} placeholder="To: YYYY-MM-DD" placeholderTextColor="rgba(255,255,255,0.4)" />
          <Pressable style={s.filterBtn} onPress={() => { fetchSummary(); fetchTransactions(buildTxnFilters()); }}>
            <MaterialCommunityIcons name="check" size={16} color={FIN.income} />
          </Pressable>
        </View>
      )}

      <View style={s.kpiRow}>
        <KPICard icon="bank"               label="Cash & Bank Balance"     value={formatRWF(s_.cash_balance)}        color={FIN.primary}  bgColor={FIN.primaryBg} />
        <KPICard icon="trending-up"         label="Income Received"         value={formatRWF(s_.total_income)}        color={FIN.income}   bgColor={FIN.incomeBg} onPress={() => setSegment('income')} />
        <KPICard icon="trending-down"       label="Expenses Recorded"       value={formatRWF(s_.total_expenses)}      color={FIN.expense}  bgColor={FIN.expenseBg} onPress={() => setSegment('expenses')} />
        <KPICard icon="chart-line"          label="Net Movement"            value={formatRWF((s_.total_income || 0) - (s_.total_expenses || 0))} color={FIN.income} bgColor={FIN.incomeBg} />
        <KPICard icon="account-arrow-left"  label="Receivables Outstanding" value={formatRWF(s_.receivables)}         color={FIN.warning}  bgColor={FIN.warningBg} />
        <KPICard icon="account-arrow-right" label="Payables Outstanding"    value={formatRWF(s_.payables)}            color={FIN.expense}  bgColor={FIN.expenseBg} />
      </View>

      <View style={s.panelsRow}>
        <View style={s.panel}>
          <Text style={s.panelTitle}>Needs Attention</Text>
          {alerts.length === 0 ? (
            <View style={s.emptyPanel}>
              <MaterialCommunityIcons name="check-circle-outline" size={28} color={FIN.income} />
              <Text style={s.emptyPanelText}>All clear</Text>
            </View>
          ) : alerts.map((a, i) => (
            <View key={i} style={s.alertRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={FIN.warning} />
              <Text style={s.alertText}>{a.message || a}</Text>
            </View>
          ))}
        </View>
        <View style={s.panel}>
          <Text style={s.panelTitle}>Quick Actions</Text>
          <View style={s.quickGrid}>
            {QUICK_ACTIONS.map(a => (
              <Pressable key={a.key} style={s.quickAction} onPress={() => {
                if (a.key === 'transfer') { setShowTransferModal(true); }
                else if (a.key === 'journal') { setShowJournalModal(true); }
                else { setTxnType(a.key); setShowTxnModal(true); }
              }}>
                <View style={[s.quickIcon, { backgroundColor: `${a.color}20` }]}>
                  <MaterialCommunityIcons name={a.icon} size={18} color={a.color} />
                </View>
                <Text style={s.quickLabel}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={s.panel}>
        <SectionHeader title="Recent Transactions">
          <Pressable onPress={() => setSegment('transactions')}>
            <Text style={s.viewAll}>View All</Text>
          </Pressable>
        </SectionHeader>
        {transactions.length === 0 ? (
          <EmptyState icon="receipt" text="No transactions yet" sub="Record your first income or expense" />
        ) : transactions.slice(0, 5).map(tx => (
          <View key={tx.id} style={s.txRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.txDesc}>{tx.description}</Text>
              <Text style={s.txMeta}>{fmtDate(tx.txn_date)} · {tx.txn_ref}</Text>
            </View>
            <Text style={[s.txAmount, { color: tx.txn_type === 'income' ? FIN.income : FIN.expense }]}>
              {tx.txn_type === 'income' ? '+' : '-'}{formatRWF(tx.amount)}
            </Text>
            <StatusBadge status={tx.status} />
          </View>
        ))}
      </View>
    </>
  );
}
