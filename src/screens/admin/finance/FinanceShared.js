/**
 * FinanceShared.js — Ibikoresho bisangiwe (shared finance utilities).
 *
 * All constants (colors, segments, period options, tabs), utility functions
 * (formatRWF, fmtDate, alertMsg), reusable UI atoms (KPICard, SectionHeader,
 * Chip, StatusBadge, FormField, etc.), and the shared StyleSheet used across
 * every finance section file.
 */
import React, { useState } from 'react';
import {
  View, Text, Pressable, TextInput, StyleSheet, Platform,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius, gutter } from '../../../theme';

export const FIN = {
  income: '#059669', incomeBg: '#ECFDF5',
  expense: '#DC2626', expenseBg: '#FEF2F2',
  warning: '#D97706', warningBg: '#FFFBEB',
  primary: '#2563EB', primaryBg: '#DBEAFE',
  purple: '#7C3AED', purpleBg: '#EDE9FE',
};

export const CARD_BG = 'rgba(255,255,255,0.06)';
export const CARD_BORDER = 'rgba(255,255,255,0.1)';
export const SURFACE = 'rgba(255,255,255,0.08)';

export const SEGMENTS = [
  { key: 'overview',     label: 'Overview' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'invoices',     label: 'Invoices' },
  { key: 'income',       label: 'Income' },
  { key: 'expenses',     label: 'Expenses' },
  { key: 'approvals',    label: 'Approvals' },
  { key: 'budgets',      label: 'Budgets' },
  { key: 'reports',      label: 'Reports' },
  { key: 'reconciliation', label: 'Bank Recon' },
  { key: 'recurring',   label: 'Recurring' },
  { key: 'contacts',     label: 'Contacts' },
  { key: 'documents',    label: 'Documents' },
  { key: 'import',       label: 'Import' },
  { key: 'notifications', label: 'Alerts' },
  { key: 'settings',     label: 'Settings' },
];

export const PERIOD_OPTIONS = [
  { key: 'this_month',   label: 'This Month' },
  { key: 'last_month',   label: 'Last Month' },
  { key: 'this_quarter', label: 'This Quarter' },
  { key: 'this_year',    label: 'This Year' },
  { key: 'custom',       label: 'Custom Range' },
];

export const TXN_TABS = [
  { key: 'all',      label: 'All' },
  { key: 'income',   label: 'Income' },
  { key: 'expense',  label: 'Expenses' },
  { key: 'transfer', label: 'Transfers' },
  { key: 'draft',    label: 'Draft' },
  { key: 'pending',  label: 'Pending' },
  { key: 'posted',   label: 'Posted' },
];

export const QUICK_ACTIONS = [
  { key: 'income',   icon: 'cash-plus',        label: 'Record Income',  color: FIN.income },
  { key: 'expense',  icon: 'cash-minus',        label: 'Record Expense', color: FIN.expense },
  { key: 'transfer', icon: 'bank-transfer',     label: 'Transfer Funds', color: FIN.primary },
  { key: 'journal',  icon: 'book-edit-outline', label: 'Journal Entry',  color: FIN.purple },
];

export const REPORT_TYPES = [
  { key: 'income-expenditure', label: 'Income & Expenditure', icon: 'chart-bar', desc: 'Revenue minus expenses for a period' },
  { key: 'trial-balance',      label: 'Trial Balance',        icon: 'scale-balance', desc: 'All account balances at a point in time' },
  { key: 'receivables-aging',  label: 'Receivables Aging',    icon: 'account-arrow-left-outline', desc: 'Outstanding customer invoices by age' },
  { key: 'payables-aging',     label: 'Payables Aging',       icon: 'account-arrow-right-outline', desc: 'Outstanding supplier bills by age' },
  { key: 'balance-sheet',     label: 'Balance Sheet',        icon: 'bank-outline', desc: 'Assets, liabilities & equity snapshot' },
  { key: 'cash-flow',         label: 'Cash Flow Statement',  icon: 'swap-horizontal', desc: 'Inflows, outflows and net cash movement' },
];

export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash',          label: 'Cash' },
  { value: 'mobile_money',  label: 'Mobile Money' },
  { value: 'card',          label: 'Card' },
  { value: 'cheque',        label: 'Cheque' },
  { value: 'other',         label: 'Other' },
];

export const STATUS_COLOR = {
  draft: '#6B7280', pending_approval: '#D97706', approved: '#2563EB',
  posted: '#059669', rejected: '#DC2626', voided: '#9CA3AF',
};

