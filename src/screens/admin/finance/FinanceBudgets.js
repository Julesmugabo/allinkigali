/**
 * FinanceBudgets.js — Ingengo y'imari (Budgets section).
 *
 * Budget lines with allocated vs. spent amounts and progress bars. Includes
 * BudgetModal for creating or editing budget allocations per department
 * and accounting period.
 */
import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Modal, ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius } from '../../../theme';
import {
  FIN, SURFACE, formatRWF, fmtDate,
  KPICard, SectionHeader, StatusBadge, EmptyState,
  FormField, DropdownField, s,
} from './FinanceShared';

export function BudgetsSection({ ctx }) {
  const {
    budgets, fetchBudgets, setShowBudgetModal,
    budgetDetail, setBudgetDetail, selectedBudget, setSelectedBudget,
    fetchBudgetDetail, wide,
  } = ctx;

  useEffect(() => { fetchBudgets(); }, []);

  if (budgetDetail) {
    const lines = budgetDetail.lines || [];
    const totalBudget = lines.reduce((sum, l) => sum + Number(l.approved_amount), 0);
    const totalActual = lines.reduce((sum, l) => sum + Number(l.actual), 0);
    return (
      <>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }} onPress={() => { setBudgetDetail(null); setSelectedBudget(null); }}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={colors.blue300} />
          <Text style={{ color: colors.blue300, marginLeft: spacing.sm, fontSize: 14 }}>Back to budgets</Text>
        </Pressable>
        <View style={s.kpiRow}>
          <KPICard icon="chart-box-outline" label="Total Budget" value={formatRWF(totalBudget)} color={FIN.primary} bgColor={FIN.primaryBg} />
          <KPICard icon="cash-check" label="Actual Spent" value={formatRWF(totalActual)} color={totalActual > totalBudget ? FIN.expense : FIN.income} bgColor={totalActual > totalBudget ? FIN.expenseBg : FIN.incomeBg} />
          <KPICard icon="percent-outline" label="Utilization" value={totalBudget > 0 ? `${Math.round(totalActual / totalBudget * 100)}%` : '0%'} color={FIN.warning} bgColor={FIN.warningBg} />
        </View>
        <View style={s.panel}>
          <SectionHeader title={`${budgetDetail.name} — Budget vs Actual`} />
          <View style={s.tableHeader}>
            <Text style={[s.th, { flex: 0.5 }]}>Code</Text>
            <Text style={[s.th, { flex: 1.5 }]}>Account</Text>
            <Text style={[s.th, { flex: 1, textAlign: 'right' }]}>Budget</Text>
            <Text style={[s.th, { flex: 1, textAlign: 'right' }]}>Actual</Text>
            <Text style={[s.th, { flex: 0.8, textAlign: 'right' }]}>Variance</Text>
            <Text style={[s.th, { flex: 0.5, textAlign: 'right' }]}>%</Text>
          </View>
          {lines.map((l, i) => {
            const variance = Number(l.approved_amount) - Number(l.actual);
            const pct = Number(l.approved_amount) > 0 ? Math.round(Number(l.actual) / Number(l.approved_amount) * 100) : 0;
            return (
              <View key={i} style={s.reportRow}>
                <Text style={[s.td, { flex: 0.5 }]}>{l.account_code}</Text>
                <Text style={[s.td, { flex: 1.5 }]}>{l.account_name}</Text>
                <Text style={[s.td, { flex: 1, textAlign: 'right' }]}>{formatRWF(l.approved_amount)}</Text>
                <Text style={[s.td, { flex: 1, textAlign: 'right' }]}>{formatRWF(l.actual)}</Text>
                <Text style={[s.td, { flex: 0.8, textAlign: 'right', color: variance >= 0 ? FIN.income : FIN.expense }]}>{formatRWF(variance)}</Text>
                <Text style={[s.td, { flex: 0.5, textAlign: 'right', color: pct > 100 ? FIN.expense : pct > 80 ? FIN.warning : colors.blue300 }]}>{pct}%</Text>
              </View>
            );
          })}
          {lines.length === 0 && <EmptyState icon="chart-box-outline" text="No budget lines" />}
        </View>
      </>
    );
  }

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
        <Text style={s.sectionTitle}>All Budgets</Text>
        <Pressable style={s.addBtn} onPress={() => setShowBudgetModal(true)}>
          <MaterialCommunityIcons name="plus" size={16} color="#fff" />
          <Text style={s.addBtnLabel}>New Budget</Text>
        </Pressable>
      </View>
      <View style={s.panel}>
        {budgets.length === 0 ? (
          <EmptyState icon="chart-box-outline" text="No budgets created yet" sub="Create a budget to track spending against approved amounts" />
        ) : budgets.map(b => (
          <Pressable key={b.id} style={s.txRow} onPress={() => { setSelectedBudget(b.id); fetchBudgetDetail(b.id); }}>
            <View style={{ flex: 1 }}>
              <Text style={s.txDesc}>{b.name}</Text>
              <Text style={s.txMeta}>FY {b.fiscal_year} · {b.status}</Text>
            </View>
            <StatusBadge status={b.status} />
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.blue300} style={{ marginLeft: spacing.sm }} />
          </Pressable>
        ))}
      </View>
    </>
  );
}

