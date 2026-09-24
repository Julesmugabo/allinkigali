/**
 * AdminArticleRow.js — Umurongo w'inkuru mu buyobozi bw'amakuru.
 *
 * Four modes:
 *   mode="manage"   -> edit / delete (the All Articles list)
 *   mode="approve"  -> approve / reject (the Pending Approval queue)
 *   mode="select"   -> a checkbox instead of actions (multi-select to archive)
 *   mode="archived" -> restore (the Archived list) — never deletes anything
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import ArticleLabels from '../news/ArticleLabels';
import { timeAgo } from '../../utils/date';
import { colors, typography, spacing, radius } from '../../theme';

const STATUS_META = {
  published: { label: 'Published', color: colors.success },
  draft: { label: 'Draft', color: colors.warning },
  pending: { label: 'Pending', color: colors.blue500 },
  rejected: { label: 'Rejected', color: colors.danger },
};

export default function AdminArticleRow({
  article,
  categoryLabel,
  mode = 'manage',
  onEdit,
  onDelete,
  onApprove,
  onReject,
  selected = false,
  onToggleSelect,
  onRestore,
  onToggleBreaking,
}) {
  const status = STATUS_META[article.status] || STATUS_META.draft;
  const isSelect = mode === 'select';

  const content = (
    <View style={[styles.row, isSelect && selected && styles.rowSelected]}>
      <View style={styles.top}>
        {isSelect ? (
          <MaterialCommunityIcons
            name={selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={20}
            color={selected ? colors.blue500 : colors.blue300}
            style={styles.icon}
          />
        ) : (
          <MaterialCommunityIcons
            name={article.icon || 'newspaper-variant-outline'}
            size={18}
            color={colors.blue300}
            style={styles.icon}
          />
        )}
        <Text style={styles.title} numberOfLines={2}>
          {article.title}
        </Text>
      </View>

      <View style={styles.metaRow}>
        {categoryLabel ? <Text style={styles.category}>{categoryLabel}</Text> : null}
        <Text style={styles.meta}>
          {article.source} · {timeAgo(article.publishedAt)} · {article.views || 0} views
        </Text>
      </View>

      <ArticleLabels article={article} style={styles.labels} />

      <View style={styles.footer}>
        <View style={[styles.statusBadge, { backgroundColor: `${status.color}22` }]}>
          <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
        </View>

        {mode === 'approve' ? (
          <View style={styles.actions}>
            <Pressable onPress={() => onReject(article.id)} style={styles.ghostAction} accessibilityRole="button">
              <Text style={styles.ghostLabel}>Reject</Text>
            </Pressable>
            <Pressable onPress={() => onApprove(article.id)} style={styles.approveAction} accessibilityRole="button">
              <MaterialCommunityIcons name="check" size={13} color={colors.success} />
              <Text style={styles.approveLabel}>Approve</Text>
            </Pressable>
          </View>
        ) : mode === 'archived' ? (
          <View style={styles.actions}>
            <Pressable onPress={() => onRestore(article.id)} style={styles.approveAction} accessibilityRole="button">
              <MaterialCommunityIcons name="archive-arrow-up-outline" size={14} color={colors.success} />
              <Text style={styles.approveLabel}>Restore</Text>
            </Pressable>
          </View>
        ) : isSelect ? null : (
          <View style={styles.actions}>
            {onToggleBreaking ? (
              <Pressable
                onPress={() => onToggleBreaking(article)}
                style={[styles.iconAction, article.isBreaking && styles.breakingOn]}
                accessibilityRole="button"
                accessibilityLabel={article.isBreaking ? 'Remove breaking label' : 'Mark as breaking'}
              >
                <MaterialCommunityIcons
                  name="flash"
                  size={16}
                  color={article.isBreaking ? colors.white : colors.blue300}
                />
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => onEdit(article)}
              style={styles.iconAction}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${article.title}`}
            >
              <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.blue300} />
            </Pressable>
            <Pressable
              onPress={() => onDelete(article)}
              style={[styles.iconAction, styles.deleteAction]}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${article.title}`}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.danger} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );

  if (!isSelect) return content;

  return (
    <Pressable
      onPress={() => onToggleSelect(article.id)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={article.title}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rowSelected: { backgroundColor: 'rgba(55,138,221,0.18)', borderColor: colors.blue500 },
  top: { flexDirection: 'row', alignItems: 'flex-start' },
  icon: { marginTop: 1, marginRight: spacing.sm },
  title: { flex: 1, ...typography.body, fontSize: 13.5, fontWeight: '600', color: colors.white, lineHeight: 19 },
  metaRow: { marginTop: spacing.sm },
  category: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.blue500,
    textTransform: 'uppercase',
  },
  meta: { ...typography.caption, fontSize: 11, color: colors.textOnNavyFaint, marginTop: 2 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  statusLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconAction: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  labels: { marginTop: spacing.sm },
  breakingOn: { backgroundColor: colors.breaking },
  deleteAction: { backgroundColor: 'rgba(208,52,44,0.16)' },
  ghostAction: { paddingHorizontal: spacing.sm, height: 30, justifyContent: 'center' },
  ghostLabel: { fontSize: 12, color: colors.textOnNavyFaint },
  approveAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46,158,91,0.22)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 30,
    marginLeft: spacing.sm,
  },
  approveLabel: { fontSize: 12, fontWeight: '600', color: colors.success, marginLeft: 4 },
});