export function formatRWF(n) {
  if (n == null || isNaN(n)) return 'RWF 0';
  const abs = Math.abs(Number(n));
  return `${n < 0 ? '-' : ''}RWF ${abs.toLocaleString('en-RW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function alertMsg(title, msg) {
  if (Platform.OS === 'web') window.alert(`${title}: ${msg}`);
  else Alert.alert(title, msg);
}

export function KPICard({ icon, label, value, color, bgColor, onPress }) {
  return (
    <Pressable style={s.kpiCard} onPress={onPress} disabled={!onPress}>
      <View style={[s.kpiIcon, { backgroundColor: bgColor }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={[s.kpiValue, { color }]}>{value}</Text>
    </Pressable>
  );
}

export function SectionHeader({ title, children }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function Chip({ label, active, onPress }) {
  return (
    <Pressable style={[s.chip, active && s.chipActive]} onPress={onPress}>
      <Text style={[s.chipLabel, active && s.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export function StatusBadge({ status }) {
  const c = STATUS_COLOR[status] || '#6B7280';
  return (
    <View style={[s.badge, { backgroundColor: `${c}22` }]}>
      <Text style={[s.badgeText, { color: c }]}>{(status || '').replace(/_/g, ' ')}</Text>
    </View>
  );
}

export function SettingRow({ icon, title, desc, onPress }) {
  return (
    <Pressable style={s.settingRow} onPress={onPress} disabled={!onPress}>
      <View style={s.settingIcon}>
        <MaterialCommunityIcons name={icon} size={18} color={FIN.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.settingTitle}>{title}</Text>
        <Text style={s.settingDesc}>{desc}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={16} color={onPress ? colors.blue300 : colors.textMuted} />
    </Pressable>
  );
}

export function DropdownField({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => String(o.value) === String(value));
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <Pressable style={s.dropdown} onPress={() => setOpen(!open)}>
        <Text style={[s.dropdownText, !selected && { color: colors.textMuted }]}>
          {selected ? selected.label : 'Select...'}
        </Text>
        <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.blue300} />
      </Pressable>
      {open && (
        <View style={s.dropdownList}>
          {options.map(o => (
            <Pressable key={o.value} style={s.dropdownItem} onPress={() => { onChange(o.value); setOpen(false); }}>
              <Text style={[s.dropdownItemText, String(o.value) === String(value) && { color: FIN.primary, fontWeight: '600' }]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export function FormField({ label, value, onChangeText, placeholder, multiline, keyboardType }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.formInput, multiline && { height: 70, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

export function EmptyState({ icon, text, sub }) {
  return (
    <View style={s.emptyPanel}>
      <MaterialCommunityIcons name={icon || 'inbox-outline'} size={36} color={colors.blue300} />
      <Text style={s.emptyPanelText}>{text}</Text>
      {sub ? <Text style={[s.emptyPanelText, { marginTop: 4 }]}>{sub}</Text> : null}
    </View>
  );
}

export function ActionBtn({ label, color, onPress }) {
  return (
    <Pressable style={[s.actionBtn, { borderColor: color }]} onPress={onPress}>
      <Text style={[s.actionBtnLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function ReportLine({ label, amount, bold, color }) {
  return (
    <View style={s.reportRow}>
      <Text style={[s.td, { flex: 2, fontWeight: bold ? '700' : '400', color: color || colors.white }]}>{label}</Text>
      <Text style={[s.td, { flex: 1, textAlign: 'right', fontWeight: bold ? '700' : '400', color: color || colors.white }]}>{formatRWF(amount)}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: gutter, paddingVertical: spacing.md },
  topBarTitle: { ...typography.h3, color: colors.white },

  mobileTabs: { marginBottom: spacing.md },
  mobileTab: { paddingHorizontal: spacing.lg, paddingVertical: 8, borderRadius: radius.pill, marginRight: spacing.xs },
  mobileTabActive: { backgroundColor: 'rgba(55,138,221,0.25)' },
  mobileTabLabel: { ...typography.caption, color: colors.blue300 },
  mobileTabLabelActive: { color: colors.white, fontWeight: '600' },

  pageHeader: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center' },
  pageTitle: { fontSize: 18, fontWeight: '700', color: colors.white },
  pageSubtitle: { fontSize: 12, color: colors.blue300, marginTop: 2 },

  content: { padding: spacing.xl },

  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
  kpiCard: { flex: 1, minWidth: 160, backgroundColor: CARD_BG, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: CARD_BORDER },
  kpiIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  kpiLabel: { fontSize: 11, color: colors.blue300, marginBottom: spacing.xs },
  kpiValue: { fontSize: 20, fontWeight: '700' },

  panelsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
  panel: { flex: 1, minWidth: 260, backgroundColor: CARD_BG, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: CARD_BORDER, marginBottom: spacing.md },
  panelTitle: { fontSize: 14, fontWeight: '600', color: colors.white, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.white },
  viewAll: { fontSize: 13, fontWeight: '600', color: colors.blue500 },

  emptyPanel: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  emptyPanelText: { fontSize: 13, color: colors.blue300, marginTop: spacing.sm, textAlign: 'center' },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickAction: { alignItems: 'center', width: 85, paddingVertical: spacing.sm },
  quickIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  quickLabel: { fontSize: 11, color: colors.blue300, textAlign: 'center' },

  chip: { paddingHorizontal: spacing.lg, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER },
  chipActive: { backgroundColor: 'rgba(55,138,221,0.3)', borderColor: colors.blue500 },
  chipLabel: { fontSize: 13, color: colors.blue300 },
  chipLabelActive: { color: colors.white, fontWeight: '600' },

  filterRow: { flexDirection: 'row', gap: spacing.md },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: SURFACE, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: CARD_BORDER },
  filterBtnLabel: { fontSize: 12, color: colors.blue300 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 8, borderWidth: 1, borderColor: CARD_BORDER },
  searchInput: { flex: 1, fontSize: 13, color: colors.white, marginLeft: spacing.sm },

  inputBox: { backgroundColor: SURFACE, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 8, borderWidth: 1, borderColor: CARD_BORDER },
  inputText: { fontSize: 14, color: colors.white },

  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: SURFACE, borderRadius: radius.md, marginBottom: spacing.sm },
  th: { fontSize: 11, fontWeight: '600', color: colors.blue300, textTransform: 'uppercase', letterSpacing: 0.5 },

  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: CARD_BORDER, gap: spacing.md },
  txTableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: CARD_BORDER },
  txnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: CARD_BORDER, gap: spacing.md },
  txDesc: { fontSize: 14, fontWeight: '500', color: colors.white },
  txMeta: { fontSize: 11, color: colors.blue300, marginTop: 2 },
  txnDesc: { fontSize: 14, fontWeight: '500', color: colors.white },
  txnMeta: { fontSize: 11, color: colors.blue300, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txnAmount: { fontSize: 14, fontWeight: '700' },
  td: { fontSize: 13, color: colors.blue300 },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: 'rgba(251,191,36,0.1)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)' },
  alertText: { fontSize: 13, color: colors.blue300, flex: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalCard: { width: '100%', maxWidth: 540, backgroundColor: '#1a1f36', borderRadius: radius.lg, maxHeight: '90%', borderWidth: 1, borderColor: CARD_BORDER },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: CARD_BORDER },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.white },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, padding: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: CARD_BORDER },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.blue300, marginBottom: 4 },
  formInput: { backgroundColor: SURFACE, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.white, borderWidth: 1, borderColor: CARD_BORDER },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: SURFACE, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, borderWidth: 1, borderColor: CARD_BORDER },
  dropdownText: { fontSize: 14, color: colors.white },
  dropdownList: { backgroundColor: '#222842', borderRadius: radius.md, borderWidth: 1, borderColor: CARD_BORDER, marginTop: 4, maxHeight: 180 },
  dropdownItem: { paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: CARD_BORDER },
  dropdownItemText: { fontSize: 13, color: colors.blue300 },

  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: FIN.primary, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md },
  addBtnLabel: { fontSize: 13, fontWeight: '600', color: '#fff' },
  saveBtn: { backgroundColor: FIN.primary, paddingHorizontal: spacing.xl, paddingVertical: 10, borderRadius: radius.md, minWidth: 120, alignItems: 'center' },
  saveBtnLabel: { fontSize: 14, fontWeight: '600', color: '#fff' },
  cancelBtn: { paddingHorizontal: spacing.xl, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: CARD_BORDER },
  cancelBtnLabel: { fontSize: 14, color: colors.blue300 },
  actionBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1 },
  actionBtnLabel: { fontSize: 11, fontWeight: '600' },

  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: CARD_BORDER },
  settingIcon: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: 'rgba(37,99,235,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  settingTitle: { fontSize: 14, fontWeight: '600', color: colors.white },
  settingDesc: { fontSize: 12, color: colors.blue300, marginTop: 2 },

  contactAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(37,99,235,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  contactInitial: { fontSize: 16, fontWeight: '700', color: FIN.primary },

  reportSubHead: { fontSize: 14, fontWeight: '700', color: colors.white, marginBottom: spacing.sm, marginTop: spacing.sm },
  reportHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: CARD_BORDER, marginBottom: spacing.xs },
  reportRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  reportDivider: { height: 1, backgroundColor: CARD_BORDER, marginVertical: spacing.md },
});