export function BudgetModal({ ctx }) {
  const {
    showBudgetModal, setShowBudgetModal,
    budgetForm, setBudgetForm, budgetSaving, handleCreateBudget,
    addBudgetLine, updateBudgetLine, removeBudgetLine,
    accounts, departments,
  } = ctx;
  const expenseAccounts = accounts.filter(a => a.account_type === 'expense').map(a => ({ value: a.id, label: `${a.code} — ${a.name}` }));
  const deptOpts = [{ value: '', label: 'All departments' }, ...departments.map(d => ({ value: d.id, label: d.name }))];

  return (
    <Modal visible={showBudgetModal} transparent animationType="fade" onRequestClose={() => setShowBudgetModal(false)}>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>New Budget</Text>
            <Pressable onPress={() => setShowBudgetModal(false)}><MaterialCommunityIcons name="close" size={22} color={colors.white} /></Pressable>
          </View>
          <ScrollView style={{ maxHeight: 500 }} contentContainerStyle={{ padding: spacing.lg }}>
            <FormField label="Budget Name *" value={budgetForm.name} onChangeText={v => setBudgetForm({ ...budgetForm, name: v })} placeholder="e.g. Q4 2026 Operations" />
            <FormField label="Fiscal Year *" value={budgetForm.fiscal_year} onChangeText={v => setBudgetForm({ ...budgetForm, fiscal_year: v })} placeholder="2026" keyboardType="numeric" />
            <DropdownField label="Department" value={budgetForm.department_id} options={deptOpts} onChange={v => setBudgetForm({ ...budgetForm, department_id: v })} />
            <View style={{ marginTop: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <Text style={s.fieldLabel}>Budget Lines</Text>
                <Pressable style={[s.addBtn, { paddingVertical: 4 }]} onPress={addBudgetLine}>
                  <MaterialCommunityIcons name="plus" size={14} color="#fff" />
                  <Text style={[s.addBtnLabel, { fontSize: 12 }]}>Add Line</Text>
                </Pressable>
              </View>
              {budgetForm.lines.map((line, idx) => (
                <View key={idx} style={{ backgroundColor: SURFACE, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                    <Text style={{ color: colors.blue300, fontSize: 12 }}>Line {idx + 1}</Text>
                    <Pressable onPress={() => removeBudgetLine(idx)}><MaterialCommunityIcons name="close-circle-outline" size={16} color={FIN.expense} /></Pressable>
                  </View>
                  <DropdownField label="Account" value={line.account_id} options={expenseAccounts} onChange={v => updateBudgetLine(idx, 'account_id', v)} />
                  <FormField label="Approved Amount (RWF)" value={line.approved_amount} onChangeText={v => updateBudgetLine(idx, 'approved_amount', v)} placeholder="0" keyboardType="numeric" />
                </View>
              ))}
              {budgetForm.lines.length === 0 && <Text style={{ color: colors.textMuted, fontSize: 13 }}>No lines added yet. Click "Add Line" to add expense accounts.</Text>}
            </View>
          </ScrollView>
          <View style={s.modalFooter}>
            <Pressable style={s.cancelBtn} onPress={() => setShowBudgetModal(false)}><Text style={s.cancelBtnLabel}>Cancel</Text></Pressable>
            <Pressable style={s.saveBtn} onPress={handleCreateBudget} disabled={budgetSaving}>
              {budgetSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnLabel}>Create Budget</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
