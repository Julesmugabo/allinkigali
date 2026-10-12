/**
 * NewsShared.js — Shared styles, color tokens, utility helpers, and small
 * reusable components used by every News Admin dashboard section.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Alert, Platform } from 'react-native';
import { colors, spacing } from '../../../theme';

// ── Color palette ─────────────────────────────────────────────────────────────
export const NEWS = {
  primary:    '#1A73E8',
  primaryBg:  '#E8F0FE',
  success:    '#1E8E3E',
  successBg:  '#E6F4EA',
  warning:    '#F29900',
  warningBg:  '#FEF7E0',
  danger:     '#D93025',
  dangerBg:   '#FCE8E6',
  purple:     '#7B2FBE',
  purpleBg:   '#F3E8FD',
  teal:       '#007B83',
  tealBg:     '#E0F5F5',
  muted:      '#5F6368',
  border:     '#E0E0E0',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtNum(n) {
  if (n === null || n === undefined) return '0';
  return Number(n).toLocaleString();
}

export function alertMsg(title, msg) {
  if (Platform.OS === 'web') { window.alert(`${title}: ${msg}`); } else { Alert.alert(title, msg); }
}

// ── Shared reusable components ─────────────────────────────────────────────────
export function SectionHeader({ title, icon, children }) {
  return (
    <View style={s.sectionHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {icon && <MaterialCommunityIcons name={icon} size={20} color={NEWS.primary} />}
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {children && <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>{children}</View>}
    </View>
  );
}

export function KpiCard({ icon, label, value, color, bg }) {
  const c = color || NEWS.primary;
  const b = bg || NEWS.primaryBg;
  return (
    <View style={[s.kpiCard, { borderLeftColor: c }]}>
      <View style={[s.kpiIcon, { backgroundColor: b }]}>
        <MaterialCommunityIcons name={icon} size={20} color={c} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.kpiValue}>{value}</Text>
        <Text style={s.kpiLabel}>{label}</Text>
      </View>
    </View>
  );
}

export function AlertBanner({ icon, text, color }) {
  return (
    <View style={[s.alertBanner, { borderLeftColor: color || NEWS.warning }]}>
      <MaterialCommunityIcons name={icon || 'alert-outline'} size={16} color={color || NEWS.warning} />
      <Text style={[s.alertText, { color: color || NEWS.warning }]}>{text}</Text>
    </View>
  );
}

export function EmptyState({ icon, text, sub }) {
  return (
    <View style={s.emptyState}>
      <MaterialCommunityIcons name={icon || 'inbox-outline'} size={40} color={NEWS.muted} />
      <Text style={s.emptyText}>{text}</Text>
      {sub ? <Text style={s.emptySub}>{sub}</Text> : null}
    </View>
  );
}

export function StatusBadge({ status }) {
  const map = {
    published: { color: NEWS.success, bg: NEWS.successBg, label: 'Published' },
    draft:     { color: NEWS.muted,   bg: '#F1F3F4',     label: 'Draft' },
    pending:   { color: NEWS.warning, bg: NEWS.warningBg, label: 'Pending' },
    archived:  { color: NEWS.danger,  bg: NEWS.dangerBg,  label: 'Archived' },
    active:    { color: NEWS.success, bg: NEWS.successBg, label: 'Active' },
    paused:    { color: NEWS.warning, bg: NEWS.warningBg, label: 'Paused' },
    ended:     { color: NEWS.muted,   bg: '#F1F3F4',     label: 'Ended' },
  };
  const m = map[status] || map.draft;
  return (
    <View style={[s.badge, { backgroundColor: m.bg }]}>
      <Text style={[s.badgeText, { color: m.color }]}>{m.label}</Text>
    </View>
  );
}

export function ActionBtn({ label, icon, onPress, color, disabled }) {
  const c = color || NEWS.primary;
  return (
    <Pressable
      style={[s.actionBtn, { backgroundColor: c, opacity: disabled ? 0.5 : 1 }]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && <MaterialCommunityIcons name={icon} size={15} color="#fff" />}
      <Text style={s.actionBtnText}>{label}</Text>
    </Pressable>
  );
}

export function FilterBtn({ label, icon, onPress, active }) {
  return (
    <Pressable style={[s.filterBtn, active && { backgroundColor: NEWS.primaryBg, borderColor: NEWS.primary }]} onPress={onPress}>
      {icon && <MaterialCommunityIcons name={icon} size={15} color={active ? NEWS.primary : NEWS.muted} />}
      <Text style={[s.filterBtnLabel, active && { color: NEWS.primary }]}>{label}</Text>
    </Pressable>
  );
}

// ── Shared StyleSheet ─────────────────────────────────────────────────────────
export const s = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.md, flexWrap: 'wrap', gap: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },

  panel: {
    backgroundColor: colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: NEWS.border,
    marginBottom: spacing.lg, overflow: 'hidden',
  },

  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  kpiCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: 10,
    padding: spacing.md, flex: 1, minWidth: 140,
    borderLeftWidth: 3, borderWidth: 1, borderColor: NEWS.border,
  },
  kpiIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  kpiLabel: { fontSize: 12, color: NEWS.muted, marginTop: 2 },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: NEWS.warningBg, borderRadius: 8,
    padding: spacing.sm, marginBottom: spacing.md,
    borderLeftWidth: 3, borderLeftColor: NEWS.warning,
  },
  alertText: { fontSize: 13, color: NEWS.warning, flex: 1 },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: spacing.sm },
  emptyText: { fontSize: 15, fontWeight: '600', color: NEWS.muted },
  emptySub: { fontSize: 13, color: NEWS.muted, textAlign: 'center', maxWidth: 280 },

  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderWidth: 1, borderColor: NEWS.border, backgroundColor: colors.surface,
  },
  filterBtnLabel: { fontSize: 13, color: NEWS.muted },

  row: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: 1, borderColor: NEWS.border,
  },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  rowMeta: { fontSize: 12, color: NEWS.muted, marginTop: 2 },

  input: {
    borderWidth: 1, borderColor: NEWS.border, borderRadius: 8,
    padding: spacing.sm, fontSize: 14, color: colors.text,
    backgroundColor: colors.surface, marginBottom: spacing.sm,
  },
  inputLabel: { fontSize: 12, fontWeight: '600', color: NEWS.muted, marginBottom: 4 },

  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 99,
    justifyContent: 'center', alignItems: 'center',
  },
  modalBox: {
    backgroundColor: colors.surface, borderRadius: 16,
    padding: spacing.lg, width: '90%', maxWidth: 480,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
});
