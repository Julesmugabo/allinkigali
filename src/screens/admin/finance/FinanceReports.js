/**
 * FinanceReports.js — Raporo z'imari (Financial reports section).
 *
 * Generates six standard reports: Trial Balance, Income Statement,
 * Balance Sheet, Cash Flow, Budget vs. Actual, and General Ledger.
 * Each report fetches data from the backend and renders a formatted table.
 */
import React from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../../theme';
import {
  FIN, PERIOD_OPTIONS, REPORT_TYPES,
  formatRWF, fmtDate,
  KPICard, SectionHeader, Chip, EmptyState, ReportLine, s,
} from './FinanceShared';

export default function FinanceReports({ ctx }) {
  const {
    period, setPeriod, customFrom, setCustomFrom, customTo, setCustomTo,
    selectedReport, reportData, reportLoading, runReport, handleExportCSV,
  } = ctx;

  function renderReportData() {
    if (!reportData) return null;
    if (selectedReport === 'income-expenditure') {
      const { income = [], expenses = [], totalIncome: total_income = 0, totalExpenses: total_expenses = 0 } = reportData;
      return (
        <>
          <Text style={s.reportSubHead}>Income</Text>
          {income.map((r, i) => <ReportLine key={i} label={r.account_name || r.name} amount={r.total} />)}
          <ReportLine label="Total Income" amount={total_income} bold />
          <View style={{ height: spacing.lg }} />
          <Text style={s.reportSubHead}>Expenses</Text>
          {expenses.map((r, i) => <ReportLine key={i} label={r.account_name || r.name} amount={r.total} />)}
          <ReportLine label="Total Expenses" amount={total_expenses} bold />
          <View style={s.reportDivider} />
          <ReportLine label="Net Surplus / (Deficit)" amount={total_income - total_expenses} bold color={total_income - total_expenses >= 0 ? FIN.income : FIN.expense} />
        </>
      );
    }
    if (selectedReport === 'trial-balance') {
      const rows = Array.isArray(reportData) ? reportData : (reportData?.rows || []);
      const total_debits = rows.reduce((sum, r) => sum + Number(r.total_debit || 0), 0);
      const total_credits = rows.reduce((sum, r) => sum + Number(r.total_credit || 0), 0);
      return (
        <>
          <View style={s.reportHeader}>
            <Text style={[s.th, { flex: 0.5 }]}>Code</Text>
            <Text style={[s.th, { flex: 1.5 }]}>Account</Text>
            <Text style={[s.th, { flex: 1, textAlign: 'right' }]}>Debit</Text>
            <Text style={[s.th, { flex: 1, textAlign: 'right' }]}>Credit</Text>
          </View>
          {rows.map((r, i) => (
            <View key={i} style={s.reportRow}>
              <Text style={[s.td, { flex: 0.5 }]}>{r.code}</Text>
              <Text style={[s.td, { flex: 1.5 }]}>{r.name}</Text>
              <Text style={[s.td, { flex: 1, textAlign: 'right' }]}>{Number(r.total_debit) ? formatRWF(r.total_debit) : ''}</Text>
              <Text style={[s.td, { flex: 1, textAlign: 'right' }]}>{Number(r.total_credit) ? formatRWF(r.total_credit) : ''}</Text>
            </View>
          ))}
          <View style={s.reportDivider} />
          <View style={s.reportRow}>
            <Text style={[s.td, { flex: 0.5 }]} />
            <Text style={[s.td, { flex: 1.5, fontWeight: '700', color: colors.white }]}>Total</Text>
            <Text style={[s.td, { flex: 1, textAlign: 'right', fontWeight: '700', color: colors.white }]}>{formatRWF(total_debits)}</Text>
            <Text style={[s.td, { flex: 1, textAlign: 'right', fontWeight: '700', color: colors.white }]}>{formatRWF(total_credits)}</Text>
          </View>
        </>
      );
    }
    if (selectedReport === 'receivables-aging' || selectedReport === 'payables-aging') {
      const rows = Array.isArray(reportData) ? reportData : (reportData?.rows || []);
      return (
        <>
          <View style={s.reportHeader}>
            <Text style={[s.th, { flex: 1.5 }]}>Contact</Text>
            <Text style={[s.th, { flex: 1 }]}>Invoice #</Text>
            <Text style={[s.th, { flex: 0.8 }]}>Due Date</Text>
            <Text style={[s.th, { flex: 0.8, textAlign: 'right' }]}>Outstanding</Text>
            <Text style={[s.th, { flex: 0.6 }]}>Aging</Text>
          </View>
          {rows.map((r, i) => (
            <View key={i} style={s.reportRow}>
              <Text style={[s.td, { flex: 1.5 }]}>{r.contact_name}</Text>
              <Text style={[s.td, { flex: 1 }]}>{r.invoice_number}</Text>
              <Text style={[s.td, { flex: 0.8 }]}>{fmtDate(r.due_date)}</Text>
              <Text style={[s.td, { flex: 0.8, textAlign: 'right' }]}>{formatRWF(r.outstanding)}</Text>
              <Text style={[s.td, { flex: 0.6 }]}>{(r.aging_bucket || '').replace('_', ' ')}</Text>
            </View>
          ))}
          {rows.length === 0 && <EmptyState icon="check-circle-outline" text="No outstanding items" />}
        </>
      );
    }
    if (selectedReport === 'balance-sheet') {
      const { assets = [], liabilities = [], equity = [], totalAssets = 0, totalLiabilities = 0, totalEquity = 0 } = reportData;
      return (
        <>
          <Text style={s.reportSubHead}>Assets</Text>
          {assets.map((r, i) => <ReportLine key={i} label={`${r.code} ${r.name}`} amount={r.balance} />)}
          <ReportLine label="Total Assets" amount={totalAssets} bold />
          <View style={{ height: spacing.lg }} />
          <Text style={s.reportSubHead}>Liabilities</Text>
          {liabilities.map((r, i) => <ReportLine key={i} label={`${r.code} ${r.name}`} amount={r.balance} />)}
          <ReportLine label="Total Liabilities" amount={totalLiabilities} bold />
          <View style={{ height: spacing.lg }} />
          <Text style={s.reportSubHead}>Equity</Text>
          {equity.map((r, i) => <ReportLine key={i} label={`${r.code} ${r.name}`} amount={r.balance} />)}
          <ReportLine label="Total Equity" amount={totalEquity} bold />
          <View style={s.reportDivider} />
          <ReportLine label="Liabilities + Equity" amount={totalLiabilities + totalEquity} bold color={Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? FIN.income : FIN.expense} />
        </>
      );
    }
    if (selectedReport === 'cash-flow') {
      const { totalInflows = 0, totalOutflows = 0, netCashFlow = 0, byPaymentMethod = [] } = reportData;
      return (
        <>
          <ReportLine label="Total Cash Inflows" amount={totalInflows} color={FIN.income} />
          <ReportLine label="Total Cash Outflows" amount={totalOutflows} color={FIN.expense} />
          <View style={s.reportDivider} />
          <ReportLine label="Net Cash Flow" amount={netCashFlow} bold color={netCashFlow >= 0 ? FIN.income : FIN.expense} />
          {byPaymentMethod.length > 0 && (
            <>
              <View style={{ height: spacing.lg }} />
              <Text style={s.reportSubHead}>By Payment Method</Text>
              {byPaymentMethod.map((r, i) => <ReportLine key={i} label={`${r.method} (${r.txn_type})`} amount={r.total} />)}
            </>
          )}
        </>
      );
    }
    return <EmptyState icon="file-chart-outline" text="Report data loaded" />;
  }

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
          <Pressable style={s.filterBtn} onPress={() => { if (selectedReport) runReport(selectedReport); }}>
            <MaterialCommunityIcons name="check" size={16} color={FIN.income} />
          </Pressable>
        </View>
      )}

      <View style={s.kpiRow}>
        {REPORT_TYPES.map(r => (
          <Pressable key={r.key} style={[s.kpiCard, selectedReport === r.key && { borderColor: FIN.primary }]} onPress={() => runReport(r.key)}>
            <View style={[s.kpiIcon, { backgroundColor: FIN.primaryBg }]}>
              <MaterialCommunityIcons name={r.icon} size={20} color={FIN.primary} />
            </View>
            <Text style={s.kpiLabel}>{r.label}</Text>
            <Text style={[s.kpiValue, { fontSize: 12, color: colors.blue300 }]}>{r.desc}</Text>
          </Pressable>
        ))}
      </View>

      {reportLoading && <ActivityIndicator color={FIN.primary} size="large" style={{ marginTop: 30 }} />}
      {reportData && !reportLoading && (
        <View style={s.panel}>
          <SectionHeader title={REPORT_TYPES.find(r => r.key === selectedReport)?.label || 'Report'}>
            {(selectedReport === 'income-expenditure' || selectedReport === 'trial-balance') && (
              <Pressable style={s.filterBtn} onPress={() => handleExportCSV(selectedReport)}>
                <MaterialCommunityIcons name="download" size={16} color={colors.blue300} />
                <Text style={s.filterBtnLabel}>Export CSV</Text>
              </Pressable>
            )}
          </SectionHeader>
          {renderReportData()}
        </View>
      )}
    </>
  );
}
