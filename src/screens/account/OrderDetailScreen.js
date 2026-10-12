/**
 * OrderDetailScreen.js — Aho icyifuzo kigeze (order tracking).
 *
 * Reference, live status timeline, what was ordered, where it's going, totals,
 * and the option to call it off while it's still at the depot.
 */
import React, { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { showAlert } from '../../utils/showAlert';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import OrderTimeline from '../../components/account/OrderTimeline';
import PrimaryButton from '../../components/common/PrimaryButton';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';

import { useOrders } from '../../context/OrdersContext';
import { getStatusMeta, canCancel } from '../../data/orderStatus';
import { formatPrice } from '../../utils/format';
import { formatDateTime } from '../../utils/date';
import { colors, typography, spacing, radius, gutter } from '../../theme';

export default function OrderDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { getOrderById, cancelOrder, advanceStatus } = useOrders();

  const { orderId, justPlaced } = route.params || {};
  const order = getOrderById(orderId);

  const handleCancel = useCallback(() => {
    showAlert('Cancel order', 'Do you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel it',
        style: 'destructive',
        onPress: () => cancelOrder(orderId),
      },
    ]);
  }, [cancelOrder, orderId]);

  if (!order) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="file-search-outline"
          title="Order not found"
          actionLabel="Go back"
          onActionPress={() => navigation.goBack()}
          style={{ marginTop: insets.top + spacing.huge }}
        />
      </View>
    );
  }

  const status = getStatusMeta(order.status);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Navy header ------------------------------------------------ */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textOnNavy} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.ref}>{order.ref}</Text>
              <Text style={styles.date}>{formatDateTime(order.createdAt)}</Text>
            </View>
            <Badge
              label={status.label}
              icon={status.icon}
              color={status.color}
              backgroundColor={status.tint}
            />
          </View>

          {justPlaced ? (
            <View style={styles.confirmation}>
              <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
              <Text style={styles.confirmationText}>
                Your order has been sent. We will call you to confirm it.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          {/* --- Tracking ------------------------------------------------ */}
          <Text style={styles.sectionLabel}>Order status</Text>
          <View style={styles.card}>
            <OrderTimeline order={order} />
          </View>

          {/* --- Items --------------------------------------------------- */}
          <Text style={styles.sectionLabel}>What you ordered</Text>
          <View style={styles.card}>
            {order.items.map((item, index) => (
              <View
                key={item.productId}
                style={[styles.item, index < order.items.length - 1 && styles.itemDivider]}
              >
                <View style={styles.itemIcon}>
                  <MaterialCommunityIcons
                    name={item.icon || 'package-variant'}
                    size={20}
                    color={colors.blue600}
                  />
                </View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} × {formatPrice(item.price)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            ))}
          </View>

          {/* --- Delivery ------------------------------------------------ */}
          <Text style={styles.sectionLabel}>Delivery details</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={17} color={colors.blue600} />
              <Text style={styles.infoText}>{order.deliveryAddress || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="phone-outline" size={17} color={colors.blue600} />
              <Text style={styles.infoText}>{order.phone || '—'}</Text>
            </View>
            {order.note ? (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="note-text-outline" size={17} color={colors.blue600} />
                <Text style={styles.infoText}>{order.note}</Text>
              </View>
            ) : null}
          </View>

          {/* --- Money --------------------------------------------------- */}
          <Text style={styles.sectionLabel}>Payment</Text>
          <View style={styles.card}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Items</Text>
              <Text style={styles.totalValue}>{formatPrice(order.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delivery</Text>
              <Text style={styles.totalValue}>
                {order.deliveryFee === 0 ? 'Free' : formatPrice(order.deliveryFee)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.grandLabel}>Total</Text>
              <Text style={styles.grandValue}>{formatPrice(order.total)}</Text>
            </View>
            <View style={styles.paymentNote}>
              <MaterialCommunityIcons name="cash-multiple" size={15} color={colors.textSecondary} />
              <Text style={styles.paymentNoteText}>
                {order.paymentMethod
                  ? order.paymentMethod
                  : 'Pay when your order is delivered'}
              </Text>
            </View>
          </View>

          {canCancel(order.status) ? (
            <PrimaryButton
              label="Cancel order"
              icon="close"
              variant="ghost"
              onPress={handleCancel}
            />
          ) : null}

          {/* DEV HELPER — remove once real status updates come from the API. */}
          {__DEV__ ? (
            <Pressable onPress={() => advanceStatus(order.id)} style={styles.devButton}>
              <MaterialCommunityIcons name="fast-forward" size={14} color={colors.textMuted} />
              <Text style={styles.devLabel}>DEV: next step</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingBottom: spacing.xl },
  header: {
    backgroundColor: colors.navy800,
    paddingHorizontal: gutter,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, marginLeft: spacing.md },
  ref: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
  date: { ...typography.meta, color: colors.textOnNavyFaint, marginTop: 2 },
  confirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46,158,91,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(46,158,91,0.4)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  confirmationText: {
    flex: 1,
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
    color: '#BFE7CE',
    marginLeft: spacing.sm,
  },
  body: { paddingHorizontal: gutter, paddingTop: spacing.xl },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.blue600,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg - 2,
    marginBottom: spacing.xl,
  },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  itemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: { flex: 1, marginHorizontal: spacing.md },
  itemName: { ...typography.body, fontSize: 13.5, fontWeight: '500', color: colors.navy800 },
  itemMeta: { ...typography.meta, color: colors.textMuted, marginTop: 2 },
  itemTotal: { ...typography.bodyStrong, fontSize: 13.5, color: colors.navy800 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.sm - 2 },
  infoText: {
    flex: 1,
    ...typography.body,
    fontSize: 13.5,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
  },
  totalLabel: { ...typography.body, fontSize: 13.5, color: colors.textSecondary },
  totalValue: { ...typography.body, fontSize: 13.5, fontWeight: '600', color: colors.navy800 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  grandLabel: { ...typography.bodyStrong, color: colors.navy800 },
  grandValue: { ...typography.price, color: colors.navy800 },
  paymentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  paymentNoteText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
    opacity: 0.6,
  },
  devLabel: { ...typography.meta, color: colors.textMuted, marginLeft: 5 },
});
