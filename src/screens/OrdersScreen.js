/**
 * OrdersScreen.js — Urutonde rw'ibyo watumije.
 * Two filters: still coming, and finished. Tap a card to see its tracking.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import OrderCard from '../components/account/OrderCard';
import EmptyState from '../components/common/EmptyState';
import { useOrders } from '../context/OrdersContext';
import { colors, typography, spacing, radius, gutter } from '../theme';

const FILTERS = [
  { key: 'active', label: 'Biri mu nzira' },
  { key: 'past', label: 'Byarangiye' },
];

export default function OrdersScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { activeOrders, pastOrders } = useOrders();

  const initialFilter = route.params && route.params.filter ? route.params.filter : 'active';
  const [filter, setFilter] = useState(initialFilter);

  const data = useMemo(
    () => (filter === 'active' ? activeOrders : pastOrders),
    [filter, activeOrders, pastOrders]
  );

  const openOrder = useCallback(
    (order) => navigation.navigate('OrderDetail', { orderId: order.id }),
    [navigation]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Subira inyuma"
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textOnNavy} />
          </Pressable>
          <Text style={styles.title}>Ibyo natumije</Text>
        </View>

        <View style={styles.filters}>
          {FILTERS.map((item) => {
            const isActive = item.key === filter;
            const count = item.key === 'active' ? activeOrders.length : pastOrders.length;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                style={[styles.filter, isActive && styles.filterActive]}
              >
                <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                  {item.label}
                </Text>
                {count ? (
                  <View style={[styles.filterCount, isActive && styles.filterCountActive]}>
                    <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
                      {count}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} onPress={openOrder} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          filter === 'active' ? (
            <EmptyState
              icon="basket-outline"
              title="Nta cyifuzo kiri mu nzira"
              message="Iyo utumije gaz, uzabona aho igeze hano."
            />
          ) : (
            <EmptyState
              icon="history"
              title="Nta cyifuzo cyarangiye"
              message="Ibyakugezeho byose bizajya bigaragara hano."
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.navy800,
    paddingHorizontal: gutter,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.3,
  },
  filters: { flexDirection: 'row' },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.25)',
    marginRight: spacing.sm,
  },
  filterActive: {
    backgroundColor: colors.blue500,
    borderColor: colors.blue500,
  },
  filterLabel: {
    ...typography.caption,
    fontSize: 12.5,
    color: colors.blue300,
    fontWeight: '600',
  },
  filterLabelActive: { color: colors.white },
  filterCount: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: 'rgba(133,183,235,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterCountText: { fontSize: 10.5, fontWeight: '700', color: colors.blue300 },
  filterCountTextActive: { color: colors.white },
  content: {
    paddingHorizontal: gutter,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
