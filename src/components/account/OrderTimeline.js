/**
 * OrderTimeline.js — Aho icyifuzo kigeze.
 * Vertical stepper showing the four delivery stages. Steps already reached are
 * solid; the current one is ringed; future steps are faint.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { STATUS_FLOW, STATUS_META, ORDER_STATUS, statusIndex } from '../../data/orderStatus';
import { formatDateTime } from '../../utils/date';
import { colors, typography, spacing, radius } from '../../theme';

export default function OrderTimeline({ order }) {
  if (!order) return null;

  const isCancelled = order.status === ORDER_STATUS.CANCELLED;
  const currentIndex = isCancelled ? -1 : statusIndex(order.status);

  // Look up when each step happened, if it has.
  const timeFor = (status) => {
    const entry = (order.history || []).find((h) => h.status === status);
    return entry ? formatDateTime(entry.at) : null;
  };

  if (isCancelled) {
    const meta = STATUS_META[ORDER_STATUS.CANCELLED];
    return (
      <View style={[styles.cancelled, { backgroundColor: meta.tint }]}>
        <MaterialCommunityIcons name={meta.icon} size={22} color={meta.color} />
        <View style={styles.cancelledText}>
          <Text style={[styles.cancelledTitle, { color: meta.color }]}>{meta.label}</Text>
          <Text style={styles.cancelledBody}>{meta.description}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {STATUS_FLOW.map((status, index) => {
        const meta = STATUS_META[status];
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;
        const isLast = index === STATUS_FLOW.length - 1;
        const at = timeFor(status);

        return (
          <View key={status} style={styles.step}>
            <View style={styles.railColumn}>
              <View
                style={[
                  styles.node,
                  isDone && styles.nodeDone,
                  isCurrent && [styles.nodeCurrent, { borderColor: meta.color }],
                  isFuture && styles.nodeFuture,
                ]}
              >
                <MaterialCommunityIcons
                  name={isDone ? 'check' : meta.icon}
                  size={isCurrent ? 16 : 14}
                  color={isFuture ? colors.textMuted : isCurrent ? meta.color : colors.white}
                />
              </View>

              {!isLast ? (
                <View style={[styles.rail, isDone && styles.railDone]} />
              ) : null}
            </View>

            <View style={[styles.content, isLast && styles.contentLast]}>
              <Text style={[styles.label, isFuture && styles.labelFuture]}>{meta.label}</Text>
              <Text style={[styles.description, isFuture && styles.descriptionFuture]}>
                {meta.description}
              </Text>
              {at ? <Text style={styles.time}>{at}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const NODE_SIZE = 30;

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.xs },
  step: { flexDirection: 'row' },
  railColumn: { alignItems: 'center', width: NODE_SIZE },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue500,
  },
  nodeDone: { backgroundColor: colors.success },
  nodeCurrent: {
    backgroundColor: colors.white,
    borderWidth: 2,
  },
  nodeFuture: {
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rail: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  railDone: { backgroundColor: colors.success },
  content: {
    flex: 1,
    marginLeft: spacing.md,
    paddingBottom: spacing.xl,
  },
  contentLast: { paddingBottom: 0 },
  label: {
    ...typography.bodyStrong,
    color: colors.navy800,
  },
  labelFuture: { color: colors.textMuted, fontWeight: '500' },
  description: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  descriptionFuture: { color: colors.textMuted },
  time: {
    ...typography.meta,
    color: colors.blue600,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  cancelled: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  cancelledText: { flex: 1, marginLeft: spacing.md },
  cancelledTitle: { ...typography.bodyStrong },
  cancelledBody: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
