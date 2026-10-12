/**
 * FinanceReconciliation.js — Guhuza konti (Bank reconciliation section).
 *
 * Compare ledger balances against bank statements. Supports CSV import of
 * bank statements, auto-matching of statement lines to ledger transactions,
 * and manual accept/reject of match suggestions.
 */
import React from 'react';
import { View, Text, TextInput, Pressable, Platform, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../../theme';
import { apiFetch } from '../../../services/apiClient';
import {
  FIN, formatRWF, fmtDate, alertMsg,
  KPICard, SectionHeader, EmptyState, s,
} from './FinanceShared';

export default function FinanceReconciliation({ ctx }) {
  const {
    bankAccounts, reconBank, setReconBank,
    reconData, reconLoading, reconSummary,
    csvText, setCsvText,
    fetchReconData, handleImportCSV, handleAutoMatch,
  } = ctx;

  return (
    <>
      <SectionHeader title="Bank Reconciliation" icon="bank-check">
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          {bankAccounts.length > 0 && (
            <View style={[s.inputBox, { minWidth: 180 }]}>
              {Platform.OS === 'web' ? (
                <select style={{ background: 'transparent', color: '#fff', border: 'none', width: '100%', fontSize: 14 }}
                  value={reconBank} onChange={e => setReconBank(e.target.value)}>
                  <option value="">Select Bank Account</option>
                  {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              ) : (
                <TextInput style={s.inputText} placeholder="Bank ID" value={reconBank} onChangeText={setReconBank} placeholderTextColor="rgba(255,255,255,0.4)" />
              )}
            </View>
          )}
          <Pressable style={s.filterBtn} onPress={fetchReconData}>
            <MaterialCommunityIcons name="refresh" size={16} color={colors.blue300} />
            <Text style={s.filterBtnLabel}>Load</Text>
          </Pressable>
        </View>
      </SectionHeader>

      {reconSummary && (
        <View style={s.kpiRow}>
          <KPICard icon="bank-outline" label="Ledger Balance" value={formatRWF(reconSummary.ledger_balance)} color={FIN.primary} bgColor={FIN.primaryBg} />
          <KPICard icon="file-document-outline" label="Statement Balance" value={formatRWF(reconSummary.statement_balance)} color={FIN.purple} bgColor={FIN.purpleBg} />
          <KPICard icon="alert-circle-outline" label="Difference" value={formatRWF(reconSummary.difference)} color={Math.abs(reconSummary.difference) < 0.01 ? FIN.income : FIN.expense} bgColor={Math.abs(reconSummary.difference) < 0.01 ? FIN.incomeBg : FIN.expenseBg} />
          <KPICard icon="link-off" label="Unmatched Stmt" value={String(reconSummary.unmatched_statement_lines)} color={FIN.warning} bgColor={FIN.warningBg} />
        </View>
      )}

      <View style={s.panel}>
        <SectionHeader title="Import Bank Statement (CSV)" icon="file-upload-outline" />
        <TextInput
          style={[s.inputBox, { minHeight: 100, color: '#fff', fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }]}
          multiline
          value={csvText}
          onChangeText={setCsvText}
          placeholder="Paste CSV here: date,description,debit,credit,reference"
          placeholderTextColor="rgba(255,255,255,0.4)"
        />
        <Pressable style={[s.filterBtn, { marginTop: spacing.md, alignSelf: 'flex-start' }]} onPress={handleImportCSV}>
          <MaterialCommunityIcons name="upload" size={16} color={colors.blue300} />
          <Text style={s.filterBtnLabel}>Import</Text>
        </Pressable>
      </View>

      {reconData && (
        <View style={s.panel}>
          <SectionHeader title={`Matching (${reconData.suggestions?.length || 0} suggestions)`} icon="link-variant">
            {reconData.suggestions?.length > 0 && (
              <Pressable style={s.filterBtn} onPress={handleAutoMatch}>
                <MaterialCommunityIcons name="auto-fix" size={16} color={colors.blue300} />
                <Text style={s.filterBtnLabel}>Auto-Match All</Text>
              </Pressable>
            )}
          </SectionHeader>
          {reconData.suggestions?.map((sg, i) => (
            <View key={i} style={[s.reportRow, { gap: spacing.sm, alignItems: 'center' }]}>
              <Text style={[s.td, { flex: 1 }]}>Stmt #{sg.statement_line_id} → Txn #{sg.transaction_id}</Text>
              <Text style={[s.td, { flex: 0.5, color: sg.confidence === 'high' ? FIN.income : FIN.warning }]}>{sg.confidence}</Text>
              <Text style={[s.td, { flex: 0.8 }]}>{sg.reason}</Text>
              <Pressable style={s.filterBtn} onPress={async () => {
                try {
                  await apiFetch('/finance/reconciliation/match', { method: 'POST', body: { matches: [sg] } });
                  alertMsg('Success', 'Match accepted');
                  fetchReconData();
                } catch (e) { alertMsg('Error', e.message); }
              }}>
                <MaterialCommunityIcons name="check" size={14} color={FIN.income} />
                <Text style={[s.filterBtnLabel, { color: FIN.income }]}>Accept</Text>
              </Pressable>
            </View>
          ))}
          {(!reconData.suggestions || reconData.suggestions.length === 0) && <EmptyState icon="check-circle-outline" text="No pending matches" />}

          <View style={{ height: spacing.lg }} />
          <Text style={s.reportSubHead}>Unmatched Statement Lines ({reconData.statementLines?.length || 0})</Text>
          {reconData.statementLines?.slice(0, 20).map((sl, i) => (
            <View key={i} style={s.reportRow}>
              <Text style={[s.td, { flex: 0.6 }]}>{fmtDate(sl.stmt_date)}</Text>
              <Text style={[s.td, { flex: 1.5 }]}>{sl.description}</Text>
              <Text style={[s.td, { flex: 0.8, textAlign: 'right' }]}>{formatRWF(sl.amount)}</Text>
            </View>
          ))}

          <View style={{ height: spacing.lg }} />
          <Text style={s.reportSubHead}>Unmatched Ledger Transactions ({reconData.ledgerTransactions?.length || 0})</Text>
          {reconData.ledgerTransactions?.slice(0, 20).map((lt, i) => (
            <View key={i} style={s.reportRow}>
              <Text style={[s.td, { flex: 0.6 }]}>{fmtDate(lt.txn_date)}</Text>
              <Text style={[s.td, { flex: 0.5 }]}>{lt.txn_ref}</Text>
              <Text style={[s.td, { flex: 1 }]}>{lt.description}</Text>
              <Text style={[s.td, { flex: 0.8, textAlign: 'right' }]}>{formatRWF(lt.amount)}</Text>
            </View>
          ))}
        </View>
      )}

      {reconLoading && <ActivityIndicator color={FIN.primary} size="large" style={{ marginTop: 30 }} />}
    </>
  );
}
